import { Metadata } from "next";
import Link from "next/link";
import { Shield, Lock, Eye, Database, Globe, UserCheck, Brain, Server, ArrowLeft, FileText } from "lucide-react";
import { SubtleGradientMesh } from "@/components/ui/gradient-mesh";

export const metadata: Metadata = {
    title: "Privacy Policy | Bayon Coagent",
    description: "Privacy Policy for Bayon Coagent - How we collect, use, and protect your data",
};

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen relative">
            <SubtleGradientMesh>
                {/* Header */}
                <div className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
                    <div className="container max-w-6xl py-4 px-4">
                        <div className="flex items-center justify-between">
                            <Link
                                href="/login"
                                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                            >
                                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                                Back to Login
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="container max-w-4xl py-16 px-4 mx-auto">
                    {/* Hero Section */}
                    <div className="mb-16 text-center mx-auto">
                        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-8 shadow-sm">
                            <Shield className="h-4 w-4" />
                            Your Privacy Matters
                        </div>
                        <h1 className="text-6xl font-bold mb-6 font-headline text-gradient-primary">Privacy Policy</h1>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-4">
                            Your trust is everything. Here's exactly how we protect your data and respect your privacy.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                        </p>
                    </div>

                    {/* Table of Contents */}
                    <div className="mb-12 p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 shadow-lg">
                        <h2 className="font-headline text-xl font-semibold mb-4">Quick Navigation</h2>
                        <div className="grid md:grid-cols-2 gap-3 text-sm">
                            {[
                                "Introduction", "Information We Collect", "How We Use Your Information",
                                "AI and Data Processing", "Data Storage and Security", "Data Sharing and Disclosure",
                                "Your Rights and Choices", "Contact Us"
                            ].map((item, index) => (
                                <a
                                    key={index}
                                    href={`#section-${index + 1}`}
                                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors py-1"
                                >
                                    <span className="text-xs text-primary/60">{index + 1}.</span>
                                    {item}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Content Sections */}
                    <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
                        <section id="section-1" className="scroll-mt-24 p-8 rounded-2xl bg-gradient-to-br from-primary/5 to-accent-start/5 border border-primary/10 shadow-sm">
                            <h2 className="font-headline text-3xl font-semibold mb-6 flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-primary/10">
                                    <Eye className="h-6 w-6 text-primary" />
                                </div>
                                Introduction
                            </h2>
                            <p className="text-base leading-relaxed text-foreground/90">
                                Welcome to Bayon Coagent. We built this platform to help you work smarter with AI—not to collect unnecessary data.
                                This policy explains exactly what information we collect, why we need it, and how we protect it. We believe privacy
                                should be simple and transparent, so we've written this in plain language.
                            </p>
                        </section>

                        <section id="section-2" className="scroll-mt-24">
                            <h2 className="font-headline text-3xl font-semibold mb-6 flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-primary/10">
                                    <Database className="h-6 w-6 text-primary" />
                                </div>
                                Information We Collect
                            </h2>

                            <div className="space-y-6">
                                <div className="p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50">
                                    <h3 className="font-headline text-xl font-semibold mb-4">Information You Provide</h3>
                                    <ul className="list-none space-y-3">
                                        <li className="flex items-start gap-3">
                                            <span className="text-primary mt-1">•</span>
                                            <div><strong>Account Information:</strong> Name, email address, phone number, and professional details</div>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <span className="text-primary mt-1">•</span>
                                            <div><strong>Profile Data:</strong> Professional bio, specializations, and business information</div>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <span className="text-primary mt-1">•</span>
                                            <div><strong>Content:</strong> Documents, materials, and content you create or upload</div>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <span className="text-primary mt-1">•</span>
                                            <div><strong>Payment Information:</strong> Billing details processed securely through our payment processor</div>
                                        </li>
                                    </ul>
                                </div>

                                <div className="p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50">
                                    <h3 className="font-headline text-xl font-semibold mb-4">Automatically Collected Information</h3>
                                    <ul className="list-none space-y-3">
                                        <li className="flex items-start gap-3">
                                            <span className="text-primary mt-1">•</span>
                                            <div><strong>Usage Data:</strong> Features used, content generated, time spent, and interaction patterns</div>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <span className="text-primary mt-1">•</span>
                                            <div><strong>Device Information:</strong> Browser type, operating system, IP address, and device identifiers</div>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <span className="text-primary mt-1">•</span>
                                            <div><strong>Log Data:</strong> Access times, pages viewed, and system activity</div>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        <section id="section-3" className="scroll-mt-24">
                            <h2 className="font-headline text-3xl font-semibold mb-6">How We Use Your Information</h2>
                            <div className="p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50">
                                <p className="mb-4 text-base">We use your information to:</p>
                                <ul className="grid md:grid-cols-2 gap-3">
                                    {[
                                        "Provide and improve our AI-powered platform",
                                        "Generate personalized content and insights",
                                        "Process your transactions and manage your account",
                                        "Send you service updates and support messages",
                                        "Respond to your requests and provide support",
                                        "Analyze usage patterns to enhance experience",
                                        "Comply with legal obligations",
                                        "Ensure platform security and prevent fraud"
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <Shield className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                                            <span className="text-sm">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>

                        <section id="section-4" className="scroll-mt-24 p-8 rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 shadow-sm">
                            <h2 className="font-headline text-3xl font-semibold mb-6 flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-purple-500/10">
                                    <Brain className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                AI and Data Processing
                            </h2>
                            <p className="mb-4 text-base leading-relaxed">
                                We use Google's Gemini AI to power our intelligent features. Here's what happens with your data:
                            </p>
                            <ul className="space-y-3">
                                {[
                                    "Your prompts and generated content are processed by Google's AI services",
                                    "Google does not use your data to train their models",
                                    "All AI processing occurs within secure cloud infrastructure",
                                    "Generated content belongs to you and is stored securely in your account"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                                        <span className="text-base">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <section id="section-5" className="scroll-mt-24 p-8 rounded-2xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 shadow-sm">
                            <h2 className="font-headline text-3xl font-semibold mb-6 flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-green-500/10">
                                    <Lock className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                                Data Storage and Security
                            </h2>
                            <p className="mb-6 text-base leading-relaxed">
                                Security isn't just a checkbox for us—it's fundamental to everything we build. Here's how we protect your information:
                            </p>
                            <div className="grid md:grid-cols-2 gap-4">
                                {[
                                    { label: "Encryption", desc: "Data encrypted in transit (TLS) and at rest (AES-256)" },
                                    { label: "Cloud Infrastructure", desc: "Hosted on enterprise-grade cloud services" },
                                    { label: "Authentication", desc: "Secure session management with JWT tokens" },
                                    { label: "Access Controls", desc: "Role-based access and least privilege" },
                                ].map((item, i) => (
                                    <div key={i} className="p-4 rounded-lg bg-background/50 border border-green-500/10">
                                        <strong className="text-green-600 dark:text-green-400">{item.label}:</strong>
                                        <p className="text-sm mt-1 text-muted-foreground">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section id="section-6" className="scroll-mt-24">
                            <h2 className="font-headline text-3xl font-semibold mb-6 flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-primary/10">
                                    <Server className="h-6 w-6 text-primary" />
                                </div>
                                Data Sharing and Disclosure
                            </h2>
                            <div className="p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50">
                                <p className="mb-4 font-semibold text-lg">Let's be clear: We will never sell your data. Period.</p>
                                <p className="mb-4">We only share your information when absolutely necessary:</p>
                                <ul className="space-y-3">
                                    {[
                                        { label: "Service Providers", desc: "Cloud services, payment processors, and analytics providers" },
                                        { label: "Third-Party Integrations", desc: "Only with your explicit consent" },
                                        { label: "Legal Requirements", desc: "When required by law or to protect our rights" },
                                        { label: "Business Transfers", desc: "In connection with a merger, acquisition, or sale of assets" }
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <span className="text-primary mt-1">•</span>
                                            <div>
                                                <strong>{item.label}:</strong> {item.desc}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>

                        <section id="section-7" className="scroll-mt-24 p-8 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 shadow-sm">
                            <h2 className="font-headline text-3xl font-semibold mb-6 flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-blue-500/10">
                                    <UserCheck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                Your Rights and Choices
                            </h2>
                            <p className="mb-6 text-base">Your data is yours. Here's what you can do with it:</p>
                            <div className="grid md:grid-cols-2 gap-4">
                                {[
                                    { label: "Access", desc: "Request a copy of your personal data" },
                                    { label: "Correction", desc: "Update or correct inaccurate information" },
                                    { label: "Deletion", desc: "Request deletion of your account and data" },
                                    { label: "Export", desc: "Download your content and data" },
                                    { label: "Opt-Out", desc: "Unsubscribe from marketing communications" },
                                    { label: "Restrict Processing", desc: "Limit how we use your data" },
                                ].map((item, i) => (
                                    <div key={i} className="p-4 rounded-lg bg-background/50 border border-blue-500/10">
                                        <div className="flex items-center gap-2 mb-2">
                                            <UserCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                            <strong className="text-blue-600 dark:text-blue-400">{item.label}</strong>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-6 p-4 rounded-lg bg-background/50 border border-blue-500/10">
                                <p className="text-base">
                                    To exercise these rights, contact us at{" "}
                                    <a href="mailto:contact@bayoncoagent.com" className="text-primary hover:underline font-semibold">
                                        contact@bayoncoagent.com
                                    </a>
                                </p>
                            </div>
                        </section>

                        <section id="section-8" className="scroll-mt-24 p-8 rounded-2xl bg-gradient-to-br from-primary/5 to-accent-start/5 border border-primary/10 shadow-sm">
                            <h2 className="font-headline text-3xl font-semibold mb-6 flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-primary/10">
                                    <Globe className="h-6 w-6 text-primary" />
                                </div>
                                Contact Us
                            </h2>
                            <p className="text-base mb-6 leading-relaxed">
                                Questions? Concerns? We're real people who care about your privacy. Reach out anytime:
                            </p>
                            <div className="p-6 rounded-xl bg-background/80 backdrop-blur-sm border border-border shadow-md">
                                <p className="text-sm text-muted-foreground mb-3">Email us at:</p>
                                <a href="mailto:contact@bayoncoagent.com" className="text-2xl font-bold text-primary hover:underline inline-flex items-center gap-2">
                                    contact@bayoncoagent.com
                                </a>
                            </div>
                        </section>
                    </div>

                </div>
            </SubtleGradientMesh>
        </div>
    );
}
