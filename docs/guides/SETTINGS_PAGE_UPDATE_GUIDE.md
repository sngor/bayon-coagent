# Settings Page Update Guide

## Overview

This guide provides the exact code needed to integrate service status checks into the Settings page.

## Current Status

- ✅ API endpoint `/api/check-services` is fully functional
- ⏳ Settings page UI needs to be updated to display service statuses

## Code to Add

### 1. Add Service Status State Variables

Add these state declarations after the existing state variables in the `SettingsPage` component:

```typescript
// Service status states
const [bedrockStatus, setBedrockStatus] = useState<ServiceState>({
  status: "checking",
});
const [dynamodbStatus, setDynamodbStatus] = useState<ServiceState>({
  status: "checking",
});
const [s3Status, setS3Status] = useState<ServiceState>({ status: "checking" });
const [cognitoStatus, setCognitoStatus] = useState<ServiceState>({
  status: "checking",
});
const [cloudwatchStatus, setCloudwatchStatus] = useState<ServiceState>({
  status: "checking",
});
const [tavilyStatus, setTavilyStatus] = useState<ServiceState>({
  status: "checking",
});
const [newsApiStatus, setNewsApiStatus] = useState<ServiceState>({
  status: "checking",
});
const [bridgeApiStatus, setBridgeApiStatus] = useState<ServiceState>({
  status: "checking",
});
```

### 2. Add Type Definitions

Add these type definitions before the component:

```typescript
type ServiceStatus = "checking" | "connected" | "error" | "not-configured";

interface ServiceState {
  status: ServiceStatus;
  error?: string;
}
```

### 3. Add Service Check useEffect Hook

Add this useEffect hook to fetch service statuses:

```typescript
useEffect(() => {
  async function checkServices() {
    try {
      const response = await fetch("/api/check-services");

      if (response.ok) {
        const data = await response.json();

        // Update AWS service statuses
        if (data.aws) {
          setBedrockStatus(
            data.aws.bedrock || { status: "error", error: "Check failed" }
          );
          setDynamodbStatus(
            data.aws.dynamodb || { status: "error", error: "Check failed" }
          );
          setS3Status(
            data.aws.s3 || { status: "error", error: "Check failed" }
          );
          setCognitoStatus(
            data.aws.cognito || { status: "error", error: "Check failed" }
          );
          setCloudwatchStatus(
            data.aws.cloudwatch || { status: "error", error: "Check failed" }
          );
        }

        // Update external API statuses
        if (data.external) {
          setTavilyStatus(
            data.external.tavily || { status: "error", error: "Check failed" }
          );
          setNewsApiStatus(
            data.external.newsApi || { status: "error", error: "Check failed" }
          );
          setBridgeApiStatus(
            data.external.bridgeApi || {
              status: "error",
              error: "Check failed",
            }
          );
        }
      } else {
        // If endpoint fails, set all to error
        const errorState = {
          status: "error" as const,
          error: "Status check failed",
        };
        setBedrockStatus(errorState);
        setDynamodbStatus(errorState);
        setS3Status(errorState);
        setCognitoStatus(errorState);
        setCloudwatchStatus(errorState);
        setTavilyStatus(errorState);
        setNewsApiStatus(errorState);
        setBridgeApiStatus(errorState);
      }
    } catch (error) {
      console.error("Failed to check services:", error);
      // Set all to error state
      const errorState = {
        status: "error" as const,
        error: "Connection failed",
      };
      setBedrockStatus(errorState);
      setDynamodbStatus(errorState);
      setS3Status(errorState);
      setCognitoStatus(errorState);
      setCloudwatchStatus(errorState);
      setTavilyStatus(errorState);
      setNewsApiStatus(errorState);
      setBridgeApiStatus(errorState);
    }
  }

  checkServices();
}, []);
```

### 4. Add ServiceStatusRow Component

Add this component before the main SettingsPage component:

