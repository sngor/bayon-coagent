# Performance Testing Workflow Flow Diagram

## Overview Flow

```mermaid
graph TB
    Start([Workflow Trigger]) --> Trigger{Trigger Type?}

    Trigger -->|Deployment Complete| Deploy[Extract Environment<br/>from Workflow Name]
    Trigger -->|Manual| Manual[Use Input<br/>Environment & URL]
    Trigger -->|Scheduled| Schedule[Default to<br/>Staging Environment]

    Deploy --> Setup[Setup Job:<br/>Determine Environment & URL]
    Manual --> Setup
    Schedule --> Setup

    Setup --> Audit[Lighthouse Audit Job]

    Audit --> Desktop[Desktop Audit<br/>Lighthouse CLI]
    Audit --> Mobile[Mobile Audit<br/>Lighthouse CLI]

    Desktop --> DesktopScores[Extract Scores:<br/>Performance, A11y, BP, SEO]
    Mobile --> MobileScores[Extract Scores:<br/>Performance, A11y, BP, SEO]

    DesktopScores --> Analyze[Analyze Results Job]
    MobileScores --> Analyze

    Analyze --> Threshold{Check<br/>Thresholds}
    Threshold -->|All Pass| Pass[✅ Passed = true]
    Threshold -->|Any Fail| Fail[❌ Passed = false]

    Pass --> Regression{Check<br/>Regressions}
    Fail --> Regression

    Regression -->|>10% Drop| RegYes[⚠️ Has Regressions = true]
    Regression -->|No Drop| RegNo[✅ Has Regressions = false]

    RegYes --> Report[Report Results Job]
    RegNo --> Report

    Report --> GenReport[Generate<br/>Performance Report]
    GenReport --> StoreData[Store Historical<br/>Data JSON]
    StoreData --> Trends[Generate Trend<br/>Charts Placeholder]

    Trends --> Notify[Notify Job]

    Notify --> NotifyType{Result Type?}

    NotifyType -->|Passed & No Regression| Success[🟢 Success Notification<br/>to Slack]
    NotifyType -->|Failed Thresholds| Failure[🔴 Failure Notification<br/>to Slack + Mention DevOps]
    NotifyType -->|Has Regression| Warning[🟡 Regression Notification<br/>to Slack + Mention DevOps]

    Success --> End([Workflow Complete])
    Failure --> End
    Warning --> End
```

## Detailed Job Flow

### Setup Job

```mermaid
graph LR
    A[Setup Job Start] --> B{Trigger Type?}
    B -->|workflow_run| C[Extract from<br/>Workflow Name]
    B -->|workflow_dispatch| D[Use Input<br/>Parameters]
    B -->|schedule| E[Default to<br/>Staging]

    C --> F[Set Environment<br/>& URL]
    D --> F
    E --> F

    F --> G[Output:<br/>environment<br/>test-url]
    G --> H[Setup Job Complete]
```

### Lighthouse Audit Job (Matrix)

```mermaid
graph TB
    A[Lighthouse Audit Job] --> B[Matrix Strategy]

    B --> C[Desktop Branch]
    B --> D[Mobile Branch]

    C --> C1[Install Lighthouse CLI]
    D --> D1[Install Lighthouse CLI]

    C1 --> C2[Run Lighthouse<br/>--preset=desktop]
    D1 --> D2[Run Lighthouse<br/>--preset=mobile]

    C2 --> C3[Generate HTML<br/>& JSON Reports]
    D2 --> D3[Generate HTML<br/>& JSON Reports]

    C3 --> C4[Extract Scores<br/>from JSON]
    D3 --> D4[Extract Scores<br/>from JSON]

    C4 --> C5[Upload Artifacts:<br/>- HTML Report<br/>- JSON Report<br/>- Scores JSON]
    D4 --> D5[Upload Artifacts:<br/>- HTML Report<br/>- JSON Report<br/>- Scores JSON]

    C5 --> E[Both Complete]
    D5 --> E
```

### Analyze Results Job

