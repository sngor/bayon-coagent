# CI/CD Setup Flow Diagram

Visual guide for understanding the GitHub repository setup process.

## 🔄 Setup Flow

```mermaid
graph TD
    A[Start: Task 1] --> B[Gather Prerequisites]
    B --> C[AWS Credentials]
    B --> D[Slack Webhook]
    B --> E[Service Tokens]

    C --> F[Configure GitHub Secrets]
    D --> F
    E --> F

    F --> G[Create GitHub Environments]
    G --> H[Development<br/>No Approval]
    G --> I[Staging<br/>1 Approval]
    G --> J[Production<br/>2 Approvals]

    H --> K[Configure Branch Protection]
    I --> K
    J --> K

    K --> L[Main Branch<br/>2 Approvals + Checks]
    K --> M[Develop Branch<br/>1 Approval + Checks]

    L --> N[Run Verification]
    M --> N

    N --> O[verify-secrets.yml]
    N --> P[test-environments.yml]
    N --> Q[test-slack.yml]

    O --> R{All Pass?}
    P --> R
    Q --> R

    R -->|Yes| S[✅ Task 1 Complete]
    R -->|No| T[Fix Issues]
    T --> F

    S --> U[Proceed to Task 2]
```

## 🏗️ Architecture Overview

```mermaid
graph LR
    subgraph "GitHub Repository"
        A[Secrets] --> B[Workflows]
        C[Environments] --> B
        D[Branch Protection] --> B
    end

    subgraph "AWS"
        E[Development]
        F[Staging]
        G[Production]
    end

    subgraph "Notifications"
        H[Slack]
        I[Email]
    end

    subgraph "Security"
        J[Snyk]
        K[CodeQL]
        L[Codecov]
    end

    B --> E
    B --> F
    B --> G
    B --> H
    B --> I
    B --> J
    B --> K
    B --> L
```

## 🔐 Secrets Configuration Flow

```mermaid
graph TD
    A[GitHub Secrets] --> B[AWS Credentials]
    A --> C[Notification Services]
    A --> D[Third-Party Services]

    B --> B1[Development]
    B --> B2[Staging]
    B --> B3[Production]

    B1 --> E[Workflows Access Secrets]
    B2 --> E
    B3 --> E

    C --> C1[Slack Webhook]
    C --> C2[Slack Channels]
    C1 --> E
    C2 --> E

    D --> D1[Snyk Token]
    D --> D2[Codecov Token]
    D1 --> E
    D2 --> E

    E --> F[Deploy to AWS]
    E --> G[Send Notifications]
    E --> H[Run Security Scans]
```

## 🌍 Environment Approval Flow

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant GH as GitHub Actions
    participant DevEnv as Development
    participant StgEnv as Staging
    participant ProdEnv as Production

    Dev->>GH: Push to develop
    GH->>DevEnv: Deploy (No Approval)
    DevEnv-->>GH: Success

    Dev->>GH: Create rc-* tag
    GH->>StgEnv: Request Deployment
    StgEnv-->>Dev: Requires 1 Approval
    Dev->>StgEnv: Approve
    StgEnv->>GH: Deploy
    GH-->>Dev: Success

    Dev->>GH: Create v* tag
    GH->>ProdEnv: Request Deployment
    ProdEnv-->>Dev: Requires 2 Approvals
    Dev->>ProdEnv: Approve (1/2)
    Dev->>ProdEnv: Approve (2/2)
    ProdEnv->>GH: Wait 5 minutes
    GH->>ProdEnv: Deploy
    ProdEnv-->>Dev: Success
```

## 🛡️ Branch Protection Flow

```mermaid
graph TD
    A[Developer Creates PR] --> B{Target Branch?}

    B -->|develop| C[Develop Protection]
    B -->|main| D[Main Protection]

    C --> C1[Run Quality Checks]
    C --> C2[Run Unit Tests]
    C --> C3[Run Build]

    C1 --> E{All Pass?}
    C2 --> E
    C3 --> E

    E -->|No| F[❌ Block Merge]
    E -->|Yes| G[Require 1 Approval]

    G --> H{Approved?}
    H -->|No| F
    H -->|Yes| I[✅ Allow Merge]

    D --> D1[Run All Quality Checks]
    D --> D2[Run All Tests]
    D --> D3[Run Security Scans]
    D --> D4[Run Build]

    D1 --> J{All Pass?}
    D2 --> J
    D3 --> J
    D4 --> J

    J -->|No| F
    J -->|Yes| K[Require 2 Approvals]

    K --> L{2 Approved?}
    L -->|No| F
    L -->|Yes| I