```typescript
function ServiceStatusRow({
  icon,
  name,
  description,
  details,
  status,
}: {
  icon: React.ReactNode;
  name: string;
  description: string;
  details?: string[];
  status: ServiceState;
}) {
  return (
    <div className="flex items-start justify-between rounded-lg border p-4">
      <div className="flex items-start gap-3 flex-1">
        <div className="rounded-lg bg-muted p-2 mt-0.5">{icon}</div>
        <div className="space-y-1 flex-1">
          <h3 className="font-semibold text-sm">{name}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
          {details && details.length > 0 && (
            <div className="mt-2 space-y-0.5">
              {details.map((detail, idx) => (
                <p
                  key={idx}
                  className="text-xs text-muted-foreground font-mono"
                >
                  {detail}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 ml-4">
        {status.status === "checking" && (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Checking...</span>
          </>
        )}
        {status.status === "connected" && (
          <>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-xs font-semibold text-green-600">
              Connected
            </span>
          </>
        )}
        {status.status === "error" && (
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-xs font-semibold text-red-600">Error</span>
            </div>
            {status.error && (
              <span className="text-xs text-red-600">{status.error}</span>
            )}
          </div>
        )}
        {status.status === "not-configured" && (
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="text-xs font-semibold text-yellow-600">
                Not Configured
              </span>
            </div>
            {status.error && (
              <span className="text-xs text-yellow-600">{status.error}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

### 5. Add Services Tab to TabsList

Add this tab trigger to the TabsList:

```typescript
<TabsTrigger value="services" className="flex items-center gap-2">
  <Activity className="h-4 w-4" />
  <span className="hidden sm:inline">Services</span>
</TabsTrigger>
```

### 6. Add Services TabContent

Add this tab content with the service status cards:

```typescript
<TabsContent value="services" className="space-y-6">
  <Card>
    <CardHeader>
      <CardTitle className="font-headline">AWS Services</CardTitle>
      <CardDescription>
        Core AWS infrastructure services powering the platform.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {/* AWS Bedrock */}
        <ServiceStatusRow
          icon={<Sparkles className="h-5 w-5" />}
          name="AWS Bedrock"
          description="AI content generation and analysis"
          details={[
            `Model: ${config.bedrock.modelId}`,
            `Region: ${config.bedrock.region}`,
          ]}
          status={bedrockStatus}
        />

        {/* DynamoDB */}
        <ServiceStatusRow
          icon={<Database className="h-5 w-5" />}
          name="Amazon DynamoDB"
          description="NoSQL database for user data"
          details={[
            `Table: ${config.dynamodb.tableName}`,
            `Region: ${config.region}`,
          ]}
          status={dynamodbStatus}
        />

        {/* S3 */}
        <ServiceStatusRow
          icon={<HardDrive className="h-5 w-5" />}
          name="Amazon S3"
          description="Object storage for files and assets"
          details={[
            `Bucket: ${config.s3.bucketName}`,
            `Region: ${config.region}`,
          ]}
          status={s3Status}
        />

        {/* Cognito */}
        <ServiceStatusRow
          icon={<Lock className="h-5 w-5" />}
          name="AWS Cognito"
          description="User authentication and authorization"
          details={[
            `User Pool: ${config.cognito.userPoolId}`,
            `Region: ${config.region}`,
          ]}
          status={cognitoStatus}
        />

        {/* CloudWatch */}
        <ServiceStatusRow
          icon={<Activity className="h-5 w-5" />}
          name="AWS CloudWatch"
          description="Logging and monitoring"
          details={[`Region: ${config.region}`]}
          status={cloudwatchStatus}
        />
      </div>
    </CardContent>
  </Card>

  <Card>
    <CardHeader>
      <CardTitle className="font-headline">External APIs</CardTitle>
      <CardDescription>
        Third-party services integrated into the platform.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {/* Tavily API */}
        <ServiceStatusRow
          icon={<Search className="h-5 w-5" />}
          name="Tavily API"
          description="Web search for AI research flows"
          status={tavilyStatus}
        />

        {/* NewsAPI */}
        <ServiceStatusRow
          icon={<Newspaper className="h-5 w-5" />}
          name="NewsAPI.org"
          description="Real estate news feed"
          status={newsApiStatus}
        />

        {/* Bridge API */}
        <ServiceStatusRow
          icon={<Link2 className="h-5 w-5" />}
          name="Bridge API"
          description="Zillow review integration"
          status={bridgeApiStatus}
        />
      </div>
    </CardContent>
  </Card>
</TabsContent>
```

### 7. Required Imports

Ensure these imports are present at the top of the file:

```typescript
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Sparkles,
  Database,
  HardDrive,
  Lock,
  Activity,
  Search,
  Newspaper,
  Link2,
} from "lucide-react";
import { getConfig } from "@/aws/config";
```

## Testing

After implementing these changes:

1. Start the dev server: `npm run dev`
2. Navigate to Settings page
3. Click on the "Services" tab
4. You should see all 8 services with their status
5. Services will show "Checking..." initially, then update to their actual status

## Visual States

- **Checking**: Gray spinner + "Checking..." text
- **Connected**: Green checkmark + "Connected" text
- **Error**: Red X + "Error" text + error message
- **Not Configured**: Yellow warning + "Not Configured" text + error message

## Notes

- The `config` variable should be obtained via `const config = getConfig();` in the component
- All service checks happen automatically on page load
- The API endpoint handles all the actual connectivity testing
- No sensitive data (API keys) is exposed to the client