```mermaid
graph TB
    A[Analyze Results Job] --> B[Download Score<br/>Artifacts]

    B --> C[Desktop Scores]
    B --> D[Mobile Scores]

    C --> E[Check Desktop<br/>Thresholds]
    D --> F[Check Mobile<br/>Thresholds]

    E --> G{Performance ≥ 90?}
    E --> H{Accessibility ≥ 95?}
    E --> I{Best Practices ≥ 90?}
    E --> J{SEO ≥ 95?}

    F --> K{Performance ≥ 90?}
    F --> L{Accessibility ≥ 95?}
    F --> M{Best Practices ≥ 90?}
    F --> N{SEO ≥ 95?}

    G --> O[Aggregate Results]
    H --> O
    I --> O
    J --> O
    K --> O
    L --> O
    M --> O
    N --> O

    O --> P{All Pass?}
    P -->|Yes| Q[passed = true]
    P -->|No| R[passed = false<br/>List Failures]

    Q --> S[Check Historical<br/>Baseline]
    R --> S

    S --> T{>10% Drop?}
    T -->|Yes| U[has-regressions = true]
    T -->|No| V[has-regressions = false]

    U --> W[Output Results]
    V --> W

    W --> X{passed = false?}
    X -->|Yes| Y[Fail Job]
    X -->|No| Z[Complete Job]
```

### Report Results Job

```mermaid
graph TB
    A[Report Results Job] --> B[Download All<br/>Artifacts]

    B --> C[Generate Performance<br/>Report Markdown]

    C --> D[Include Desktop Scores<br/>with Pass/Fail Status]
    C --> E[Include Mobile Scores<br/>with Pass/Fail Status]

    D --> F[Create Performance<br/>Data JSON]
    E --> F

    F --> G[Include:<br/>- Environment<br/>- URL<br/>- Timestamp<br/>- Commit<br/>- All Scores]

    G --> H[Upload Report<br/>Artifact 30 days]
    G --> I[Upload Data<br/>Artifact 365 days]

    H --> J[Generate Trend<br/>Charts Placeholder]
    I --> J

    J --> K[Post Summary to<br/>Workflow Summary]

    K --> L[Report Job Complete]
```

### Notify Job

```mermaid
graph TB
    A[Notify Job] --> B[Download Performance<br/>Report]

    B --> C{Check Results}

    C -->|passed = true<br/>has-regressions = false| D[Success Path]
    C -->|passed = false| E[Failure Path]
    C -->|has-regressions = true| F[Regression Path]

    D --> D1[Slack Notification:<br/>✅ Performance Tests Passed]
    D1 --> D2[Include:<br/>- Environment<br/>- URL<br/>- Commit<br/>- Scores Summary]
    D2 --> D3[Post to Team Channel]

    E --> E1[Slack Notification:<br/>❌ Performance Tests Failed]
    E1 --> E2[Include:<br/>- Failed Metrics<br/>- Threshold Comparisons<br/>- Link to Reports]
    E2 --> E3[Post to Team Channel<br/>+ Mention DevOps]

    F --> F1[Slack Notification:<br/>⚠️ Performance Regression]
    F1 --> F2[Include:<br/>- Regressed Metrics<br/>- Percentage Drop<br/>- Link to Reports]
    F2 --> F3[Post to Team Channel<br/>+ Mention DevOps]

    D3 --> G[Notify Job Complete]
    E3 --> G
    F3 --> G
```

## Trigger Scenarios

### Scenario 1: After Staging Deployment

```mermaid
sequenceDiagram
    participant Deploy as Deploy to Staging
    participant Perf as Performance Testing
    participant Slack as Slack

    Deploy->>Deploy: Deploy Complete
    Deploy->>Perf: Trigger workflow_run
    Perf->>Perf: Extract environment = staging
    Perf->>Perf: Set URL = staging.bayoncoagent.com
    Perf->>Perf: Run Lighthouse Audits
    Perf->>Perf: Analyze Results
    Perf->>Perf: Generate Reports
    Perf->>Slack: Send Notification
    Slack-->>Perf: Notification Sent
```

### Scenario 2: Manual Trigger

```mermaid
sequenceDiagram
    participant User as Developer
    participant GH as GitHub Actions
    participant Perf as Performance Testing
    participant Slack as Slack

    User->>GH: Click "Run workflow"
    User->>GH: Select environment: staging
    User->>GH: Enter URL (optional)
    GH->>Perf: Trigger workflow_dispatch
    Perf->>Perf: Use input environment & URL
    Perf->>Perf: Run Lighthouse Audits
    Perf->>Perf: Analyze Results
    Perf->>Perf: Generate Reports
    Perf->>Slack: Send Notification
    Slack-->>User: Notification Received
```

