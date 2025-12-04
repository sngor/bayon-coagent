# CI/CD Deployment Flow Diagram

## Development Deployment Workflow

```mermaid
graph TB
    Start([Push to develop]) --> Validate[Validate Infrastructure]

    Validate --> |SAM validate| V1[Validate SAM Template]
    Validate --> |cfn-lint| V2[Check CloudFormation Best Practices]
    Validate --> |Preview| V3[Generate Change Preview]

    V1 --> DeployInfra
    V2 --> DeployInfra
    V3 --> DeployInfra

    DeployInfra[Deploy Infrastructure] --> |SAM deploy| I1[Deploy CloudFormation Stack]
    I1 --> I2[Wait for Stack Stable]
    I2 --> I3[Capture Stack Outputs]
    I3 --> I4[Upload Outputs Artifact]

    I4 --> DeployFrontend[Deploy Frontend]

    DeployFrontend --> F1[Download Stack Outputs]
    F1 --> F2[Extract Environment Variables]
    F2 --> F3[Find Amplify App]
    F3 --> F4[Update Amplify Env Vars]
    F4 --> F5[Trigger Amplify Deployment]
    F5 --> F6[Monitor Deployment Progress]
    F6 --> F7[Capture Deployment URL]

    F7 --> SmokeTests[Run Smoke Tests]

    SmokeTests --> T1[Test Authentication]
    SmokeTests --> T2[Test Database]
    SmokeTests --> T3[Test Storage]
    SmokeTests --> T4[Test AI Service]

    T1 --> CheckTests{All Tests Pass?}
    T2 --> CheckTests
    T3 --> CheckTests
    T4 --> CheckTests

    CheckTests --> |Yes| NotifySuccess[Notify Success]
    CheckTests --> |No| Rollback[Rollback Deployment]

    Rollback --> R1[Rollback CloudFormation]
    Rollback --> R2[Revert Amplify Deployment]
    R1 --> NotifyRollback[Notify Rollback]
    R2 --> NotifyRollback

    NotifySuccess --> End([Deployment Complete])
    NotifyRollback --> End

    DeployInfra --> |Failure| Rollback
    DeployFrontend --> |Failure| Rollback

    style Start fill:#90EE90
    style End fill:#90EE90
    style Validate fill:#87CEEB
    style DeployInfra fill:#87CEEB
    style DeployFrontend fill:#87CEEB
    style SmokeTests fill:#FFD700
    style Rollback fill:#FF6B6B
    style NotifySuccess fill:#90EE90
    style NotifyRollback fill:#FF6B6B
```

## Job Dependencies

```mermaid
graph LR
    Validate[Validate] --> DeployInfra[Deploy Infrastructure]
    DeployInfra --> DeployFrontend[Deploy Frontend]
    DeployFrontend --> SmokeTests[Smoke Tests]
    SmokeTests --> |Failure| Rollback[Rollback]
    DeployInfra --> |Always| Notify[Notify]
    DeployFrontend --> |Always| Notify
    SmokeTests --> |Always| Notify
    Rollback --> |Always| Notify

    style Validate fill:#87CEEB
    style DeployInfra fill:#87CEEB
    style DeployFrontend fill:#87CEEB
    style SmokeTests fill:#FFD700
    style Rollback fill:#FF6B6B
    style Notify fill:#DDA0DD
```

## Notification Flow

```mermaid
graph TB
    Start([Deployment Triggered]) --> N1[Send 'Deployment Started' Notification]

    N1 --> Deploy[Deployment Process]

    Deploy --> Check{Success?}

    Check --> |Yes| N2[Send 'Deployment Success' Notification]
    Check --> |No| N3[Send 'Deployment Failed' Notification]

    N3 --> Rollback[Rollback Process]
    Rollback --> N4[Send 'Rollback' Notification]

    N2 --> End([Complete])
    N4 --> End

    style Start fill:#90EE90
    style N1 fill:#87CEEB
    style N2 fill:#90EE90
    style N3 fill:#FF6B6B
    style N4 fill:#FF6B6B
    style End fill:#90EE90
```

## Smoke Test Execution

