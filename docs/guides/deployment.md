# AgentCore Deployment Guide

## Prerequisites Checklist

✅ AWS CLI configured (Account: 409136660268)
✅ Python 3.13+ installed
✅ UV package manager installed
✅ AgentCore CLI installed
✅ Bedrock models accessible (Titan Embeddings v2 available)

## Step 1: Enable CloudWatch Transaction Search (One-Time Setup)

This is required for AgentCore observability.

### Option A: Using AWS Console (Recommended)

1. Go to AWS CloudWatch console: https://console.aws.amazon.com/cloudwatch/
2. Navigate to **Settings** → **Transaction Search**
3. Click **Enable Transaction Search**
4. Confirm the setup (takes ~5 minutes)

### Option B: Using AWS CLI

```bash
# Enable CloudWatch Transaction Search
aws cloudwatch put-metric-stream \
  --name AgentCoreObservability \
  --firehose-arn arn:aws:firehose:us-west-2:409136660268:deliverystream/CloudWatch-Metrics \
  --role-arn arn:aws:iam::409136660268:role/CloudWatch-Metrics-Role \
  --output-format json \
  --region us-west-2

# Verify it's enabled
aws cloudwatch describe-metric-streams --region us-west-2
```

**Note:** If you get an error about missing resources, use the console method (Option A).

---

## Step 2: Create S3 Bucket for Agent Code

```bash
# Create bucket for agent code
aws s3 mb s3://bayon-agentcore-code-development-409136660268 --region us-west-2

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket bayon-agentcore-code-development-409136660268 \
  --versioning-configuration Status=Enabled \
  --region us-west-2

# Verify bucket exists
aws s3 ls | grep agentcore
```

---

## Step 3: Package and Upload Research Agent

```bash
# Navigate to agent directory
cd agents/research-agent

# Create deployment package
zip -r agent.zip main.py knowledge_retriever.py

# Add dependencies (Python packages)
cd .venv/lib/python3.13/site-packages
zip -r ../../../../agent.zip . -x "*.pyc" -x "*__pycache__*"
cd ../../../../

# Verify package
unzip -l agent.zip | head -20

# Upload to S3
aws s3 cp agent.zip s3://bayon-agentcore-code-development-409136660268/research-agent/agent.zip \
  --region us-west-2

# Verify upload
aws s3 ls s3://bayon-agentcore-code-development-409136660268/research-agent/
```

---

## Step 4: Deploy Using AgentCore CLI (Recommended)

```bash
cd agents/research-agent

# Deploy to development
agentcore deploy \
  --name research-agent-dev \
  --region us-west-2 \
  --runtime-role-arn arn:aws:iam::409136660268:role/bayon-agentcore-execution-development \
  --enable-observability

# This will:
# 1. Package your agent
# 2. Upload to S3
# 3. Create AgentCore Runtime
# 4. Enable observability
# 5. Return agent ID and alias ID

# Save the output:
# Agent ID: agent-xxxxx
# Alias ID: TSTALIASID or alias-xxxxx
```

**If you get an error about missing IAM role, continue to Step 5 first.**

---

## Step 5: Update SAM Template (If IAM Role Doesn't Exist)

The SAM template needs AgentCore resources. Run:

```bash
# Deploy SAM stack with AgentCore resources
npm run sam:deploy:dev

# This will create:
# - AgentCore execution role
# - S3 bucket for agent code
# - IAM policies for Bedrock, DynamoDB access
```

Then retry Step 4.

---

## Step 6: Update Environment Variables

After deployment, add to `.env.local`:

```bash
# Research Agent (from Step 4 output)
RESEARCH_AGENT_ID=agent-xxxxx
RESEARCH_AGENT_ALIAS_ID=TSTALIASID

# Knowledge Base (existing)
KNOWLEDGE_BASE_TABLE=bayon-coagent-development
KNOWLEDGE_BASE_BUCKET=bayon-knowledge-base-development

# AWS Configuration
AWS_REGION=us-west-2
AWS_ACCOUNT_ID=409136660268
```

---

## Step 7: Test Agent from AWS

```bash
# Test agent invocation using AWS CLI
aws bedrock-agent-runtime invoke-agent \
  --agent-id agent-xxxxx \
  --agent-alias-id TSTALIASID \
  --session-id test-session-$(date +%s) \
  --input-text '{"query": "What are the top real estate trends?", "userId": "test-user", "useKnowledgeBase": false}' \
  --region us-west-2 \
  --output-file /tmp/agent-response.json

# View response
cat /tmp/agent-response.json | jq '.'
```

---

## Step 8: Test from Next.js

```bash
# Start Next.js dev server
npm run dev

# In another terminal, test the agent
curl -X POST http://localhost:3000/api/test-agentcore \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the top real estate trends?",
    "useKnowledgeBase": false
  }'
```

Or use the test action:

```typescript
// In your browser console or test file
import { testResearchAgent } from "@/app/agentcore-test-actions";

const result = await testResearchAgent({
  query: "What are the top real estate trends in 2024?",
  includeWeb: false,
});

console.log("Answer:", result.data.answer);
console.log("Trace ID:", result.data.traceId);
```