### Scenario 3: Scheduled Run

```mermaid
sequenceDiagram
    participant Cron as GitHub Scheduler
    participant Perf as Performance Testing
    participant Slack as Slack

    Note over Cron: Monday 6am UTC
    Cron->>Perf: Trigger schedule
    Perf->>Perf: Default environment = staging
    Perf->>Perf: Default URL = staging.bayoncoagent.com
    Perf->>Perf: Run Lighthouse Audits
    Perf->>Perf: Analyze Results
    Perf->>Perf: Generate Reports
    Perf->>Slack: Send Notification
    Note over Slack: Weekly Performance Report
```

## Data Flow

```mermaid
graph LR
    A[Lighthouse CLI] -->|HTML Report| B[Artifact Storage]
    A -->|JSON Report| B
    A -->|Scores| C[Analysis Job]

    C -->|Threshold Results| D[Report Job]
    C -->|Regression Status| D

    D -->|Performance Report MD| B
    D -->|Performance Data JSON| B
    D -->|Summary| E[Workflow Summary]

    B -->|365 days| F[Historical Database<br/>Future]

    F -->|Trend Data| G[Trend Charts<br/>Future]

    D -->|Notification Payload| H[Slack]
```

## Artifact Retention

```mermaid
graph TB
    A[Workflow Run] --> B[Artifacts Generated]

    B --> C[Lighthouse Reports<br/>HTML + JSON]
    B --> D[Score Files<br/>JSON]
    B --> E[Performance Report<br/>Markdown]
    B --> F[Performance Data<br/>JSON]

    C -->|30 days| G[Deleted]
    D -->|90 days| H[Deleted]
    E -->|90 days| H
    F -->|365 days| I[Deleted]

    F -->|Before Deletion| J[Store in Database<br/>Future Enhancement]
```

## Threshold Checking Logic

```mermaid
graph TB
    A[Score] --> B{Score ≥ Threshold?}

    B -->|Yes| C[✅ Pass]
    B -->|No| D[❌ Fail]

    C --> E[Continue to Next Check]
    D --> F[Record Failure]

    F --> G[Add to Failures List:<br/>- Category<br/>- Score<br/>- Threshold]

    E --> H{More Checks?}
    G --> H

    H -->|Yes| A
    H -->|No| I{Any Failures?}

    I -->|Yes| J[passed = false<br/>Display Failures]
    I -->|No| K[passed = true]

    J --> L[Fail Workflow]
    K --> M[Continue Workflow]
```

## Regression Detection Logic

```mermaid
graph TB
    A[Current Score] --> B[Fetch Historical<br/>Baseline]

    B --> C{Baseline Exists?}

    C -->|No| D[Store Current as<br/>Baseline]
    C -->|Yes| E[Calculate Difference]

    E --> F[Difference = <br/>Current - Baseline]

    F --> G{Difference < -10%?}

    G -->|Yes| H[⚠️ Regression Detected]
    G -->|No| I[✅ No Regression]

    H --> J[has-regressions = true<br/>Record Details]
    I --> K[has-regressions = false]

    J --> L[Send Regression<br/>Notification]
    K --> M[Continue]

    D --> M
```

## Complete Workflow Timeline

```mermaid
gantt
    title Performance Testing Workflow Timeline
    dateFormat  mm:ss

    section Setup
    Determine Environment & URL    :00:00, 00:30

    section Lighthouse Audits
    Desktop Audit (Parallel)       :00:30, 02:00
    Mobile Audit (Parallel)        :00:30, 02:00

    section Analysis
    Download Artifacts             :02:30, 00:30
    Check Thresholds               :03:00, 00:30
    Check Regressions              :03:30, 00:30

    section Reporting
    Generate Reports               :04:00, 00:30
    Store Historical Data          :04:30, 00:30
    Upload Artifacts               :05:00, 00:30

    section Notifications
    Send Slack Notifications       :05:30, 00:30
```

**Total Estimated Time**: ~6 minutes

## Legend

- 🟢 Success Path
- 🔴 Failure Path
- 🟡 Warning Path
- ✅ Pass Condition
- ❌ Fail Condition
- ⚠️ Regression Detected
- 📊 Data Storage
- 🔔 Notification
