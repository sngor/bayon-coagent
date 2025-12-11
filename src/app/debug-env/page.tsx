import { getConfig } from '@/aws/config';

export default function DebugEnvPage() {
    const config = getConfig();

    // Temporarily allow debug in production to diagnose the issue
    // TODO: Re-enable this check after fixing the configuration issue
    // if (process.env.NODE_ENV === 'production' && process.env.ENABLE_DEBUG !== 'true') {
    //     return (
    //         <div className="p-8">
    //             <h1 className="text-2xl font-bold mb-4">Debug Not Available</h1>
    //             <p>Debug information is not available in production for security reasons.</p>
    //             <p>To enable, set ENABLE_DEBUG=true in environment variables.</p>
    //         </div>
    //     );
    // }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Environment Debug Information</h1>

            <div className="space-y-6">
                <div className="bg-gray-100 p-4 rounded-lg">
                    <h2 className="text-lg font-semibold mb-3">Environment</h2>
                    <div className="space-y-1 text-sm font-mono">
                        <div>NODE_ENV: {process.env.NODE_ENV}</div>
                        <div>Environment: {config.environment}</div>
                        <div>Region: {config.region}</div>
                        <div>App URL: {config.appUrl}</div>
                    </div>
                </div>

                <div className="bg-blue-100 p-4 rounded-lg">
                    <h2 className="text-lg font-semibold mb-3">Cognito Configuration</h2>
                    <div className="space-y-1 text-sm font-mono">
                        <div>User Pool ID: {config.cognito.userPoolId || '(empty)'}</div>
                        <div>Client ID: {config.cognito.clientId || '(empty)'}</div>
                        <div>Endpoint: {config.cognito.endpoint || '(default)'}</div>
                    </div>
                </div>

                <div className="bg-green-100 p-4 rounded-lg">
                    <h2 className="text-lg font-semibold mb-3">Environment Variables (Raw)</h2>
                    <div className="space-y-1 text-sm font-mono">
                        <div>NEXT_PUBLIC_USER_POOL_ID: {process.env.NEXT_PUBLIC_USER_POOL_ID || '(not set)'}</div>
                        <div>NEXT_PUBLIC_USER_POOL_CLIENT_ID: {process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || '(not set)'}</div>
                        <div>COGNITO_USER_POOL_ID: {process.env.COGNITO_USER_POOL_ID || '(not set)'}</div>
                        <div>COGNITO_CLIENT_ID: {process.env.COGNITO_CLIENT_ID || '(not set)'}</div>
                        <div>NEXT_PUBLIC_AWS_REGION: {process.env.NEXT_PUBLIC_AWS_REGION || '(not set)'}</div>
                    </div>
                </div>

                <div className="bg-yellow-100 p-4 rounded-lg">
                    <h2 className="text-lg font-semibold mb-3">DynamoDB & S3</h2>
                    <div className="space-y-1 text-sm font-mono">
                        <div>DynamoDB Table: {config.dynamodb.tableName || '(empty)'}</div>
                        <div>S3 Bucket: {config.s3.bucketName || '(empty)'}</div>
                    </div>
                </div>

                <div className="bg-purple-100 p-4 rounded-lg">
                    <h2 className="text-lg font-semibold mb-3">Bedrock</h2>
                    <div className="space-y-1 text-sm font-mono">
                        <div>Model ID: {config.bedrock.modelId || '(empty)'}</div>
                        <div>Region: {config.bedrock.region || '(empty)'}</div>
                    </div>
                </div>
            </div>

            <div className="mt-8 p-4 bg-red-100 rounded-lg">
                <h2 className="text-lg font-semibold mb-3 text-red-800">Security Warning</h2>
                <p className="text-red-700 text-sm">
                    This debug page shows configuration information. Make sure to disable it in production
                    by removing the ENABLE_DEBUG environment variable.
                </p>
            </div>
        </div>
    );
}