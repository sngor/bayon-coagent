'use client';

export default function TestEnvPage() {
    const handleTest = () => {
        console.log('=== CLIENT-SIDE ENVIRONMENT TEST ===');
        console.log('NEXT_PUBLIC_USER_POOL_CLIENT_ID:', process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID);
        console.log('NEXT_PUBLIC_USER_POOL_ID:', process.env.NEXT_PUBLIC_USER_POOL_ID);
        console.log('NEXT_PUBLIC_AWS_REGION:', process.env.NEXT_PUBLIC_AWS_REGION);
        console.log('NODE_ENV:', process.env.NODE_ENV);

        // These should be undefined on client-side
        console.log('COGNITO_CLIENT_ID (should be undefined):', process.env.COGNITO_CLIENT_ID);
        console.log('COGNITO_USER_POOL_ID (should be undefined):', process.env.COGNITO_USER_POOL_ID);

        alert(`Client-side NEXT_PUBLIC_USER_POOL_CLIENT_ID = ${process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || 'UNDEFINED'}`);
    };

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Client-Side Environment Test</h1>
            <button
                onClick={handleTest}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
                Test Client-Side Environment Variables
            </button>
            <div className="mt-4 text-sm text-gray-600">
                <p>This tests what environment variables are available in client-side JavaScript.</p>
                <p>Only NEXT_PUBLIC_ prefixed variables should be available.</p>
            </div>
        </div>
    );
}