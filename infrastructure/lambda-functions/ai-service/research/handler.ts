/**
 * AI Service - Research Lambda Handler
 * Handles research agent and analysis requests
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getCurrentUserFromEvent } from '@/aws/auth/lambda-auth';
import { wrapLambdaHandler } from '@/aws/lambda/wrapper';
import { getRepository } from '@/aws/dynamodb/repository';
import { getResearchReportKeys } from '@/aws/dynamodb/keys';

// Import AI flows
import { runResearchAgent } from '@/aws/bedrock/flows/run-research-agent';
import { runPropertyValuation } from '@/aws/bedrock/flows/property-valuation';
import { runRenovationROIAnalysis } from '@/aws/bedrock/flows/renovation-roi';

// Import schemas
import { RunResearchAgentInputSchema } from '@/ai/schemas/research-agent-schemas';
import { PropertyValuationInputSchema } from '@/ai/schemas/property-valuation-schemas';
import { RenovationROIInputSchema } from '@/ai/schemas/renovation-roi-schemas';

interface ResearchRequest {
    type: 'research-agent' | 'property-valuation' | 'renovation-roi';
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
        const request: ResearchRequest = JSON.parse(event.body);
        const repository = getRepository();

        let result;
        let reportId: string | undefined;

        switch (request.type) {
            case 'research-agent':
                const researchInput = RunResearchAgentInputSchema.parse(request.input);
                result = await runResearchAgent(researchInput);

                // Save research report to DynamoDB
                if (result) {
                    reportId = `research-${Date.now()}`;
                    const reportKeys = getResearchReportKeys(user.userId, reportId);

                    await repository.create(
                        reportKeys.PK,
                        reportKeys.SK,
                        'ResearchReport',
                        {
                            reportId,
                            userId: user.userId,
                            query: researchInput.query,
                            result,
                            source: 'research-agent',
                            createdAt: new Date().toISOString(),
                        }
                    );
                }
                break;

            case 'property-valuation':
                const valuationInput = PropertyValuationInputSchema.parse(request.input);
                result = await runPropertyValuation(valuationInput);
                break;

            case 'renovation-roi':
                const roiInput = RenovationROIInputSchema.parse(request.input);
                result = await runRenovationROIAnalysis(roiInput);
                break;

            default:
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: 'Invalid research type' }),
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
                reportId,
            }),
        };
    } catch (error: any) {
        console.error('Research error:', error);

        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Research failed',
                message: error.message,
            }),
        };
    }
});