# AgentCore Implementation Guide

This guide consolidates all AgentCore-related implementation details, migration plans, and lessons learned.

## Overview

AWS Bedrock AgentCore provides managed infrastructure for AI agents with built-in observability, session management, and scalability. This document covers our migration journey from custom AgentCore implementation to AWS Bedrock AgentCore.

## Current Status: Alternative Approach Adopted

**Decision**: After encountering initialization timeout issues with AgentCore Runtime, we adopted a simplified approach focusing on existing Bedrock flows while planning future migration to standard Bedrock Agents.

### Why AgentCore Runtime Didn't Work

**Technical Issues**:

- Package size: 50MB (too large for fast cold starts)
- Initialization timeout: >30 seconds (exceeds limits)
- Heavy dependencies: bedrock-agentcore and strands-agents caused loading delays
- Limited documentation and debugging capabilities

**Root Cause**: Python imports and dependency loading took too long in AgentCore Runtime environment.

## Alternative Solutions Evaluated

### Option 1: Standard Bedrock Agents (Recommended for Future)

**Pros**:

- Well-documented and mature service
- Better cold start performance
- More control over dependencies
- Easier debugging and monitoring

**Cons**:

- Different architecture from AgentCore
- More AWS resources required
- Need to refactor existing code

**Implementation Approach**:

1. Create Bedrock Agent (not AgentCore)
2. Define action groups for custom logic
3. Use Lambda functions for complex operations
4. Maintain same server actions interface

### Option 2: Simplified Agent Code (Attempted)

**Approach**: Remove heavy dependencies, use direct Bedrock API calls

```python
# Minimal agent with only boto3
import json
import boto3

bedrock = boto3.client('bedrock-runtime', region_name='us-west-2')

def invoke(payload):
    query = payload.get("query", "")

    response = bedrock.invoke_model(
        modelId='us.anthropic.claude-3-5-sonnet-20241022-v2:0',
        body=json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 4096,
            "messages": [{"role": "user", "content": query}]
        })
    )

    result = json.loads(response['body'].read())
    return {"answer": result['content'][0]['text']}
```

**Result**: Still encountered initialization issues due to AgentCore Runtime environment constraints.

### Option 3: Continue with Existing Flows (Current Approach)

**Decision**: Focus on optimizing existing Bedrock flows rather than fighting AgentCore Runtime issues.

**Benefits**:

- Already working and production-ready
- No migration complexity
- Can focus on user value and features
- Proven performance and reliability

## Original Migration Plan

### Planned Architecture

```
Next.js Application
    ↓
Server Actions (validation)
    ↓
AWS Bedrock AgentCore Runtime (Python Agents)
├── Research Agent (RAG capabilities)
├── Content Generator (all content types)
└── Knowledge Retriever (document search)
    ↓
AWS Services (Bedrock, DynamoDB, S3, CloudWatch)
```

### Planned Benefits

- **Built-in Observability**: OpenTelemetry traces, CloudWatch metrics
- **Managed Infrastructure**: No maintenance overhead
- **Session Management**: Automatic conversation tracking
- **Memory Persistence**: Built-in context management
- **Scalability**: Isolated microVMs per session

### Migration Phases (Not Completed)

#### Phase 1: Foundation

- Install AgentCore CLI and prerequisites
- Enable CloudWatch Transaction Search
- Deploy first simple agent
- Update SAM template with AgentCore resources

#### Phase 2: Research Agent Migration

- Port research agent logic to Python
- Implement RAG functionality
- Update server actions to use AgentCore client
- Verify observability in CloudWatch

#### Phase 3: Content Generator Migration

- Consolidate 60+ content flows into single agent
- Implement content type routing
- Update all content generation actions
- Deprecate old flows

#### Phase 4: Cleanup

- Migrate knowledge retriever
- Remove old TypeScript agent code
- Update documentation
- Deploy to production

## Lessons Learned

### What We Learned About AgentCore Runtime

**Challenges**:

