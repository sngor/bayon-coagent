# Configuration Reference

Complete reference for environment variables and configuration in the Bayon CoAgent platform.

## 🌍 Environment Variables

### Local Development (.env.local)

```bash
# Environment Configuration
NODE_ENV=development
USE_LOCAL_AWS=true

# AWS Configuration (LocalStack)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test

# AWS Services (LocalStack endpoints)
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX    # From localstack:init
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx # From localstack:init
DYNAMODB_TABLE_NAME=BayonCoAgent-local
S3_BUCKET_NAME=bayon-coagent-local

# Bedrock Configuration (uses real AWS)
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
BEDROCK_REGION=us-east-1

# External APIs
TAVILY_API_KEY=your-tavily-api-key
NEWS_API_KEY=your-news-api-key
BRIDGE_API_KEY=your-bridge-api-key

# Google OAuth (optional for local development)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/oauth/google/callback

# Development Features
DEBUG=false
SKIP_ENV_VALIDATION=false
ANALYZE=false
```

### Production (.env.production)

```bash
# Environment Configuration
NODE_ENV=production
USE_LOCAL_AWS=false

# AWS Configuration (uses IAM roles in production)
AWS_REGION=us-east-1

# AWS Services (Production resources)
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
DYNAMODB_TABLE_NAME=BayonCoAgent-prod
S3_BUCKET_NAME=bayon-coagent-storage-prod

# Bedrock Configuration
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
BEDROCK_REGION=us-east-1

# External APIs (use AWS Secrets Manager in production)
TAVILY_API_KEY=your-tavily-api-key
NEWS_API_KEY=your-news-api-key
BRIDGE_API_KEY=your-bridge-api-key

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/oauth/google/callback

# Production Features
NEXT_TELEMETRY_DISABLED=1
```

## 🔧 Configuration Files

### Next.js Configuration (next.config.ts)

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable experimental features
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "yourdomain.com"],
    },
  },

  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    domains: ["localhost", "yourdomain.com"],
  },

  // Bundle optimization
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },

  // Environment variables validation
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};

