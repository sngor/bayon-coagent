export default function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // TEMPORARY: Disable all checks for testing
    console.log('Super Admin layout accessed');

    // TODO: Re-enable authentication checks when needed
    // Note: These checks need to be moved to a Server Component wrapper
    // or handled differently since this is now a Client Component

    return (
        <div className="space-y-6">
            {children}
        </div>
    );
}