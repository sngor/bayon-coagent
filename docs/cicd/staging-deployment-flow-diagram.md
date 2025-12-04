# Staging Deployment Flow Diagram

## Overview

This diagram shows the complete flow of the staging deployment workflow, including all jobs, dependencies, and decision points.

## Workflow Diagram

```mermaid
graph TB
    Start([Tag Push: rc-*<br/>or Manual Trigger]) --> PreChecks

    subgraph "Pre-Deployment Phase"
        PreChecks[Pre-Deployment Checks<br/>5-10 minutes]
        PreChecks --> ESLint[Run ESLint]
        PreChecks --> TypeCheck[Run TypeScript]
        PreChecks --> Tests[Run Unit Tests]
        PreChecks --> Security[Run Security Scan]

        ESLint --> Checklist[Generate Checklist]
        TypeCheck --> Checklist
        Tests --> Checklist
        Security --> Checklist
    end

    Checklist --> Approval

    subgraph "Approval Phase"
        Approval{Manual Approval<br/>Required<br/>Timeout: 24h}
        Approval -->|Approved| Validate
        Approval -->|Timeout/Rejected| End1([Workflow Cancelled])
    end

    subgraph "Validation Phase"
        Validate[Validate Infrastructure<br/>2-3 minutes]
        Validate --> SAMValidate[SAM Validate]
        Validate --> CFNLint[cfn-lint]
        Validate --> ChangePreview[Generate Change Preview]
    end

    ChangePreview --> DeployInfra

    subgraph "Infrastructure Deployment"
        DeployInfra[Deploy Infrastructure<br/>10-15 minutes]
        DeployInfra --> SAMDeploy[SAM Deploy]
        SAMDeploy --> WaitStack[Wait for Stack Stable]
        WaitStack --> CaptureOutputs[Capture Stack Outputs]
    end

    CaptureOutputs --> DeployFrontend

    subgraph "Frontend Deployment"
        DeployFrontend[Deploy Frontend<br/>5-10 minutes]
        DeployFrontend --> ExtractVars[Extract Env Vars]
        ExtractVars --> UpdateAmplify[Update Amplify Config]
        UpdateAmplify --> TriggerAmplify[Trigger Amplify Deploy]
        TriggerAmplify --> MonitorAmplify[Monitor Progress]
        MonitorAmplify --> CaptureURL[Capture Deployment URL]
    end

    CaptureURL --> IntegrationTests

    subgraph "Integration Testing"
        IntegrationTests[Integration Tests<br/>10-15 minutes]
        IntegrationTests --> TestAuth[Test Auth Flows]
        IntegrationTests --> TestContent[Test Content Creation]
        IntegrationTests --> TestOAuth[Test OAuth]
        IntegrationTests --> TestAI[Test AI Services]

        TestAuth --> TestResults{All Tests<br/>Passed?}
        TestContent --> TestResults
        TestOAuth --> TestResults
        TestAI --> TestResults
    end

    TestResults -->|Yes| MarkReady
    TestResults -->|No| NotifyFail

    subgraph "Release Management"
        MarkReady[Mark Release Ready<br/>1-2 minutes]
        MarkReady --> GenNotes[Generate Release Notes]
        GenNotes --> UpdateRelease[Update GitHub Release]
        UpdateRelease --> NotifyStakeholders[Notify Stakeholders]
    end

    NotifyStakeholders --> NotifySuccess

    subgraph "Notifications"
        NotifySuccess[Send Success Notification]
        NotifyFail[Send Failure Notification]
    end

    NotifySuccess --> End2([Deployment Complete<br/>Ready for Production])
    NotifyFail --> End3([Deployment Failed<br/>Review Logs])

    style Start fill:#e1f5e1
    style End1 fill:#ffe1e1
    style End2 fill:#e1f5e1
    style End3 fill:#ffe1e1
    style Approval fill:#fff4e1
    style TestResults fill:#fff4e1
```

## Job Dependencies

```mermaid
graph LR
    A[pre-deployment-checks] --> B[approval-gate]
    B --> C[validate]
    C --> D[deploy-infrastructure]
    D --> E[deploy-frontend]
    E --> F[integration-tests]
    F --> G[mark-release-ready]
    G --> H[notify]

    D -.failure.-> H
    E -.failure.-> H
    F -.failure.-> H
```

## Timeline

```mermaid
gantt
    title Staging Deployment Timeline
    dateFormat mm:ss
    axisFormat %M:%S

    section Pre-Deployment
    Pre-Deployment Checks    :a1, 00:00, 10m
    Generate Checklist       :a2, after a1, 1m

    section Approval
    Manual Approval          :crit, a3, after a2, 5m

    section Validation
    Infrastructure Validation :a4, after a3, 3m

    section Deployment
    Deploy Infrastructure    :a5, after a4, 15m
    Deploy Frontend          :a6, after a5, 10m

    section Testing
    Integration Tests        :a7, after a6, 15m

    section Release
    Mark Release Ready       :a8, after a7, 2m
    Send Notifications       :a9, after a8, 1m
```

## Decision Points

### 1. Pre-Deployment Checks

