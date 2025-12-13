#!/bin/bash

# Create test directories
mkdir -p tests/integration
mkdir -p tests/agents
mkdir -p tests/deployment

# Move test files to appropriate directories
mv test-agentcore-*.ts tests/agents/
mv test-billing-*.ts tests/integration/
mv test-dynamodb-*.ts tests/integration/
mv test-users-*.ts tests/integration/
mv test-keyword-*.ts tests/integration/
mv test-role-*.ts tests/integration/
mv test-caching.ts tests/integration/
mv test-simple-*.ts tests/integration/
mv test-chat-*.tsx tests/integration/

# Move agent test files
mv test_*.py tests/agents/
mv *_agent.py tests/agents/

# Move deployment test files
mv diagnose-assistant.js tests/deployment/
mv test-assistant.js tests/deployment/

# Move enhancement test files to archive
mkdir -p tests/archive
mv test-enhanced-*.js tests/archive/
mv test-multi-*.js tests/archive/
mv test-day-to-*.js tests/archive/
mv test-next-steps-*.js tests/archive/

echo "✅ Test files organized"
echo "📁 Integration tests: tests/integration/"
echo "🤖 Agent tests: tests/agents/"
echo "🚀 Deployment tests: tests/deployment/"