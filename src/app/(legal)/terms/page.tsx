import { Metadata } from "next";
import Link from "next/link";
import { FileText, Shield, CreditCard, AlertTriangle, Scale, Mail, Users, Gavel, ArrowLeft, Eye } from "lucide-react";
import { SubtleGradientMesh } from "@/components/ui/gradient-mesh";

export const metadata: Metadata = {
    title: "Terms of Service | Bayon Coagent",
    description: "Terms of Service for Bayon Coagent - Legal agreement for using our platform",
};

export default function TermsOfServicePage() {
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
                            <FileText className="h-4 w-4" />
                            Legal Agreement
                        </div>
                        <h1 className="text-6xl font-bold mb-6 font-headline text-gradient-primary">Terms of Service</h1>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-4">
                            The legal stuff, explained in plain English. Read this before using our platform.
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
                                "Agreement to Terms", "Description of Service", "User Accounts",
                                "Acceptable Use", "Intellectual Property", "Payment and Subscription",
                                "Disclaimers and Limitations", "Contact Information"
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
                                    <FileText className="h-6 w-6 text-primary" />
                                </div>
                                Agreement to Terms
                            </h2>
                            <p className="text-base leading-relaxed text-foreground/90">
                                By using Bayon Coagent, you're agreeing to these terms. We know legal documents can be boring, but this one's important.
                                If something doesn't make sense or you disagree with these terms, please don't use our platform—and let us know what concerns you.
                            </p>
                        </section>

                        <section id="section-2" className="scroll-mt-24">
                            <h2 className="font-headline text-3xl font-semibold mb-6">Description of Service</h2>
                            <div className="p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50">
                                <p className="mb-4 text-base">Bayon Coagent is your AI-powered workspace that provides:</p>
                                <ul className="grid md:grid-cols-2 gap-3">
                                    {[
                                        "AI content generation and assistance",
                                        "Data visualization and dashboards",
                                        "Document management and collaboration",
                                        "Strategic insights and analytics",
                                        "Intelligent monitoring and tracking",
                                        "Conversational AI assistance"
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <Shield className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                                            <span className="text-sm">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>

                        <section id="section-3" className="scroll-mt-24">
                            <h2 className="font-headline text-3xl font-semibold mb-6 flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-primary/10">
                                    <Users className="h-6 w-6 text-primary" />
                                </div>
                                User Accounts
                            </h2>

                            <div className="space-y-6">
                                <div className="p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50">
                                    <h3 className="font-headline text-xl font-semibold mb-4">Account Creation</h3>
                                    <p className="mb-4">To use our Service, you must:</p>
                                    <ul className="space-y-2">
                                        {[
                                            "Be at least 18 years old",
                                            "Provide accurate, current, and complete information",
                                            "Maintain the security of your account credentials",
                                            "Be authorized to use the platform for your business"
                                        ].map((item, i) => (
                                            <li key={i} className="flex items-start gap-3">
                                                <span className="text-primary mt-1">•</span>
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50">
                                    <h3 className="font-headline text-xl font-semibold mb-4">Account Responsibility</h3>
                                    <p className="text-base">
                                        You are responsible for all activities that occur under your account. Notify us immediately of any unauthorized use.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section id="section-4" className="scroll-mt-24">
                            <h2 className="font-headline text-3xl font-semibold mb-6 flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-primary/10">
                                    <Shield className="h-6 w-6 text-primary" />
                                </div>
                                Acceptable Use
                            </h2>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                                    <h3 className="font-headline text-lg font-semibold mb-4 text-green-700 dark:text-green-400 flex items-center gap-2">
                                        <Shield className="h-5 w-5" />
                                        Permitted Use
                                    </h3>
                                    <ul className="space-y-2 text-sm">
                                        {[
                                            "Generate content for your business",
                                            "Conduct research and analysis",
                                            "Manage your professional brand",
                                            "Access learning and resources"
                                        ].map((item, i) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <span className="text-green-600 dark:text-green-400">✓</span>
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="p-6 rounded-xl bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20">
                                    <h3 className="font-headline text-lg font-semibold mb-4 text-red-700 dark:text-red-400 flex items-center gap-2">
                                        <AlertTriangle className="h-5 w-5" />
                                        Prohibited Use
                                    </h3>
                                    <ul className="space-y-2 text-sm">
                                        {[
                                            "Violate laws or third-party rights",
                                            "Share account credentials",
                                            "Use for fraudulent purposes",
                                            "Upload malicious content",
                                            "Reverse engineer the platform",
                                            "Resell without authorization"
                                        ].map((item, i) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <span className="text-red-600 dark:text-red-400">✗</span>
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </section>

                        <section id="section-5" className="scroll-mt-24">
                            <h2 className="font-headline text-3xl font-semibold mb-6">Intellectual Property</h2>

                            <div className="space-y-6">
                                {[
                                    {
                                        title: "Your Content",
                                        desc: "You retain ownership of all content you create using our platform. By using the Service, you grant us a limited license to store, process, and display your content solely to provide the Service."
                                    },
                                    {
                                        title: "Our Platform",
                                        desc: "The Service, including its design, features, code, and AI models, is owned by Bayon Coagent and protected by intellectual property laws. You may not copy, modify, or create derivative works without our permission."
                                    },
                                    {
                                        title: "AI-Generated Content",
                                        desc: "Content generated by our AI tools belongs to you. However, you are responsible for reviewing and ensuring the accuracy, legality, and appropriateness of all AI-generated content before use."
                                    }
                                ].map((item, i) => (
                                    <div key={i} className="p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50">
                                        <h3 className="font-headline text-xl font-semibold mb-3">{item.title}</h3>
                                        <p className="text-base text-muted-foreground">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section id="section-6" className="scroll-mt-24 p-8 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 shadow-sm">
                            <h2 className="font-headline text-3xl font-semibold mb-6 flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-blue-500/10">
                                    <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                Payment and Subscription
                            </h2>

                            <div className="space-y-6">
                                {[
                                    {
                                        title: "Fees",
                                        desc: "Access to certain features requires a paid subscription. Fees are billed in advance on a recurring basis (monthly or annually) and are non-refundable except as required by law."
                                    },
                                    {
                                        title: "Automatic Renewal",
                                        desc: "Your subscription automatically renews unless you cancel before the renewal date. We will charge your payment method on file for the renewal period."
                                    },
                                    {
                                        title: "Price Changes",
                                        desc: "We may change our pricing with 30 days' notice. Continued use after the price change constitutes acceptance."
                                    },
                                    {
                                        title: "Cancellation",
                                        desc: "You may cancel your subscription at any time. Cancellation takes effect at the end of your current billing period."
                                    }
                                ].map((item, i) => (
                                    <div key={i} className="p-5 rounded-lg bg-background/50 border border-blue-500/10">
                                        <h3 className="font-headline text-lg font-semibold mb-2 text-blue-600 dark:text-blue-400">{item.title}</h3>
                                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section id="section-7" className="scroll-mt-24 p-8 rounded-2xl bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/20 shadow-sm">
                            <h2 className="font-headline text-3xl font-semibold mb-6 flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-yellow-500/10">
                                    <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                                </div>
                                Disclaimers and Limitations
                            </h2>

                            <div className="space-y-6">
                                {[
                                    {
                                        title: "Service Availability",
                                        desc: "The Service is provided \"as is\" and \"as available.\" We do not guarantee uninterrupted, error-free, or secure access. We may modify, suspend, or discontinue features at any time."
                                    },
                                    {
                                        title: "AI Accuracy",
                                        desc: "AI-generated content may contain errors, inaccuracies, or biases. You are responsible for reviewing and verifying all content before use. We do not guarantee the accuracy or suitability of AI outputs."
                                    },
                                    {
                                        title: "Professional Advice",
                                        desc: "Our Service does not provide legal, financial, or professional advice. Consult qualified professionals for specific guidance related to your business."
                                    },
                                    {
                                        title: "Limitation of Liability",
                                        desc: "To the maximum extent permitted by law, Bayon Coagent shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including lost profits, data loss, or business interruption."
                                    }
                                ].map((item, i) => (
                                    <div key={i} className="p-5 rounded-lg bg-background/50 border border-yellow-500/10">
                                        <h3 className="font-headline text-lg font-semibold mb-2 text-yellow-700 dark:text-yellow-400">{item.title}</h3>
                                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section id="section-8" className="scroll-mt-24 p-8 rounded-2xl bg-gradient-to-br from-primary/5 to-accent-start/5 border border-primary/10 shadow-sm">
                            <h2 className="font-headline text-3xl font-semibold mb-6 flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-primary/10">
                                    <Mail className="h-6 w-6 text-primary" />
                                </div>
                                Contact Information
                            </h2>
                            <p className="text-base mb-6 leading-relaxed">
                                Questions about these terms? Want to suggest changes? We're listening:
                            </p>
                            <div className="p-6 rounded-xl bg-background/80 backdrop-blur-sm border border-border shadow-md">
                                <p className="text-sm text-muted-foreground mb-3">Email us at:</p>
                                <a href="mailto:contact@bayoncoagent.com" className="text-2xl font-bold text-primary hover:underline inline-flex items-center gap-2">
                                    contact@bayoncoagent.com
                                </a>
                            </div>
                        </section>

                        {/* Additional Important Sections */}
                        <div className="grid md:grid-cols-2 gap-6 mt-8">
                            <div className="p-6 rounded-xl bg-card/30 backdrop-blur-sm border border-border/50">
                                <h3 className="font-headline text-lg font-semibold mb-3 flex items-center gap-2">
                                    <Gavel className="h-5 w-5 text-primary" />
                                    Dispute Resolution
                                </h3>
                                <p className="text-sm text-muted-foreground mb-2">
                                    These Terms are governed by applicable laws. Any disputes shall be resolved through binding arbitration, except where prohibited by law.
                                </p>
                            </div>

                            <div className="p-6 rounded-xl bg-card/30 backdrop-blur-sm border border-border/50">
                                <h3 className="font-headline text-lg font-semibold mb-3 flex items-center gap-2">
                                    <Scale className="h-5 w-5 text-primary" />
                                    Changes to Terms
                                </h3>
                                <p className="text-sm text-muted-foreground mb-2">
                                    We may update these Terms periodically. We will notify you of material changes via email or platform notification.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </SubtleGradientMesh>
        </div>
    );
}
