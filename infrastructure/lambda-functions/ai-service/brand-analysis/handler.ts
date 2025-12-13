/**
 * AI Service - Brand Analysis Lambda Handler
 * Handles competitor analysis, NAP audit, and brand-related AI tasks
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getCurrentUserFromEvent } from '@/aws/auth/lambda-auth';
import { wrapLambdaHandler } from '@/aws/lambda/wrapper';
import { getRepository } from '@/aws/dynamodb/repository';

// Import AI flows
import { findCompetitors, enrichCompetitorData } from '@/aws/bedrock/flows/find-competitors';
import { runNapAudit } from '@/aws/bedrock/flows/run-nap-audit';
import { generateAgentBio } from '@/aws/bedrock/flows/generate-agent-bio';
import { generateMarketingPlan } from '@/aws/bedrock/flows/generate-marketing-plan';

// Import schemas
import { FindCompetitorsInputSchema, EnrichCompetitorDataInputSchema } from '@/ai/schemas/competitor-analysis-schemas';
import { RunNapAuditInputSchema } from '@/ai/schemas/nap-audit-schemas';
import { GenerateAgentBioInputSchema } from '@/ai/schemas/agent-bio-schemas';
import { GenerateMarketingPlanInputSchema } from '@/ai/schemas/marketing-plan-schemas';

interface BrandAnalysisRequest {
    type: 'find-competitors' | 'enrich-competitor' | 'nap-audit' | 'agent-bio' | 'marketing-plan';
    input: any;
}

export const handler = wrapLambdaHandler(async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const user = await getCurrentUserFromEvent(event);
    if (!user) {
        return {
            statusCode: 401,
            body: JSON.stringify({ error: 'Unauthorized' }),
        };
    }

    if (!event.body) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Request body is required' }),
        };
    }

    try {
        const request: BrandAnalysisRequest = JSON.parse(event.body);
        const repository = getRepository();

        let result;

        switch (request.type) {
            case 'find-competitors':
                const findInput = FindCompetitorsInputSchema.parse(request.input);
                result = await findCompetitors(findInput);
                break;

            case 'enrich-competitor':
                const enrichInput = EnrichCompetitorDataInputSchema.parse(request.input);
                result = await enrichCompetitorData(enrichInput);
                break;

            case 'nap-audit':
                const napInput = RunNapAuditInputSchema.parse(request.input);
                result = await runNapAudit(napInput);

                // Save audit results to DynamoDB
                if (result) {
                    const auditKeys = {
                        PK: `USER#${user.userId}`,
                        SK: 'NAP_AUDIT',
                    };

                    await repository.create(
                        auditKeys.PK,
                        auditKeys.SK,
                        'NapAudit',
                        {
                            userId: user.userId,
                            auditResults: result,
                            lastAuditDate: new Date().toISOString(),
                        }
                    );
                }
                break;

            case 'agent-bio':
                const bioInput = GenerateAgentBioInputSchema.parse(request.input);
                result = await generateAgentBio(bioInput);
                break;

            case 'marketing-plan':
                const planInput = GenerateMarketingPlanInputSchema.parse(request.input);
                result = await generateMarketingPlan(planInput);
                break;

            default:
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: 'Invalid brand analysis type' }),
                };
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                success: true,
                data: result,
            }),
        };
    } catch (error: any) {
        console.error('Brand analysis error:', error);

        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Brand analysis failed',
                message: error.message,
            }),
        };
    }
});