# Enhanced Research Agent - AgentCore & Agent Strand Configuration

## ✅ System Status: FULLY CONFIGURED

The complex research AI (`enhanced-research-agent.ts`) is already properly configured to use **Agent Strand** architecture with **AgentCore** service for intelligent multi-agent coordination.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│          Enhanced Research Agent (User Request)         │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│         Enhanced Workflow Orchestrator                   │
│  ┌────────────────────────────────────────────────────┐  │
│  │  1. Query Analysis                                 │  │
│  │  2. Task Decomposition (with capability matching) │  │
│  │  3. Workflow Planning (context sharing, deps)     │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│                   AgentCore Service                      │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Manages 3 Default Agent Strands:                 │  │
│  │  ┌────────────────────────────────────────────┐   │  │
│  │  │  1. Data Analyst Strand                    │   │  │
│  │  │     - Quality: 0.9, Speed: 0.8             │   │  │
│  │  │     - Model: Claude Sonnet 3.5 v2          │   │  │
│  │  │     - Max Concurrent: 3 tasks              │   │  │
│  │  └────────────────────────────────────────────┘   │  │
│  │  ┌────────────────────────────────────────────┐   │  │
│  │  │  2. Content Generator Strand               │   │  │
│  │  │     - Quality: 0.85, Speed: 0.9            │   │  │
│  │  │     - Model: Claude Sonnet 3.5 v2          │   │  │
│  │  │     - Max Concurrent: 4 tasks              │   │  │
│  │  └────────────────────────────────────────────┘   │  │
│  │  ┌────────────────────────────────────────────┐   │  │
│  │  │  3. Market Forecaster Strand               │   │  │
│  │  │     - Quality: 0.88, Speed: 0.7            │   │  │
│  │  │     - Model: Claude Opus                   │   │  │
│  │  │     - Max Concurrent: 2 tasks              │   │  │
│  │  └────────────────────────────────────────────┘   │  │
│  │                                                    │  │
│  │  Features:                                         │  │
│  │  - Dynamic task allocation                         │  │
│  │  - Load balancing                                  │  │
│  │  - Performance-based routing                       │  │
│  │  - Context sharing between strands                 │  │
│  │  - Persistent memory & learning                    │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│                Individual Agent Strands                  │
│  Execute tasks ──→ Update metrics ──→ Share context     │
└──────────────────────────────────────────────────────────┘
```

---

## 🔧 Current Configuration

### File: `src/aws/bedrock/flows/enhanced-research-agent.ts`

**Lines 212-213:**
```typescript
const orchestrator = getEnhancedWorkflowOrchestrator();
const agentCore = getAgentCore();
```

**Status:** ✅ Already configured to use both orchestrator and AgentCore

**Workflow Execution (Lines 220-230):**
```typescript
const workflowResult = await orchestrator.executeCompleteEnhancedWorkflow(
    buildResearchPrompt(input, researchStrategy),
    agentProfile,
    {
        maxTasks: determineMaxTasks(input.researchDepth),
        priorityLevel: input.executionPreferences?.priorityLevel || 'medium',
        qualityRequirements: input.qualityRequirements,
        enableAdaptiveExecution: input.executionPreferences?.enableAdaptiveExecution,
        timeoutMs: input.executionPreferences?.maxExecutionTime,
    }
);
```

---

## 🎯 How Agent Strand Allocation Works

### Step-by-Step Process

#### 1. **Request Decomposition**
```typescript
// Enhanced Orchestrator (lines 129-273)
async decomposeRequest(prompt, agentProfile, options)
```

**What it does:**
- Analyzes query complexity
- Checks available agent strand capabilities
- Creates 2-6 optimized tasks
- Plans context sharing between agents
- Returns tasks + coordination plan

**Example Output:**
```json
{
  "tasks": [
    {
      "type": "data-analyst",
      "description": "Analyze market trends for Q4 2024",
      "priority": "high",
      "complexity": "moderate",
      "dependencies": [],
      "requiredCapabilities": ["market-analysis", "trend-analysis"]
    },
    {
      "type": "content-generator",
      "description": "Create executive summary",
      "priority": "medium",
      "complexity": "simple",
      "dependencies": ["task_0"],
      "requiredCapabilities": ["content-creation", "summarization"]
    }
  ],
  "coordinationPlan": {
    "contextSharingPlan": [
      {
        "fromTask": "task_0",
        "toTask": "task_1",
        "contextType": "market_data",
        "timing": "on-completion"
      }
    ]
  }
}
```

---

#### 2. **Agent Strand Allocation**
```typescript
// AgentCore (lines 253-278)
async allocateTask(task: WorkerTask): Promise<AgentStrand>
```

**Allocation Strategy: HYBRID** (default)

**Scoring Formula:**
```
strandScore = (capabilityScore × 0.4) + 
              (performanceScore × 0.4) - 
              (loadPenalty × 0.2)