export default nextConfig;
```

### TypeScript Configuration (tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "ES6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Tailwind Configuration (tailwind.config.ts)

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

### ESLint Configuration (.eslintrc.json)

```json
{
  "extends": ["next/core-web-vitals", "next/typescript"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

### Jest Configuration (jest.config.js)

```javascript
const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapping: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
  collectCoverageFrom: ["src/**/*.{js,jsx,ts,tsx}", "!src/**/*.d.ts"],
};

module.exports = createJestConfig(customJestConfig);
```

## 🐳 Docker Configuration

### Docker Compose (docker-compose.yml)

```yaml
version: "3.8"

services:
  localstack:
    container_name: localstack_main
    image: localstack/localstack:latest
    ports:
      - "4566:4566"
      - "4510-4559:4510-4559"
    environment:
      - SERVICES=dynamodb,s3,cognito-idp,sts,iam
      - DEBUG=1
      - DATA_DIR=/tmp/localstack/data
      - DOCKER_HOST=unix:///var/run/docker.sock
      - HOST_TMP_FOLDER=${TMPDIR:-/tmp/}localstack
    volumes:
      - "./localstack-data:/tmp/localstack"
      - "/var/run/docker.sock:/var/run/docker.sock"
```

## ☁️ AWS Configuration

### SAM Template (template.yaml)

```yaml
AWSTemplateFormatVersion: "2010-09-09"
Transform: AWS::Serverless-2016-10-31
Description: Bayon CoAgent Infrastructure

Parameters:
  Environment:
    Type: String
    Default: development
    AllowedValues: [development, staging, production]

Globals:
  Function:
    Timeout: 30
    Runtime: nodejs18.x
    Environment:
      Variables:
        NODE_ENV: !Ref Environment

Resources:
  # DynamoDB Table
  DynamoDBTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub "BayonCoAgent-${Environment}"
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: PK
          AttributeType: S
        - AttributeName: SK
          AttributeType: S
      KeySchema:
        - AttributeName: PK
          KeyType: HASH
        - AttributeName: SK
          KeyType: RANGE

  # S3 Bucket
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "bayon-coagent-storage-${Environment}"
      CorsConfiguration:
        CorsRules:
          - AllowedHeaders: ["*"]
            AllowedMethods: [GET, PUT, POST, DELETE]
            AllowedOrigins: ["*"]

  # Cognito User Pool
  CognitoUserPool:
    Type: AWS::Cognito::UserPool
    Properties:
      UserPoolName: !Sub "BayonCoAgent-${Environment}"
      AutoVerifiedAttributes:
        - email
      Policies:
        PasswordPolicy:
          MinimumLength: 8
          RequireUppercase: true
          RequireLowercase: true
          RequireNumbers: true

  # Cognito User Pool Client
  CognitoUserPoolClient:
    Type: AWS::Cognito::UserPoolClient
    Properties:
      UserPoolId: !Ref CognitoUserPool
      ClientName: !Sub "BayonCoAgent-Client-${Environment}"
      GenerateSecret: false
      ExplicitAuthFlows:
        - ALLOW_USER_SRP_AUTH
        - ALLOW_REFRESH_TOKEN_AUTH

Outputs:
  DynamoDBTableName:
    Description: DynamoDB Table Name
    Value: !Ref DynamoDBTable
    Export:
      Name: !Sub "${AWS::StackName}-DynamoDBTable"

  S3BucketName:
    Description: S3 Bucket Name
    Value: !Ref S3Bucket
    Export:
      Name: !Sub "${AWS::StackName}-S3Bucket"

  CognitoUserPoolId:
    Description: Cognito User Pool ID
    Value: !Ref CognitoUserPool
    Export:
      Name: !Sub "${AWS::StackName}-UserPoolId"

  CognitoClientId:
    Description: Cognito Client ID
    Value: !Ref CognitoUserPoolClient
    Export:
      Name: !Sub "${AWS::StackName}-ClientId"
```

### SAM Configuration (samconfig.toml)

```toml
version = 0.1

[default]
[default.global.parameters]
stack_name = "bayon-coagent"

[default.build.parameters]
cached = true
parallel = true

[default.validate.parameters]
lint = true

[default.deploy.parameters]
capabilities = "CAPABILITY_IAM"
confirm_changeset = true
resolve_s3 = true
s3_prefix = "bayon-coagent"
region = "us-east-1"
image_repositories = []

[development]
[development.deploy.parameters]
stack_name = "bayon-coagent-development"
parameter_overrides = "Environment=development"

[production]
[production.deploy.parameters]
stack_name = "bayon-coagent-production"
parameter_overrides = "Environment=production"
```

## 🔐 Security Configuration

### Environment Variable Validation

```typescript
// src/lib/env.ts
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "staging", "production"]),
  USE_LOCAL_AWS: z.string().transform((val) => val === "true"),
  AWS_REGION: z.string(),
  COGNITO_USER_POOL_ID: z.string(),
  COGNITO_CLIENT_ID: z.string(),
  DYNAMODB_TABLE_NAME: z.string(),
  S3_BUCKET_NAME: z.string(),
  BEDROCK_MODEL_ID: z.string(),
  TAVILY_API_KEY: z.string().optional(),
  NEWS_API_KEY: z.string().optional(),
  BRIDGE_API_KEY: z.string().optional(),
});

export const env = envSchema.parse(process.env);
```

### AWS Configuration

```typescript
// src/aws/config.ts
import { env } from "@/lib/env";

export function getAWSConfig() {
  const config: any = {
    region: env.AWS_REGION,
  };

  if (env.USE_LOCAL_AWS) {
    config.endpoint = "http://localhost:4566";
    config.credentials = {
      accessKeyId: "test",
      secretAccessKey: "test",
    };
  }

  return config;
}
```

## 📱 PWA Configuration

> **Note**: PWA features are disabled by default. Service worker registration and background sync are disabled to prevent 404 errors when service worker files are not present.

### Enabling PWA Features

To enable PWA functionality:

#### 1. Environment Variable

```bash
# .env.local (development) or .env.production (production)
NEXT_PUBLIC_ENABLE_SERVICE_WORKER=true
```

#### 2. Service Worker File

Create a service worker file in the `public` directory:

```javascript
// public/sw.js - Basic service worker
self.addEventListener('install', (event) => {
  console.log('Service worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service worker activating...');
  event.waitUntil(clients.claim());
});

// Add caching, push notifications, background sync as needed
```

### Manifest (public/manifest.json)

```json
{
  "name": "Bayon CoAgent",
  "short_name": "CoAgent",
  "description": "AI-powered success platform for real estate agents",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    {
      "src": "/icon-192x192.svg",
      "sizes": "192x192",
      "type": "image/svg+xml"
    },
    {
      "src": "/icon-512x512.svg",
      "sizes": "512x512",
      "type": "image/svg+xml"
    }
  ]
}
```

### Current Status

- **PWA Manager**: Disabled by default, requires service worker
- **Background Sync**: Disabled by default, requires service worker
- **Push Notifications**: Available when service worker is enabled
- **Install Prompt**: Available when PWA criteria are met
- **Offline Caching**: Requires custom service worker implementation

## 🔍 Monitoring Configuration

### CloudWatch Configuration

```typescript
// src/aws/logging/cloudwatch.ts
import {
  CloudWatchLogsClient,
  PutLogEventsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { getAWSConfig } from "../config";

const client = new CloudWatchLogsClient(getAWSConfig());

export async function logEvent(logGroupName: string, message: string) {
  const command = new PutLogEventsCommand({
    logGroupName,
    logStreamName: `app-${new Date().toISOString().split("T")[0]}`,
    logEvents: [
      {
        timestamp: Date.now(),
        message: JSON.stringify({
          timestamp: new Date().toISOString(),
          message,
          environment: process.env.NODE_ENV,
        }),
      },
    ],
  });

  await client.send(command);
}
```

## 🚀 Performance Configuration

### Bundle Analysis Configuration

```javascript
// next.config.js (bundle analyzer)
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

module.exports = withBundleAnalyzer({
  // Your Next.js config
});
```

### Lighthouse CI Configuration (.lighthouserc.js)

```javascript
module.exports = {
  ci: {
    collect: {
      url: ["http://localhost:3000"],
      startServerCommand: "npm run start",
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.9 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "categories:best-practices": ["warn", { minScore: 0.9 }],
        "categories:seo": ["warn", { minScore: 0.9 }],
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
```

## 📋 Configuration Checklist

### Local Development Setup

- [ ] Copy `.env.example` to `.env.local`
- [ ] Update Cognito IDs from `localstack:init`
- [ ] Add external API keys
- [ ] Verify LocalStack is running
- [ ] Run `npm run verify:setup`

### Production Deployment

- [ ] Configure production environment variables
- [ ] Set up AWS IAM roles and policies
- [ ] Deploy infrastructure with SAM
- [ ] Update environment variables with real AWS resources
- [ ] Configure domain and SSL certificates
- [ ] Set up monitoring and alerting

### Security Checklist

- [ ] Never commit `.env.local` or `.env.production`
- [ ] Use AWS Secrets Manager for production secrets
- [ ] Enable HTTPS in production
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable AWS WAF protection

This configuration reference provides comprehensive guidance for setting up and configuring the Bayon CoAgent platform across all environments.