```
┌─────────────────────────┐
│ Pre-Deployment Checks   │
└───────────┬─────────────┘
            │
            ├─ ESLint ────────┐
            ├─ TypeScript ────┤
            ├─ Unit Tests ────┤
            └─ Security ──────┤
                              │
                              ▼
                    ┌─────────────────┐
                    │ Generate        │
                    │ Checklist       │
                    └────────┬────────┘
                             │
                             ▼
                    Continue to Approval
                    (even if checks failed)
```

### 2. Approval Gate

```
┌─────────────────────────┐
│ Approval Gate           │
│ Timeout: 24 hours       │
└───────────┬─────────────┘
            │
            ├─ Approved ──────► Continue Deployment
            ├─ Rejected ──────► Cancel Workflow
            └─ Timeout ───────► Cancel Workflow
```

### 3. Integration Tests

```
┌─────────────────────────┐
│ Integration Tests       │
└───────────┬─────────────┘
            │
            ├─ All Passed ────► Mark Release Ready
            └─ Any Failed ────► Send Failure Notification
                                 (No automatic rollback)
```

## Artifact Flow

```mermaid
graph LR
    A[Pre-Deployment Checks] -->|Check Results| B[Artifacts]
    A -->|Deployment Checklist| B

    C[Validate] -->|Changeset Preview| B

    D[Deploy Infrastructure] -->|Stack Outputs| B

    E[Integration Tests] -->|Test Report| B

    F[Mark Release Ready] -->|Release Notes| B

    B -->|Retention: 30 days| G[GitHub Artifacts]
```

## Notification Flow

```mermaid
graph TB
    Start[Workflow Triggered] --> PreCheck{Pre-Checks<br/>Complete?}

    PreCheck -->|Yes| Approval[Waiting for Approval]

    Approval --> Deploy{Deployment<br/>Started?}

    Deploy -->|Yes| InfraSuccess{Infrastructure<br/>Success?}

    InfraSuccess -->|Yes| FrontendSuccess{Frontend<br/>Success?}
    InfraSuccess -->|No| NotifyInfraFail[Notify: Infrastructure Failed]

    FrontendSuccess -->|Yes| TestSuccess{Tests<br/>Passed?}
    FrontendSuccess -->|No| NotifyFrontendFail[Notify: Frontend Failed]

    TestSuccess -->|Yes| NotifySuccess[Notify: Deployment Success<br/>Release Ready]
    TestSuccess -->|No| NotifyTestFail[Notify: Tests Failed]

    NotifySuccess --> End[End]
    NotifyInfraFail --> End
    NotifyFrontendFail --> End
    NotifyTestFail --> End

    style NotifySuccess fill:#e1f5e1
    style NotifyInfraFail fill:#ffe1e1
    style NotifyFrontendFail fill:#ffe1e1
    style NotifyTestFail fill:#ffe1e1
```

## Environment Progression

```mermaid
graph LR
    A[Development<br/>Auto-deploy on merge] --> B[Staging<br/>Approval-gated<br/>rc-* tags]
    B --> C[Production<br/>Multi-approval<br/>v* tags]

    style A fill:#e1f5e1
    style B fill:#fff4e1
    style C fill:#ffe1e1
```

## Key Features

### 1. Pre-Deployment Validation

- ✅ Code quality checks
- ✅ Security scans
- ✅ Unit tests
- ✅ Deployment checklist

### 2. Approval Gate

- ✅ Manual approval required
- ✅ Checklist displayed
- ✅ 24-hour timeout
- ✅ Environment protection

### 3. Infrastructure First

- ✅ SAM validation
- ✅ Change preview
- ✅ Stack deployment
- ✅ Output capture

### 4. Frontend Deployment

- ✅ Environment variables
- ✅ Amplify deployment
- ✅ Progress monitoring
- ✅ URL capture

### 5. Integration Testing

- ✅ Auth flows
- ✅ Content creation
- ✅ OAuth integrations
- ✅ AI services

### 6. Release Management

- ✅ Release notes
- ✅ GitHub release
- ✅ Stakeholder notification
- ✅ Production readiness

## Comparison with Development Deployment

| Feature            | Development     | Staging               |
| ------------------ | --------------- | --------------------- |
| Trigger            | Push to develop | Tag rc-\*             |
| Approval           | None            | Required (1 reviewer) |
| Pre-Checks         | Basic           | Comprehensive         |
| Integration Tests  | None            | Full suite            |
| Release Management | None            | Automatic             |
| Rollback           | Automatic       | Manual                |
| Timeout            | None            | 24 hours              |

## Next Steps

After successful staging deployment:

1. **Verify Deployment**

   - Test at staging URL
   - Review CloudWatch logs
   - Check for errors

2. **Get Feedback**

   - Share with stakeholders
   - Collect feedback
   - Document issues

3. **Promote to Production**
   - Create production tag (v\*)
   - Trigger production deployment
   - Monitor closely

## Related Diagrams

- [Development Deployment Flow](./deployment-flow-diagram.md)
- [Production Deployment Flow](./production-deployment-flow-diagram.md)
- [Rollback Flow](./rollback-flow-diagram.md)