```

## 📊 Verification Process

```mermaid
graph TD
    A[Setup Complete] --> B[Run Verification]

    B --> C[verify-secrets.yml]
    B --> D[test-environments.yml]
    B --> E[test-slack.yml]

    C --> C1{Check AWS Dev}
    C --> C2{Check AWS Staging}
    C --> C3{Check AWS Prod}
    C --> C4{Check Slack}
    C --> C5{Check Snyk}
    C --> C6{Check Codecov}

    C1 --> F{All Secrets OK?}
    C2 --> F
    C3 --> F
    C4 --> F
    C5 --> F
    C6 --> F

    D --> D1{Dev Env Exists?}
    D --> D2{Staging Env Exists?}
    D --> D3{Prod Env Exists?}

    D1 --> G{All Envs OK?}
    D2 --> G
    D3 --> G

    E --> E1{Slack DevOps OK?}
    E --> E2{Slack Team OK?}

    E1 --> H{Slack OK?}
    E2 --> H

    F -->|Yes| I[✅ Secrets Verified]
    F -->|No| J[❌ Fix Secrets]

    G -->|Yes| K[✅ Environments Verified]
    G -->|No| L[❌ Fix Environments]

    H -->|Yes| M[✅ Notifications Verified]
    H -->|No| N[❌ Fix Slack]

    I --> O{All Verified?}
    K --> O
    M --> O

    O -->|Yes| P[🎉 Setup Complete]
    O -->|No| Q[Review Issues]

    J --> Q
    L --> Q
    N --> Q

    Q --> R[Fix and Retry]
    R --> B
```

## 🔄 Deployment Pipeline Overview

```mermaid
graph LR
    A[Code Push] --> B{Branch?}

    B -->|feature| C[Quality Checks]
    B -->|develop| D[Deploy Dev]
    B -->|rc-*| E[Deploy Staging]
    B -->|v*| F[Deploy Prod]

    C --> C1[Lint]
    C --> C2[Test]
    C --> C3[Build]

    D --> D1[Quality Checks]
    D1 --> D2[Deploy Infrastructure]
    D2 --> D3[Deploy Frontend]
    D3 --> D4[Smoke Tests]

    E --> E1[Quality Checks]
    E1 --> E2[Require Approval]
    E2 --> E3[Deploy Infrastructure]
    E3 --> E4[Deploy Frontend]
    E4 --> E5[Integration Tests]
    E5 --> E6[Performance Tests]

    F --> F1[Quality Checks]
    F1 --> F2[Require 2 Approvals]
    F2 --> F3[Create Backup]
    F3 --> F4[Deploy Infrastructure]
    F4 --> F5[Deploy Frontend]
    F5 --> F6[Smoke Tests]
    F6 --> F7[Monitor]
```

## 📈 Progressive Deployment Strategy

```mermaid
graph TD
    A[Development] -->|Automatic| B[Staging]
    B -->|1 Approval| C[Production]
    C -->|2 Approvals| D[Live]

    A --> A1[No Gates]
    A --> A2[Basic Tests]
    A --> A3[Fast Feedback]

    B --> B1[Approval Gate]
    B --> B2[Full Tests]
    B --> B3[Performance Tests]

    C --> C1[Multi-Approval]
    C --> C2[Backup Created]
    C --> C3[Gradual Rollout]
    C --> C4[Monitoring]

    D --> D1[100% Traffic]
    D --> D2[Full Monitoring]
    D --> D3[Rollback Ready]
```

## 🎯 Success Criteria

```mermaid
graph TD
    A[Task 1 Success] --> B[All Secrets Configured]
    A --> C[All Environments Created]
    A --> D[Branch Protection Enabled]
    A --> E[Verification Passes]

    B --> B1[✅ AWS Dev]
    B --> B2[✅ AWS Staging]
    B --> B3[✅ AWS Prod]
    B --> B4[✅ Slack]
    B --> B5[✅ Snyk]
    B --> B6[✅ Codecov]

    C --> C1[✅ Development]
    C --> C2[✅ Staging]
    C --> C3[✅ Production]

    D --> D1[✅ Main Protected]
    D --> D2[✅ Develop Protected]

    E --> E1[✅ Secrets Test Pass]
    E --> E2[✅ Environments Test Pass]
    E --> E3[✅ Slack Test Pass]

    B1 --> F[Ready for Task 2]
    B2 --> F
    B3 --> F
    B4 --> F
    B5 --> F
    B6 --> F
    C1 --> F
    C2 --> F
    C3 --> F
    D1 --> F
    D2 --> F
    E1 --> F
    E2 --> F
    E3 --> F
```

---

## 📝 How to Use These Diagrams

1. **Setup Flow**: Follow this for the overall process
2. **Architecture Overview**: Understand how components connect
3. **Secrets Configuration**: See how secrets flow to workflows
4. **Environment Approval**: Understand approval requirements
5. **Branch Protection**: See how PRs are validated
6. **Verification Process**: Follow the testing flow
7. **Deployment Pipeline**: Preview the full CI/CD flow
8. **Progressive Deployment**: Understand the deployment strategy
9. **Success Criteria**: Checklist for completion

---

**Note**: These diagrams use Mermaid syntax and will render in GitHub, VS Code with Mermaid extension, or any Markdown viewer that supports Mermaid.