```mermaid
graph TB
    Start([Deployment Complete]) --> Auth[Authentication Test]
    Start --> DB[Database Test]
    Start --> Storage[Storage Test]
    Start --> AI[AI Service Test]

    Auth --> |Pass/Fail| Results[Collect Results]
    DB --> |Pass/Fail| Results
    Storage --> |Pass/Fail| Results
    AI --> |Pass/Fail| Results

    Results --> Upload[Upload Test Artifacts]
    Upload --> Check{All Passed?}

    Check --> |Yes| Success[Continue to Notify]
    Check --> |No| Fail[Trigger Rollback]

    style Start fill:#90EE90
    style Auth fill:#FFD700
    style DB fill:#FFD700
    style Storage fill:#FFD700
    style AI fill:#FFD700
    style Success fill:#90EE90
    style Fail fill:#FF6B6B
```

## Rollback Process

```mermaid
graph TB
    Start([Rollback Triggered]) --> Check[Check Stack Status]

    Check --> CF{Stack in UPDATE state?}

    CF --> |Yes| CF1[Cancel Update Stack]
    CF --> |No| CF2[Skip CloudFormation Rollback]

    CF1 --> CF3[Wait for Rollback Complete]
    CF3 --> Amplify
    CF2 --> Amplify

    Amplify[Revert Amplify Deployment] --> A1[Get Amplify App ID]
    A1 --> A2[Find Previous Successful Job]
    A2 --> A3{Previous Job Found?}

    A3 --> |Yes| A4[Redeploy Previous Job]
    A3 --> |No| A5[Log Warning]

    A4 --> Notify[Send Urgent Notification]
    A5 --> Notify

    Notify --> End([Rollback Complete])

    style Start fill:#FF6B6B
    style CF1 fill:#FF6B6B
    style CF3 fill:#FF6B6B
    style A4 fill:#FF6B6B
    style Notify fill:#FF6B6B
    style End fill:#FF6B6B
```

## Environment Variables Flow

```mermaid
graph LR
    SAM[SAM Stack Outputs] --> Extract[Extract Variables]

    Extract --> Cognito[Cognito Pool ID & Client ID]
    Extract --> DynamoDB[DynamoDB Table Name]
    Extract --> S3[S3 Bucket Name]

    Cognito --> Amplify[Update Amplify Env Vars]
    DynamoDB --> Amplify
    S3 --> Amplify

    Amplify --> Build[Amplify Build Process]
    Build --> Deploy[Deploy to CDN]

    style SAM fill:#87CEEB
    style Extract fill:#FFD700
    style Amplify fill:#DDA0DD
    style Deploy fill:#90EE90
```

## Artifact Flow

```mermaid
graph TB
    Validate[Validate Job] --> A1[Changeset Preview Artifact]

    DeployInfra[Deploy Infrastructure Job] --> A2[Stack Outputs Artifact]

    A2 --> DeployFrontend[Deploy Frontend Job]

    SmokeTests[Smoke Tests Job] --> A3[Test Results Artifact]

    A1 --> Download1[Download for Review]
    A2 --> Download2[Download for Debugging]
    A3 --> Download3[Download for Analysis]

    style A1 fill:#FFD700
    style A2 fill:#FFD700
    style A3 fill:#FFD700
```

## Timeline

```mermaid
gantt
    title Development Deployment Timeline
    dateFormat mm:ss
    axisFormat %M:%S

    section Validation
    Validate SAM Template    :00:00, 02:00
    Run cfn-lint            :00:30, 01:30
    Generate Preview        :01:00, 01:00

    section Infrastructure
    Deploy SAM Stack        :02:00, 08:00
    Wait for Stable         :05:00, 05:00
    Capture Outputs         :10:00, 00:30

    section Frontend
    Update Env Vars         :10:30, 01:00
    Trigger Amplify         :11:30, 00:30
    Monitor Deployment      :12:00, 13:00

    section Testing
    Run Smoke Tests         :25:00, 05:00

    section Notification
    Send Notifications      :30:00, 00:30
```

## Legend

- 🟢 **Green**: Success states
- 🔵 **Blue**: Processing/In-progress states
- 🟡 **Yellow**: Testing/Validation states
- 🔴 **Red**: Failure/Rollback states
- 🟣 **Purple**: Notification states

## Notes

1. **Parallel Execution**: Some steps within jobs run in parallel (e.g., validation checks)
2. **Conditional Execution**: Rollback only runs on failure
3. **Always Execution**: Notify job always runs regardless of success/failure
4. **Artifact Retention**:
   - Changeset Preview: 7 days
   - Stack Outputs: 30 days
   - Test Results: 30 days