- Initialization timeout issues persist even with minimal dependencies
- Package size limitations are strict
- Cold start performance is critical
- Documentation and debugging tools are limited
- Service is relatively new with fewer examples

**What Works Well**:

- Built-in observability features are comprehensive
- Session management capabilities are robust
- Scalability model is sound
- Integration with other AWS services is seamless

### What Works Well in Current Implementation

**Existing Bedrock Flows**:

- Fast response times (5-10 seconds)
- Reliable performance
- Easy to debug and maintain
- Well-understood architecture
- Production-proven

**Current Observability**:

- CloudWatch logging for all flows
- Error tracking and monitoring
- Performance metrics collection
- Custom dashboards and alerts

## Current Implementation Details

### Memory System Status

**Chatbot/Assistant HAS Memory**:

- Conversation history stored in localStorage per user
- Multiple chat sessions supported
- Session management (new, edit, delete)
- Message history persistence
- User-specific storage

**Content Generation DON'T Have Memory** (by design):

- Each generation is independent
- No context from previous generations
- Stateless operations for predictable results

### Memory Architecture

```
User sends message
    ↓
Load conversation history from localStorage
    ↓
Send message + history to Bedrock
    ↓
Get response
    ↓
Append to history
    ↓
Save to localStorage
```

**Storage**: Browser localStorage (client-side)

**Pros**:

- Simple implementation
- Fast (no server calls)
- Works offline
- No storage costs

**Cons**:

- Limited to browser
- Lost if cache cleared
- Not synced across devices
- No server-side persistence

## Future Recommendations

### Short Term (Current Quarter)

**Focus on Value**:

- Optimize existing Bedrock flows
- Add comprehensive observability to current system
- Improve SEO features and content quality
- Enhance user experience and performance

**Specific Actions**:

- Add CloudWatch dashboards for current flows
- Implement caching for frequently used content
- Optimize prompt engineering for better results
- Add content validation and quality scoring

### Medium Term (Next Quarter)

**Evaluate Standard Bedrock Agents**:

- Research Bedrock Agents (not AgentCore) capabilities
- Create proof of concept with Lambda action groups
- Compare performance and features with current implementation
- Develop migration plan if beneficial

**Server-Side Memory Enhancement**:

- Store chat history in DynamoDB instead of localStorage
- Enable cross-device synchronization
- Add searchable conversation history
- Implement analytics on conversation patterns

### Long Term (Next Year)

**Advanced AI Features**:

- RAG-based memory system using Knowledge Bases for Amazon Bedrock
- Multi-agent workflows for complex tasks
- Personalized content generation based on user history
- Advanced observability and performance optimization

**Potential AgentCore Revisit**:

- Monitor AgentCore Runtime improvements
- Evaluate if initialization issues are resolved
- Consider migration if service matures and issues are fixed

## Technical Specifications

### Environment Variables (If Implementing AgentCore)

```bash
# AgentCore Runtime IDs (for future use)
RESEARCH_AGENT_ID=agent-xxx
RESEARCH_AGENT_ALIAS_ID=alias-xxx
CONTENT_GENERATOR_AGENT_ID=agent-yyy
CONTENT_GENERATOR_ALIAS_ID=alias-yyy
KNOWLEDGE_RETRIEVER_AGENT_ID=agent-zzz
KNOWLEDGE_RETRIEVER_ALIAS_ID=alias-zzz
```

### SAM Template Additions (For Future Reference)

