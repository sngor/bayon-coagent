export default function SimpleOnboardingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div>
            <h1>Simple Onboarding Layout</h1>
            {children}
        </div>
    );
}