Where:
- capabilityScore: How well strand matches task requirements
- performanceScore: Success rate + quality + speed scores
- loadPenalty: Current load (0-1)
```

**What it does:**
1. Finds suitable strands (matching task type)
2. Filters out unavailable/overloaded strands
3. Scores each candidate strand
4. Selects best strand based on hybrid algorithm
5. Updates strand state (idle → active/busy)
6. Adds task to strand's working memory
7. Emits 'task-allocated' event

---

#### 3. **Task Execution with Strand**
```typescript
// Enhanced Orchestrator (lines 802-830)
private async executeTask(task: WorkerTask): Promise<WorkerResult>
```

**What it does:**
1. Allocates task to optimal strand
2. Creates strand instance
3. Executes task using strand's preferred model
4. Returns result with execution metadata

**Strand Selection Example:**
```
Task: "Analyze property market trends"
↓
Suitable Strands: [data-analyst-1, data-analyst-2]
↓
Scoring:
- data-analyst-1: Load 0.33, Success 0.95 → Score 0.82
- data-analyst-2: Load 0.67, Success 0.90 → Score 0.75
↓
Selected: data-analyst-1 (highest score)
↓
Execute task with Claude Sonnet 3.5 v2
```

---

#### 4. **Context Sharing**
```typescript
// Enhanced Orchestrator (lines 835-866)
private handleTaskContextSharing(task, result)
```

**What it does:**
1. Checks if task wants to share context
2. Stores output in context store
3. Identifies dependent tasks from coordination plan
4. Calls AgentCore.shareContext() for each dependency
5. Target strand receives context in knowledge base

**Example:**
```
Data Analyst completes → stores market_trends data
                      ↓
Content Generator needs it → receives via context sharing
                      ↓
Content Generator accesses shared context from knowledge base
```

---

#### 5. **Performance Tracking**
```typescript
// AgentCore (lines 420-468)
updateStrandMetrics(strandId, result)
```

**What it tracks:**
- Tasks completed count
- Success rate (rolling 20-task window)
- Average execution time (rolling 10-task window)
- Current load (active tasks / max concurrent)
- Task history (last 50 tasks)
- Recent quality ratings

**Adaptive Learning:**
```
Strand performance improves → Higher selection score
Strand performance degrades → Lower selection score
Strand overloaded → Automatically skipped
```

---

## 📊 Agent Strand Capabilities Matrix

| Strand Type | Quality | Speed | Reliability | Model | Max Concurrent | Expertise |
|-------------|---------|-------|-------------|-------|----------------|-----------|
| **Data Analyst** | 0.90 | 0.80 | 0.95 | Sonnet 3.5 v2 | 3 | Market analysis, property data, statistics, trends |
| **Content Generator** | 0.85 | 0.90 | 0.90 | Sonnet 3.5 v2 | 4 | Content creation, copywriting, personalization |
| **Market Forecaster** | 0.88 | 0.70 | 0.92 | Opus | 2 | Forecasting, investment analysis, risk assessment |

---

## 🎬 Example Research Flow

### Request:
```typescript
await executeEnhancedResearchAgent({
  query: "What are the best neighborhoods for first-time homebuyers in Austin?",
  researchDepth: "comprehensive",
  researchScope: {
    includeMarketData: true,
    includeCompetitiveAnalysis: true,
    includeTrendAnalysis: true,
  },
  targetAudience: "clients",
});
```

### Execution Flow:

```
1. Query Analysis
   ↓
   Determines: "complex" query, needs all 3 agent types
   
