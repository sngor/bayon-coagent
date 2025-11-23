import { Metadata } from "next";
import { Shield, Lock, Eye, Database, Globe, UserCheck, Brain, Server } from "lucide-react";

export const metadata: Metadata = {
    title: "Privacy Policy | Bayon Coagent",
    description: "Privacy Policy for Bayon Coagent - How we collect, use, and protect your data",
};

export default function PrivacyPolicyPage() {
    return (
        <div className="container max-w-4xl py-12 px-4">
            <div className="mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
                    <Shield className="h-4 w-4" />
                    Your Privacy Matters
                </div>
                <h1 className="text-5xl font-bold mb-4 font-headline">Privacy Policy</h1>
                <p className="text-lg text-muted-foreground">
                    Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </p>
            </div>

            <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
                <section className="bg-muted/30 rounded-lg p-6 border">
                    <h2 className="font-headline text-2xl font-semibold mb-4 flex items-center gap-2">
                        <Eye className="h-6 w-6 text-primary" />
                        1. Introduction
                    </h2>
                    <p className="text-base leading-relaxed">
                        Welcome to Bayon Coagent ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data.
                        This privacy policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered
                        success platform for real estate agents.
                    </p>
                </section>

                <section>
                    <h2 className="font-headline text-2xl font-semibold mb-4 flex items-center gap-2">
                        <Database className="h-6 w-6 text-primary" />
                        2. Information We Collect
                    </h2>

                    <h3 className="font-headline text-xl font-semibold mb-3 mt-6">2.1 Information You Provide</h3>
                    <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Account Information:</strong> Name, email address, phone number, business name, and professional details</li>
                        <li><strong>Profile Data:</strong> Professional bio, service areas, specializations, certifications, and brand information</li>
                        <li><strong>Content:</strong> Blog posts, social media content, listing descriptions, and other materials you create</li>
                        <li><strong>Business Information:</strong> Google Business Profile data, Zillow reviews, and competitor information</li>
                        <li><strong>Payment Information:</strong> Billing details processed securely through our payment processor</li>
                    </ul>

                    <h3 className="font-headline text-xl font-semibold mb-3 mt-6">2.2 Automatically Collected Information</h3>
                    <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Usage Data:</strong> Features used, content generated, time spent, and interaction patterns</li>
                        <li><strong>Device Information:</strong> Browser type, operating system, IP address, and device identifiers</li>
                        <li><strong>Log Data:</strong> Access times, pages viewed, and system activity</li>
                    </ul>
                </section>

                <section>
                    <h2 className="font-headline text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
                    <p className="mb-4">We use your information to:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Provide, maintain, and improve our AI-powered platform</li>
                        <li>Generate personalized content and marketing strategies</li>
                        <li>Conduct market research and competitor analysis</li>
                        <li>Process your transactions and manage your account</li>
                        <li>Send you service updates, security alerts, and support messages</li>
                        <li>Respond to your requests and provide customer support</li>
                        <li>Analyze usage patterns to enhance user experience</li>
                        <li>Comply with legal obligations and enforce our terms</li>
                    </ul>
                </section>

                <section className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-6 border border-purple-200 dark:border-purple-900">
                    <h2 className="font-headline text-2xl font-semibold mb-4 flex items-center gap-2">
                        <Brain className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        4. AI and Data Processing
                    </h2>
                    <p className="mb-4 text-base">
                        Our platform uses AWS Bedrock with Claude AI to generate content and insights. When you use our AI features:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Your prompts and generated content are processed by AWS Bedrock</li>
                        <li>AWS does not use your data to train their models</li>
                        <li>All AI processing occurs within our secure AWS infrastructure</li>
                        <li>Generated content belongs to you and is stored securely in your account</li>
                    </ul>
                </section>

                <section className="bg-green-50 dark:bg-green-950/20 rounded-lg p-6 border border-green-200 dark:border-green-900">
                    <h2 className="font-headline text-2xl font-semibold mb-4 flex items-center gap-2">
                        <Lock className="h-6 w-6 text-green-600 dark:text-green-400" />
                        5. Data Storage and Security
                    </h2>
                    <p className="mb-4 text-base">
                        We implement industry-standard security measures to protect your data:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Encryption:</strong> Data is encrypted in transit (TLS) and at rest (AES-256)</li>
                        <li><strong>AWS Infrastructure:</strong> Hosted on AWS with enterprise-grade security</li>
                        <li><strong>Authentication:</strong> AWS Cognito with JWT tokens and secure session management</li>
                        <li><strong>Access Controls:</strong> Role-based access and principle of least privilege</li>
                        <li><strong>Monitoring:</strong> AWS CloudWatch for security monitoring and alerting</li>
                    </ul>
                </section>

                <section>
                    <h2 className="font-headline text-2xl font-semibold mb-4 flex items-center gap-2">
                        <Server className="h-6 w-6 text-primary" />
                        6. Data Sharing and Disclosure
                    </h2>
                    <p className="mb-4">We do not sell your personal data. We may share your information with:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Service Providers:</strong> AWS, payment processors, and analytics providers who assist in operating our platform</li>
                        <li><strong>Third-Party Integrations:</strong> Google Business Profile, Zillow (only with your explicit consent)</li>
                        <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                        <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                    </ul>
                </section>

                <section className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-6 border border-blue-200 dark:border-blue-900">
                    <h2 className="font-headline text-2xl font-semibold mb-4 flex items-center gap-2">
                        <UserCheck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        7. Your Rights and Choices
                    </h2>
                    <p className="mb-4 text-base">You have the right to:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Access:</strong> Request a copy of your personal data</li>
                        <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                        <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                        <li><strong>Export:</strong> Download your content and data</li>
                        <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications</li>
                        <li><strong>Restrict Processing:</strong> Limit how we use your data</li>
                    </ul>
                    <p className="mt-4 text-base">
                        To exercise these rights, contact us at <a href="mailto:contact@bayoncoagent.com" className="text-primary hover:underline font-medium">contact@bayoncoagent.com</a>
                    </p>
                </section>

                <section>
                    <h2 className="font-headline text-2xl font-semibold mb-4">8. Cookies and Tracking</h2>
                    <p className="mb-4">
                        We use cookies and similar technologies to enhance your experience. You can control cookies through your browser settings.
                    </p>
                </section>

                <section>
                    <h2 className="font-headline text-2xl font-semibold mb-4">9. Data Retention</h2>
                    <p>
                        We retain your data for as long as your account is active or as needed to provide services.
                        After account deletion, we may retain certain data for legal compliance, dispute resolution, and legitimate business purposes.
                    </p>
                </section>

                <section>
                    <h2 className="font-headline text-2xl font-semibold mb-4">10. Children's Privacy</h2>
                    <p>
                        Our platform is not intended for users under 18. We do not knowingly collect data from children.
                    </p>
                </section>

                <section>
                    <h2 className="font-headline text-2xl font-semibold mb-4">11. International Data Transfers</h2>
                    <p>
                        Your data may be transferred to and processed in countries other than your own.
                        We ensure appropriate safeguards are in place for international transfers.
                    </p>
                </section>

                <section>
                    <h2 className="font-headline text-2xl font-semibold mb-4">12. Changes to This Policy</h2>
                    <p>
                        We may update this privacy policy periodically. We will notify you of significant changes via email or platform notification.
                    </p>
                </section>

                <section className="bg-muted/30 rounded-lg p-6 border">
                    <h2 className="font-headline text-2xl font-semibold mb-4 flex items-center gap-2">
                        <Globe className="h-6 w-6 text-primary" />
                        13. Contact Us
                    </h2>
                    <p className="text-base mb-4">
                        If you have questions about this privacy policy or our data practices, we're here to help:
                    </p>
                    <div className="bg-background rounded-md p-4 border">
                        <p className="text-sm text-muted-foreground mb-2">Email us at:</p>
                        <a href="mailto:contact@bayoncoagent.com" className="text-lg font-semibold text-primary hover:underline">
                            contact@bayoncoagent.com
                        </a>
                    </div>
                </section>
            </div>
        </div>
    );
}
