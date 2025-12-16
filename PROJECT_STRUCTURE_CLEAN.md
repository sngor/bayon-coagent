# Clean Project Structure

## Root Directory (Organized)

### Configuration Files

- `package.json` - Node.js dependencies and scripts
- `next.config.ts` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration
- `jest.config.js` - Jest testing configuration
- `components.json` - shadcn/ui components configuration
- `samconfig.toml` - AWS SAM configuration
- `amplify.yml` - AWS Amplify build configuration
- `docker-compose.yml` - LocalStack development setup

### Environment Files

- `.env.example` - Environment template
- `.env.example.api-gateway` - API Gateway specific template
- `.env.local` - Local development (gitignored)
- `.env.production` - Production configuration
- `.env.production.example` - Production template
- `.env.production.local` - Local production override

### Documentation

- `README.md` - Main project documentation
- `CHANGELOG.md` - Version history
- `AGENTCORE_QUICK_REFERENCE.md` - AgentCore integration guide
- `INTEGRATION_GUIDE.md` - AI performance improvements guide
- `REALTIME_INTEGRATION_GUIDE.md` - Real-time features guide
- `CLEANUP_SUMMARY.md` - This cleanup documentation

### Assets

- `Logo.jpg`, `Logo.png`, `Logo.svg` - Brand assets
- `template.yaml` - Main SAM template

## Directory Structure

```
/
├── .github/           # GitHub workflows and templates
├── .husky/           # Git hooks
├── .kiro/            # Kiro IDE configuration
├── agents/           # AI agent definitions
├── amplify/          # AWS Amplify configuration
├── config/           # Configuration files
├── docs/             # Comprehensive documentation
├── infrastructure/   # AWS CDK and CloudFormation
│   └── cloudformation/  # Organized CF templates
├── public/           # Static assets
├── scripts/          # Organized automation scripts
│   ├── deployment/   # Deployment scripts
│   ├── development/  # Development utilities
│   ├── maintenance/  # Maintenance scripts
│   ├── migration/    # Migration utilities
│   └── smoke-tests/  # Testing scripts
├── src/              # Application source code
│   ├── app/          # Next.js App Router
│   │   ├── (app)/    # Authenticated routes (hub structure)
│   │   │   ├── dashboard/     # Overview hub
│   │   │   ├── assistant/     # AI chat hub
│   │   │   ├── studio/        # Content creation hub
│   │   │   ├── brand/         # Brand identity hub
│   │   │   ├── research/      # Research hub (research-agent, knowledge-base)
│   │   │   ├── market/        # Market intelligence hub
│   │   │   ├── tools/         # Deal analysis hub
│   │   │   ├── library/       # Content management hub
│   │   │   ├── learning/      # Skill development hub
│   │   │   ├── settings/      # Account settings
│   │   │   ├── admin/         # Admin interface
│   │   │   ├── super-admin/   # Super admin interface
│   │   │   ├── client-dashboards/  # Client portals
│   │   │   ├── client-gifts/  # Client gift management
│   │   │   ├── open-house/    # Open house management
│   │   │   └── support/       # Support pages
│   │   ├── (legal)/   # Legal pages (terms, privacy)
│   │   ├── (onboarding)/  # Onboarding flows
│   │   ├── api/       # API routes
│   │   └── portal/    # Client portal
│   ├── aws/          # AWS service integrations
│   ├── components/   # React components
│   ├── hooks/        # Custom React hooks
│   ├── lib/          # Utilities and helpers
│   └── types/        # TypeScript type definitions
└── tests/            # Test files
```

## Hub-Based Architecture

The application follows a clean hub-based architecture where each major feature area is organized as a hub:

### Content Creation Flow

`Studio` → `Library` (save content) → `Brand` (use in strategy)

### Research Flow

`Research` (research-agent, knowledge-base) → `Market` (apply insights) → `Tools` (analyze deals)

### Learning Flow

`Learning` → `Brand` (apply skills) → `Studio` (create content)

### Administrative Flow

`Admin`/`Super-Admin` → Monitor all hubs → `Settings` (configure)

## Benefits of Clean Structure

1. **Clear Navigation**: Hub-based structure matches user mental models
2. **Maintainable Code**: Organized by feature, not by file type
3. **Scalable Architecture**: Easy to add new hubs or features
4. **Developer Experience**: Clear file organization and documentation
5. **Deployment Ready**: Organized scripts and infrastructure code

This structure supports the product vision of an AI-powered success platform for real estate agents with clear feature boundaries and intuitive navigation.