2. Task Decomposition
   ↓
   Creates 4 tasks:
   - Data Analyst: "Gather Austin neighborhood market data"
   - Data Analyst: "Analyze price trends for first-time buyers"
   - Market Forecaster: "Forecast appreciation potential"
   - Content Generator: "Create comprehensive neighborhood guide"
   
3. Agent Strand Allocation
   ↓
   Task 1 → data-analyst-strand-1 (load: 0.0, score: 0.89)
   Task 2 → data-analyst-strand-1 (load: 0.33, score: 0.82)
   Task 3 → market-forecaster-strand-1 (load: 0.0, score: 0.88)
   Task 4 → content-generator-strand-1 (load: 0.0, score: 0.85)
   
4. Parallel Execution
   ↓
   Tasks 1-3 execute in parallel
   Task 4 waits for dependencies
   
5. Context Sharing
   ↓
   Task 1 completes → shares market_data
   Task 2 completes → shares trends_data
   Task 3 completes → shares forecast_data
   ↓
   Task 4 receives all context → generates comprehensive guide
   
6. Synthesis
   ↓
   Orchestrator combines all results
   Creates final research report
   Includes citations, metrics, recommendations
   
7. Metrics Update
   ↓
   All strands update performance metrics
   Success rates, execution times tracked
   Learning patterns recorded
```

---

## 🔍 Monitoring & Debugging

### Check Agent Strand Status

```typescript
const agentCore = getAgentCore();

// Get all strands
const allStrands = agentCore.getAllStrands();
console.log('Agent Strands:', allStrands.map(s => ({
  id: s.id,
  type: s.type,
  state: s.state,
  load: s.metrics.currentLoad,
  successRate: s.metrics.successRate,
  avgTime: s.metrics.avgExecutionTime,
})));

// Get specific strand type
const analysts = agentCore.getStrandsByType('data-analyst');
console.log('Data Analyst Strands:', analysts);
```

### Track Workflow Execution

```typescript
const orchestrator = getEnhancedWorkflowOrchestrator();

// Execute with full metrics
const result = await orchestrator.executeCompleteEnhancedWorkflow(
  "Your research query",
  agentProfile,
  { maxTasks: 4 }
);

// Examine results
console.log('Execution Metrics:', result.executionMetrics);
console.log('Agent Performance:', result.agentPerformance);
console.log('Workflow Insights:', result.workflowInsights);
```

### Event Listeners

```typescript
const agentCore = getAgentCore();

// Monitor strand events
agentCore.on('strand-created', (strand) => {
  console.log('New strand created:', strand.type);
});

agentCore.on('task-allocated', (task, strand) => {
  console.log(`Task ${task.id} allocated to ${strand.type}`);
});

agentCore.on('task-completed', (result, strand) => {
  console.log(`Task completed by ${strand.type}:`, result.status);
});

agentCore.on('context-shared', (fromId, toId, context) => {
  console.log(`Context shared: ${fromId} → ${toId}`);
});

agentCore.on('performance-updated', (strand, metrics) => {
  console.log(`${strand.type} metrics updated:`, metrics);
});
```

---

## ⚙️ Configuration Options

### Customize Allocation Strategy

```typescript
const agentCore = getAgentCore();

// Available strategies:
agentCore.setAllocationStrategy('round-robin');      // Simple rotation
agentCore.setAllocationStrategy('load-balanced');    // Lowest load first
agentCore.setAllocationStrategy('capability-based'); // Best capability match
agentCore.setAllocationStrategy('performance-based');// Highest performance
agentCore.setAllocationStrategy('hybrid');           // Balanced (default)
```

### Add Custom Agent Strand

```typescript
const agentCore = getAgentCore();

