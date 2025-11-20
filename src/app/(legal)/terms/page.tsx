import { Metadata } from "next";
import { FileText, Shield, CreditCard, AlertTriangle, Scale, Mail, Users, Gavel } from "lucide-react";

export const metadata: Metadata = {
    title: "Terms of Service | Bayon Coagent",
    description: "Terms of Service for Bayon Coagent - Legal agreement for using our platform",
};

export default function TermsOfServicePage() {
    return (
        <div className="container max-w-4xl py-12 px-4">
            <div className="mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
                    <FileText className="h-4 w-4" />
                    Legal Agreement
                </div>
                <h1 className="text-5xl font-bold mb-4 font-headline">Terms of Service</h1>
                <p className="text-lg text-muted-foreground">
                    Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </p>
            </div>

            <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
                <section className="bg-muted/30 rounded-lg p-6 border">
                    <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                        <FileText className="h-6 w-6 text-primary" />
                        1. Agreement to Terms
                    </h2>
                    <p className="text-base leading-relaxed">
                        By accessing or using Bayon Coagent ("Service," "Platform," "we," "our," or "us"), you agree to be bound by these
                        Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access the Service.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
                    <p className="mb-4">
                        Bayon Coagent is an AI-powered success platform for real estate agents that provides:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>AI content generation for marketing materials</li>
                        <li>Market research and competitor analysis</li>
                        <li>Brand identity management and strategy</li>
                        <li>Image editing and enhancement tools</li>
                        <li>Professional training and educational resources</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                        <Users className="h-6 w-6 text-primary" />
                        3. User Accounts
                    </h2>

                    <h3 className="text-xl font-semibold mb-3 mt-6">3.1 Account Creation</h3>
                    <p className="mb-4">To use our Service, you must:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Be at least 18 years old</li>
                        <li>Provide accurate, current, and complete information</li>
                        <li>Maintain the security of your account credentials</li>
                        <li>Be a licensed real estate professional or authorized to act on their behalf</li>
                    </ul>

                    <h3 className="text-xl font-semibold mb-3 mt-6">3.2 Account Responsibility</h3>
                    <p>
                        You are responsible for all activities that occur under your account. Notify us immediately of any unauthorized use.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                        <Shield className="h-6 w-6 text-primary" />
                        4. Acceptable Use
                    </h2>

                    <h3 className="text-xl font-semibold mb-3 mt-6">4.1 Permitted Use</h3>
                    <p className="mb-4">You may use the Service to:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Generate marketing content for your real estate business</li>
                        <li>Conduct market research and competitive analysis</li>
                        <li>Manage your professional brand and online presence</li>
                        <li>Access training materials and educational resources</li>
                    </ul>

                    <h3 className="text-xl font-semibold mb-3 mt-6">4.2 Prohibited Use</h3>
                    <p className="mb-4">You may NOT:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Violate any laws, regulations, or third-party rights</li>
                        <li>Share your account credentials with others</li>
                        <li>Use the Service for fraudulent or deceptive purposes</li>
                        <li>Generate content that is defamatory, discriminatory, or harassing</li>
                        <li>Attempt to reverse engineer, hack, or compromise the platform</li>
                        <li>Scrape, crawl, or extract data using automated means</li>
                        <li>Resell or redistribute our Service without authorization</li>
                        <li>Upload malicious code, viruses, or harmful content</li>
                        <li>Impersonate others or misrepresent your affiliation</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4">5. Intellectual Property</h2>

                    <h3 className="text-xl font-semibold mb-3 mt-6">5.1 Your Content</h3>
                    <p>
                        You retain ownership of all content you create using our platform. By using the Service, you grant us a limited license
                        to store, process, and display your content solely to provide the Service.
                    </p>

                    <h3 className="text-xl font-semibold mb-3 mt-6">5.2 Our Platform</h3>
                    <p>
                        The Service, including its design, features, code, and AI models, is owned by Bayon Coagent and protected by
                        intellectual property laws. You may not copy, modify, or create derivative works without our permission.
                    </p>

                    <h3 className="text-xl font-semibold mb-3 mt-6">5.3 AI-Generated Content</h3>
                    <p>
                        Content generated by our AI tools belongs to you. However, you are responsible for reviewing and ensuring
                        the accuracy, legality, and appropriateness of all AI-generated content before use.
                    </p>
                </section>

                <section className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-6 border border-blue-200 dark:border-blue-900">
                    <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                        <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        6. Payment and Subscription
                    </h2>

                    <h3 className="text-xl font-semibold mb-3 mt-6">6.1 Fees</h3>
                    <p>
                        Access to certain features requires a paid subscription. Fees are billed in advance on a recurring basis
                        (monthly or annually) and are non-refundable except as required by law.
                    </p>

                    <h3 className="text-xl font-semibold mb-3 mt-6">6.2 Automatic Renewal</h3>
                    <p>
                        Your subscription automatically renews unless you cancel before the renewal date. We will charge your payment
                        method on file for the renewal period.
                    </p>

                    <h3 className="text-xl font-semibold mb-3 mt-6">6.3 Price Changes</h3>
                    <p>
                        We may change our pricing with 30 days' notice. Continued use after the price change constitutes acceptance.
                    </p>

                    <h3 className="text-xl font-semibold mb-3 mt-6">6.4 Cancellation</h3>
                    <p>
                        You may cancel your subscription at any time. Cancellation takes effect at the end of your current billing period.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4">7. Third-Party Services</h2>
                    <p className="mb-4">
                        Our platform integrates with third-party services (Google Business Profile, Zillow, etc.). Your use of these
                        integrations is subject to their respective terms and privacy policies. We are not responsible for third-party services.
                    </p>
                </section>

                <section className="bg-yellow-50 dark:bg-yellow-950/20 rounded-lg p-6 border border-yellow-200 dark:border-yellow-900">
                    <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                        <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                        8. Disclaimers and Limitations
                    </h2>

                    <h3 className="text-xl font-semibold mb-3 mt-6">8.1 Service Availability</h3>
                    <p>
                        The Service is provided "as is" and "as available." We do not guarantee uninterrupted, error-free, or secure access.
                        We may modify, suspend, or discontinue features at any time.
                    </p>

                    <h3 className="text-xl font-semibold mb-3 mt-6">8.2 AI Accuracy</h3>
                    <p>
                        AI-generated content may contain errors, inaccuracies, or biases. You are responsible for reviewing and verifying
                        all content before use. We do not guarantee the accuracy or suitability of AI outputs.
                    </p>

                    <h3 className="text-xl font-semibold mb-3 mt-6">8.3 Professional Advice</h3>
                    <p>
                        Our Service does not provide legal, financial, or professional advice. Consult qualified professionals for
                        specific guidance related to your business.
                    </p>

                    <h3 className="text-xl font-semibold mb-3 mt-6">8.4 Limitation of Liability</h3>
                    <p>
                        To the maximum extent permitted by law, Bayon Coagent shall not be liable for any indirect, incidental, special,
                        consequential, or punitive damages, including lost profits, data loss, or business interruption.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                        <Gavel className="h-6 w-6 text-primary" />
                        9. Indemnification
                    </h2>
                    <p>
                        You agree to indemnify and hold harmless Bayon Coagent from any claims, damages, or expenses arising from your
                        use of the Service, violation of these Terms, or infringement of third-party rights.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4">10. Termination</h2>
                    <p className="mb-4">
                        We may suspend or terminate your account if you:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Violate these Terms</li>
                        <li>Engage in fraudulent or illegal activity</li>
                        <li>Fail to pay subscription fees</li>
                        <li>Pose a security risk to the platform</li>
                    </ul>
                    <p className="mt-4">
                        Upon termination, your right to use the Service ceases immediately. We may delete your data after a reasonable period.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4">11. Data and Privacy</h2>
                    <p>
                        Your use of the Service is also governed by our Privacy Policy. By using the Service, you consent to our
                        data practices as described in the Privacy Policy.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                        <Scale className="h-6 w-6 text-primary" />
                        12. Dispute Resolution
                    </h2>

                    <h3 className="text-xl font-semibold mb-3 mt-6">12.1 Governing Law</h3>
                    <p>
                        These Terms are governed by the laws of [Your Jurisdiction], without regard to conflict of law principles.
                    </p>

                    <h3 className="text-xl font-semibold mb-3 mt-6">12.2 Arbitration</h3>
                    <p>
                        Any disputes arising from these Terms or the Service shall be resolved through binding arbitration, except where
                        prohibited by law. You waive your right to a jury trial or class action.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4">13. Changes to Terms</h2>
                    <p>
                        We may update these Terms periodically. We will notify you of material changes via email or platform notification.
                        Continued use after changes constitutes acceptance of the new Terms.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4">14. Miscellaneous</h2>
                    <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Entire Agreement:</strong> These Terms constitute the entire agreement between you and Bayon Coagent</li>
                        <li><strong>Severability:</strong> If any provision is found invalid, the remaining provisions remain in effect</li>
                        <li><strong>Waiver:</strong> Failure to enforce any right does not waive that right</li>
                        <li><strong>Assignment:</strong> You may not assign these Terms without our consent</li>
                    </ul>
                </section>

                <section className="bg-muted/30 rounded-lg p-6 border">
                    <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                        <Mail className="h-6 w-6 text-primary" />
                        15. Contact Information
                    </h2>
                    <p className="text-base mb-4">
                        For questions about these Terms, we're here to help:
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