```yaml
# AgentCore Runtime Execution Role
AgentCoreExecutionRole:
  Type: AWS::IAM::Role
  Properties:
    RoleName: !Sub bayon-agentcore-execution-${Environment}
    AssumeRolePolicyDocument:
      Version: "2012-10-17"
      Statement:
        - Effect: Allow
          Principal:
            Service: bedrock-agentcore.amazonaws.com
          Action: sts:AssumeRole
    ManagedPolicyArns:
      - arn:aws:iam::aws:policy/CloudWatchLogsFullAccess
      - arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess
    Policies:
      - PolicyName: BedrockAccess
        PolicyDocument:
          Version: "2012-10-17"
          Statement:
            - Effect: Allow
              Action:
                - bedrock:InvokeModel
                - bedrock:InvokeModelWithResponseStream
              Resource: "*"

# Research Agent Runtime
ResearchAgentRuntime:
  Type: AWS::BedrockAgentCore::Runtime
  Properties:
    RuntimeName: !Sub research-agent-${Environment}
    ExecutionRoleArn: !GetAtt AgentCoreExecutionRole.Arn
    CodeLocation:
      S3Location:
        Bucket: !Ref AgentCodeBucket
        Key: research-agent/agent.zip
    ObservabilityConfig:
      Enabled: true
      TracingEnabled: true
      MetricsEnabled: true
```

### TypeScript Client (For Future Use)

```typescript
import {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand,
} from "@aws-sdk/client-bedrock-agent-runtime";

export class AgentCoreClient {
  private client: BedrockAgentRuntimeClient;

  constructor() {
    this.client = new BedrockAgentRuntimeClient({
      region: process.env.AWS_REGION,
      credentials: getAWSCredentials(),
    });
  }

  async invokeAgent(params: {
    agentId: string;
    agentAliasId: string;
    sessionId: string;
    inputText: string;
  }) {
    const command = new InvokeAgentCommand(params);
    const response = await this.client.send(command);

    // Parse streaming response
    const chunks: string[] = [];
    if (response.completion) {
      for await (const event of response.completion) {
        if (event.chunk?.bytes) {
          const text = new TextDecoder().decode(event.chunk.bytes);
          chunks.push(text);
        }
      }
    }

    return {
      output: chunks.join(""),
      sessionId: params.sessionId,
      traceId: response.$metadata.requestId,
    };
  }
}
```

## Cost Analysis

### Current Costs (Existing Implementation)

- **Bedrock Runtime API**: ~$X/month
- **DynamoDB**: ~$Y/month
- **S3**: ~$Z/month
- **CloudWatch Logs**: Minimal
- **Total**: ~$X+Y+Z/month

### Projected Costs (If Using AgentCore)

- **Bedrock Runtime API**: Same (~$X/month)
- **AgentCore Runtime**: Consumption-based
  - $0.00X per invocation
  - $0.0Y per compute second
  - Estimated: ~$50-100/month
- **Additional CloudWatch**: ~$20-30/month for traces/metrics
- **Total Additional**: ~$75-135/month

**Value Proposition**: Production observability, reduced maintenance, faster debugging

## Success Metrics (For Future Implementation)

### Technical Metrics

- Initialization time < 5 seconds
- Response time < 10 seconds
- Error rate < 0.5%
- 99.9% availability

### Observability Metrics

- 100% trace coverage
- Real-time performance dashboards
- Automated error alerting
- Comprehensive logging

### Business Metrics

- Reduced debugging time by 50%
- Faster feature development
- Improved user satisfaction
- Lower maintenance overhead

## Conclusion

While AgentCore Runtime offers compelling features like built-in observability and managed infrastructure, the current implementation challenges (initialization timeouts, package size limitations) make it unsuitable for our immediate needs.

**Current Approach**: Continue optimizing existing Bedrock flows while monitoring AgentCore Runtime improvements.

**Future Path**: Evaluate standard Bedrock Agents as a more mature alternative when ready to enhance AI capabilities.

**Key Takeaway**: Sometimes the pragmatic choice is to use what works well rather than adopting bleeding-edge technology that isn't ready for production use cases.

## Resources

- [AWS Bedrock AgentCore Documentation](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/)
- [AWS Bedrock Agents Documentation](https://docs.aws.amazon.com/bedrock/latest/userguide/agents.html)
- [Strands Agents SDK](https://strandsagents.com/latest/)
- [OpenTelemetry Python](https://opentelemetry.io/docs/languages/python/)

---

**Document Status**: Consolidated from multiple AgentCore documents
**Last Updated**: December 2024
**Decision**: Use existing Bedrock flows, evaluate alternatives for future