const customStrand = agentCore.createStrand({
  type: 'data-analyst',
  capabilities: {
    expertise: ['luxury-market', 'high-net-worth-analysis'],
    taskTypes: ['luxury-property-analysis', 'investment-portfolio'],
    qualityScore: 0.95,
    speedScore: 0.75,
    reliabilityScore: 0.98,
    maxConcurrentTasks: 2,
    preferredModel: 'us.anthropic.claude-3-opus-20240229-v1:0',
  },
  state: 'idle',
  memory: { /* ... */ },
  metrics: { /* ... */ },
});

agentCore.strands.set(customStrand.id, customStrand);
```

### Configure Research Depth

```typescript
// Quick research (2 tasks, 30-60 seconds)
researchDepth: 'quick'

// Standard research (3 tasks, 1-2 minutes)
researchDepth: 'standard'

// Comprehensive research (4 tasks, 2-4 minutes)
researchDepth: 'comprehensive'

// Expert research (6 tasks, 4+ minutes)
researchDepth: 'expert'
```

---

## 📈 Performance Benefits

### With Agent Strand Architecture:

✅ **Intelligent Load Balancing**
- Tasks distributed based on strand capabilities
- Overloaded strands automatically avoided
- Parallel execution maximized

✅ **Adaptive Learning**
- Strand performance tracked over time
- Better-performing strands preferred
- Continuous optimization

✅ **Context Preservation**
- Working memory for active tasks
- Knowledge base for shared insights
- Task history for pattern learning

✅ **Quality Optimization**
- Tasks matched to best-suited agents
- Model selection based on task complexity
- Quality metrics tracked and improved

---

## 🎓 Best Practices

### 1. Use Appropriate Research Depth
```typescript
// For simple queries
researchDepth: 'quick'  // 2 tasks, faster

// For complex analysis
researchDepth: 'comprehensive'  // 4+ tasks, thorough
```

### 2. Enable Adaptive Execution
```typescript
executionPreferences: {
  enableAdaptiveExecution: true,  // Adjusts based on performance
}
```

### 3. Set Quality Requirements
```typescript
qualityRequirements: {
  minimumConfidence: 0.8,  // Only accept high-confidence results
  requiresCitation: true,   // Ensure all claims are cited
  requiresPersonalization: true,  // Use agent profile context
}
```

### 4. Monitor Workflow Insights
```typescript
const result = await executeEnhancedResearchAgent(input);

// Check for issues
if (result.failedTasks.length > 0) {
  console.warn('Failed tasks:', result.failedTasks);
}

// Optimize based on insights
console.log('Bottlenecks:', result.workflowInsights.bottlenecks);
console.log('Suggestions:', result.workflowInsights.optimizationSuggestions);
```

---

## 🔄 Migration from Simple Research

If you have code using simple research flows, here's how to migrate:

### Before (Simple):
```typescript
const result = await simpleResearch(query);
```

### After (Enhanced with Agent Strands):
```typescript
const result = await runEnhancedResearch(
  query,
  {
    researchDepth: 'standard',
    targetAudience: 'clients',
  },
  agentProfile
);
```

**Benefits:**
- Multi-agent coordination
- Better quality through specialization
- Adaptive performance optimization
- Context sharing between agents
- Comprehensive metrics and insights

---

## 📊 System Status

✅ **AgentCore:** Initialized with 3 default strands  
✅ **Enhanced Orchestrator:** Configured with AgentCore integration  
✅ **Enhanced Research Agent:** Uses orchestrator + AgentCore  
✅ **Agent Strands:** Fully functional with persistent memory  
✅ **Context Sharing:** Working between strands  
✅ **Performance Tracking:** Active for all strands  
✅ **Adaptive Learning:** Enabled by default

---

## 🎉 Conclusion

**Your enhanced research AI is fully configured and operational!**

The system uses a sophisticated multi-agent architecture where:
- **AgentCore** manages agent strand lifecycle and allocation
- **Agent Strands** maintain persistent memory and capabilities
- **Enhanced Orchestrator** coordinates complex workflows
- **Enhanced Research Agent** leverages all of the above

No additional configuration needed - it's ready to use! 🚀