---

## Step 9: Verify Observability in CloudWatch

1. Go to CloudWatch console: https://console.aws.amazon.com/cloudwatch/
2. Navigate to **GenAI Observability**
3. Filter by agent: `research-agent-dev`
4. You should see:
   - **Traces**: Execution paths with timing
   - **Metrics**: Invocation count, latency, errors
   - **Logs**: Structured logs from agent

### View Specific Trace

```bash
# Get trace ID from test output
TRACE_ID="your-trace-id-here"

# View trace details
aws cloudwatch get-trace-summary \
  --trace-ids $TRACE_ID \
  --region us-west-2
```

---

## Step 10: Test with Knowledge Base (RAG)

First, ensure you have documents in DynamoDB:

```bash
# Check if documents exist
aws dynamodb query \
  --table-name bayon-coagent-development \
  --key-condition-expression "PK = :pk AND begins_with(SK, :sk)" \
  --expression-attribute-values '{
    ":pk": {"S": "USER#your-user-id"},
    ":sk": {"S": "DOCUMENT#"}
  }' \
  --region us-west-2
```

Then test with RAG:

```typescript
const result = await testResearchAgent({
  query: "What insights are in my uploaded documents?",
  useKnowledgeBase: true,
  topK: 5,
  minScore: 0.5,
});

console.log("Documents used:", result.data.documentsRetrieved);
console.log("Sources:", result.data.sources);
```

---

## Troubleshooting

### Error: "Agent not found"

- Verify agent ID is correct
- Check region (must be us-west-2)
- Ensure deployment completed successfully

### Error: "Access denied"

- Check IAM role has Bedrock permissions
- Verify execution role ARN is correct
- Ensure CloudWatch permissions are granted

### Error: "Model not found"

- Verify Bedrock model access in console
- Check model ID: `anthropic.claude-3-5-sonnet-20241022-v2:0`
- Ensure region supports the model

### No traces in CloudWatch

- Verify Transaction Search is enabled
- Check observability was enabled during deployment
- Wait 5-10 minutes for first traces to appear
- Ensure agent was invoked at least once

### DynamoDB access denied

- Check execution role has DynamoDB permissions
- Verify table name is correct
- Ensure table exists in the same region

### Embeddings fail

- Verify Titan Embeddings v2 access
- Check model ID: `amazon.titan-embed-text-v2:0`
- Ensure AWS credentials are configured

---

## Monitoring and Maintenance

### View Agent Logs

```bash
# List log groups
aws logs describe-log-groups \
  --log-group-name-prefix /aws/bedrock-agentcore \
  --region us-west-2

# Tail logs
aws logs tail /aws/bedrock-agentcore/runtimes/agent-xxxxx \
  --follow \
  --region us-west-2
```

### View Metrics

```bash
# Get invocation count
aws cloudwatch get-metric-statistics \
  --namespace bedrock-agentcore \
  --metric-name Invocations \
  --dimensions Name=AgentId,Value=agent-xxxxx \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum \
  --region us-west-2
```

### Update Agent

```bash
# Make changes to main.py or knowledge_retriever.py
cd agents/research-agent

# Redeploy
agentcore deploy \
  --name research-agent-dev \
  --region us-west-2 \
  --update

# Or manually
zip -r agent.zip main.py knowledge_retriever.py .venv/lib/python3.13/site-packages
aws s3 cp agent.zip s3://bayon-agentcore-code-development-409136660268/research-agent/agent.zip
# Then update runtime via console or CLI
```

---

## Cost Estimation

### AgentCore Runtime

- **Invocations**: $0.00X per invocation
- **Compute**: $0.0Y per second
- **Estimated**: ~$50-100/month for moderate usage

### Bedrock

- **Claude 3.5 Sonnet**: $3 per 1M input tokens, $15 per 1M output tokens
- **Titan Embeddings v2**: $0.0001 per 1K tokens
- **Estimated**: ~$100-200/month for moderate usage

### CloudWatch

- **Logs**: $0.50 per GB ingested
- **Metrics**: $0.30 per custom metric
- **Traces**: $0.50 per 1M traces
- **Estimated**: ~$20-30/month

### Total Additional Cost

**~$170-330/month** for full observability and managed infrastructure

---

## Next Steps

After successful deployment:

1. ✅ Verify agent works without knowledge base
2. ✅ Test with knowledge base (RAG)
3. ✅ Check observability in CloudWatch
4. ✅ Update server actions to use AgentCore
5. ✅ Deploy to production
6. 🚀 Move to Phase 3: Content Generator

---

## Quick Reference

```bash
# Deploy agent
cd agents/research-agent && agentcore deploy --name research-agent-dev --region us-west-2

# Test agent
aws bedrock-agent-runtime invoke-agent --agent-id agent-xxx --agent-alias-id TSTALIASID --session-id test --input-text '{"query":"test"}' --region us-west-2

# View logs
aws logs tail /aws/bedrock-agentcore/runtimes/agent-xxx --follow --region us-west-2

# Update agent
agentcore deploy --name research-agent-dev --region us-west-2 --update
```

---

**Account**: 409136660268
**Region**: us-west-2
**Environment**: development
