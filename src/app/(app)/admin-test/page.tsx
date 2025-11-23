export default function AdminTestPage() {
    return (
        <div className="p-8">
            <h1 className="font-headline text-2xl font-bold mb-4">Admin Test Page</h1>
            <p>If you can see this, admin routing is working!</p>
            <div className="mt-4 p-4 bg-green-100 dark:bg-green-950/50 rounded">
                <p>✅ Admin access confirmed</p>
                <p>🎯 You can now access admin features</p>
            </div>
        </div>
    );
}