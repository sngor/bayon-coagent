'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, MessageCircle, Book, Video, Search } from "lucide-react";
import Link from "next/link";

export default function SupportPage() {
    return (
        <div className="space-y-6">
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
                <div className="relative">

                    {/* Search Bar */}
                    <div className="max-w-2xl mx-auto relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                        <Input
                            type="search"
                            placeholder="Search for help..."
                            className="pl-10 h-12 text-base"
                        />
                    </div>
                </div>

                {/* Quick Help Cards */}
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <Book className="h-8 w-8 mb-2 text-primary" />
                            <CardTitle>Documentation</CardTitle>
                            <CardDescription>Comprehensive guides and tutorials</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Link href="/training-hub">
                                <Button variant="outline" className="w-full">View Guides</Button>
                            </Link>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <Video className="h-8 w-8 mb-2 text-primary" />
                            <CardTitle>Video Tutorials</CardTitle>
                            <CardDescription>Step-by-step video walkthroughs</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Link href="/training-hub">
                                <Button variant="outline" className="w-full">Watch Videos</Button>
                            </Link>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <MessageCircle className="h-8 w-8 mb-2 text-primary" />
                            <CardTitle>Contact Support</CardTitle>
                            <CardDescription>Get help from our team</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <a href="mailto:support@bayoncoagent.com" className="block">
                                <Button variant="outline" className="w-full">
                                    <Mail className="h-4 w-4 mr-2" />
                                    Email Us
                                </Button>
                            </a>
                        </CardContent>
                    </Card>
                </div>

                {/* FAQ Sections */}
                <div className="space-y-8">
                    <h2 className="text-3xl font-bold">Frequently Asked Questions</h2>

                    {/* Getting Started */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Getting Started</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="item-1">
                                    <AccordionTrigger>How do I set up my profile?</AccordionTrigger>
                                    <AccordionContent>
                                        After signing up, navigate to your <Link href="/brand/profile" className="text-primary hover:underline">Profile page</Link> from the dashboard. Fill in your professional information including name, brokerage, contact details, and service areas. This information powers your AI-generated content and helps with SEO optimization. Make sure to complete all required fields for the best results.
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="item-2">
                                    <AccordionTrigger>What is the Marketing Plan and how do I use it?</AccordionTrigger>
                                    <AccordionContent>
                                        The <Link href="/brand/strategy" className="text-primary hover:underline">AI Marketing Plan</Link> is a personalized 3-step strategy based on your <Link href="/brand/audit" className="text-primary hover:underline">brand audit</Link> and <Link href="/brand/competitors" className="text-primary hover:underline">competitive analysis</Link>. To generate your plan, complete your profile, run a brand audit, and add competitors. The AI will analyze your market position and create actionable steps to improve your online presence and authority.
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="item-3">
                                    <AccordionTrigger>How long does it take to see results?</AccordionTrigger>
                                    <AccordionContent>
                                        Most agents see initial improvements in their content quality immediately. For SEO and ranking improvements, expect to see results within 3-6 months of consistent content creation and implementation of your marketing plan. The key is consistency and following the AI-generated recommendations.
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                    </Card>

                    {/* Content Creation */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Content Creation</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="item-1">
                                    <AccordionTrigger>What types of content can I create?</AccordionTrigger>
                                    <AccordionContent>
                                        The <Link href="/studio/write" className="text-primary hover:underline">Studio</Link> helps you create: neighborhood guides, social media posts, listing descriptions, market updates, video scripts, blog posts, and email campaigns. Each content type is optimized for its specific platform and purpose, with SEO best practices built in.
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="item-2">
                                    <AccordionTrigger>Can I edit AI-generated content?</AccordionTrigger>
                                    <AccordionContent>
                                        Yes! All AI-generated content is fully editable. We recommend reviewing and personalizing the content to match your unique voice and add specific local insights. The AI provides a strong foundation, but your personal touch makes it authentic.
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="item-3">
                                    <AccordionTrigger>How do I save and organize my content?</AccordionTrigger>
                                    <AccordionContent>
                                        All generated content is automatically saved to your <Link href="/library/content" className="text-primary hover:underline">Content Library</Link>. You can organize content by type, date, or custom tags. Use the search function to quickly find specific pieces, and export content in various formats for easy publishing.
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="item-4">
                                    <AccordionTrigger>What makes the AI content unique and not generic?</AccordionTrigger>
                                    <AccordionContent>
                                        Our AI uses your <Link href="/brand/profile" className="text-primary hover:underline">profile information</Link>, local market data, and real-time research to create personalized content. It incorporates your service areas, expertise, and brand voice. The <Link href="/market/research" className="text-primary hover:underline">Research Agent</Link> can also pull in current market trends and neighborhood-specific information to ensure content is relevant and unique.
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                    </Card>

                    {/* Brand Audit & Competitors */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Brand Audit & Competitive Analysis</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="item-1">
                                    <AccordionTrigger>What is a Brand Audit?</AccordionTrigger>
                                    <AccordionContent>
                                        A <Link href="/brand/audit" className="text-primary hover:underline">Brand Audit</Link> checks your NAP (Name, Address, Phone) consistency across the web, imports your Zillow reviews, and analyzes your online presence. It identifies areas for improvement and helps ensure your business information is accurate everywhere, which is crucial for local SEO.
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="item-2">
                                    <AccordionTrigger>How do I add competitors?</AccordionTrigger>
                                    <AccordionContent>
                                        Go to the <Link href="/brand/competitors" className="text-primary hover:underline">Competitive Analysis</Link> page and click "Add Competitor." Enter their name and location, and our AI will discover their online presence, analyze their content strategy, and track their keyword rankings. You can add up to 10 competitors to monitor.
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="item-3">
                                    <AccordionTrigger>How often should I run a brand audit?</AccordionTrigger>
                                    <AccordionContent>
                                        We recommend running a brand audit monthly to track improvements and catch any new inconsistencies. Your online presence changes over time as you publish content and get reviews, so regular audits help you stay on top of your digital footprint.
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="item-4">
                                    <AccordionTrigger>What do the keyword rankings mean?</AccordionTrigger>
                                    <AccordionContent>
                                        Keyword rankings show where you and your competitors appear in Google search results for important real estate terms in your market. Higher rankings (closer to 1) mean more visibility. Track these over time to measure the impact of your content strategy.
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                    </Card>

                    {/* AI Research Agent */}
                    <Card>
                        <CardHeader>
                            <CardTitle>AI Research Agent</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="item-1">
                                    <AccordionTrigger>What is the AI Research Agent?</AccordionTrigger>
                                    <AccordionContent>
                                        The <Link href="/market/research" className="text-primary hover:underline">AI Research Agent</Link> conducts deep-dive research on any real estate topic you specify. It searches the web, analyzes multiple sources, and creates comprehensive reports with citations. Use it to research neighborhoods, market trends, investment strategies, or any topic relevant to your business.
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="item-2">
                                    <AccordionTrigger>How long does research take?</AccordionTrigger>
                                    <AccordionContent>
                                        Most research reports take 2-5 minutes to complete, depending on the complexity of the topic. The agent performs multiple search queries, analyzes sources, and synthesizes information into a structured report. You'll see progress updates as it works.
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="item-3">
                                    <AccordionTrigger>Can I use research reports in my content?</AccordionTrigger>
                                    <AccordionContent>
                                        Absolutely! Research reports are saved to your <Link href="/knowledge-base" className="text-primary hover:underline">Knowledge Base</Link> and can be referenced when creating content. The insights and data from research reports help you create more authoritative, data-driven content that establishes you as a local expert.
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                    </Card>

                    {/* Integrations */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Integrations</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="item-1">
                                    <AccordionTrigger>How do I connect my Google Business Profile?</AccordionTrigger>
                                    <AccordionContent>
                                        Go to <Link href="/settings" className="text-primary hover:underline">Settings → Integrations</Link> and click "Connect Google Business Profile." You'll be redirected to Google to authorize access. Once connected, we'll automatically import your reviews and business information. This helps with brand audits and content personalization.
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="item-2">
                                    <AccordionTrigger>Why can't I see my Zillow reviews?</AccordionTrigger>
                                    <AccordionContent>
                                        Make sure you've entered your correct Zillow profile URL in your <Link href="/brand/profile" className="text-primary hover:underline">profile settings</Link>. The URL should be in the format: zillow.com/profile/[your-name]. If you've recently updated it, run a new <Link href="/brand/audit" className="text-primary hover:underline">brand audit</Link> to import the latest reviews. Note that Zillow must have your reviews publicly visible.
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="item-3">
                                    <AccordionTrigger>What other integrations are planned?</AccordionTrigger>
                                    <AccordionContent>
                                        We're actively working on integrations with social media platforms (Facebook, Instagram, LinkedIn), CRM systems, and MLS platforms. These will allow you to publish content directly and sync your listings automatically. Join our newsletter to stay updated on new features.
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                    </Card>

                    {/* Security & Privacy */}
                    <Card className="border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span className="text-green-600 dark:text-green-400">🔒</span>
                                Security & Privacy
                            </CardTitle>
                            <CardDescription>
                                Your data security and privacy are our top priorities
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="item-1">
                                    <AccordionTrigger>How is my data protected?</AccordionTrigger>
                                    <AccordionContent>
                                        <div className="space-y-3">
                                            <p>We implement multiple layers of security to protect your data:</p>
                                            <ul className="list-disc pl-6 space-y-2 text-sm">
                                                <li><strong>Encryption:</strong> All data is encrypted at rest using AES-256 encryption and in transit using TLS 1.3</li>
                                                <li><strong>AWS Infrastructure:</strong> Hosted on AWS with enterprise-grade security, compliance certifications, and 24/7 monitoring</li>
                                                <li><strong>Authentication:</strong> Secure authentication via AWS Cognito with JWT tokens and session management</li>
                                                <li><strong>Access Controls:</strong> Role-based access and principle of least privilege</li>
                                                <li><strong>Monitoring:</strong> Real-time security monitoring and alerting via AWS CloudWatch</li>
                                            </ul>
                                            <p className="text-sm">
                                                View your <Link href="/settings" className="text-primary hover:underline">security status</Link> in Settings.
                                            </p>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="item-2">
                                    <AccordionTrigger>What happens to my data when I use AI features?</AccordionTrigger>
                                    <AccordionContent>
                                        <div className="space-y-3">
                                            <p>We're completely transparent about AI data processing:</p>
                                            <ul className="list-disc pl-6 space-y-2 text-sm">
                                                <li><strong>AI Provider:</strong> We use AWS Bedrock with Claude 3.5 Sonnet for content generation</li>
                                                <li><strong>No Training:</strong> AWS does not use your data to train their AI models</li>
                                                <li><strong>Secure Processing:</strong> All AI processing occurs within our secure AWS infrastructure</li>
                                                <li><strong>Your Ownership:</strong> You own all content generated by the AI</li>
                                                <li><strong>Data Retention:</strong> AI prompts and outputs are stored securely in your account only</li>
                                            </ul>
                                            <p className="text-sm">
                                                See your <Link href="/settings?tab=activity" className="text-primary hover:underline">AI activity history</Link> in Settings.
                                            </p>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="item-3">
                                    <AccordionTrigger>Do you sell or share my data?</AccordionTrigger>
                                    <AccordionContent>
                                        <div className="space-y-3">
                                            <p className="font-semibold text-green-600 dark:text-green-400">No. We never sell your data.</p>
                                            <p>Your data is yours. We only share information in these limited cases:</p>
                                            <ul className="list-disc pl-6 space-y-2 text-sm">
                                                <li><strong>Service Providers:</strong> AWS, payment processors, and analytics providers who help operate the platform (under strict data protection agreements)</li>
                                                <li><strong>Your Integrations:</strong> Only when you explicitly connect services like Google Business Profile</li>
                                                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                                            </ul>
                                            <p className="text-sm">
                                                Read our full <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link> for details.
                                            </p>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="item-4">
                                    <AccordionTrigger>Can I see what data you have about me?</AccordionTrigger>
                                    <AccordionContent>
                                        <div className="space-y-3">
                                            <p>Absolutely. You have full transparency and control over your data:</p>
                                            <ul className="list-disc pl-6 space-y-2 text-sm">
                                                <li><strong>Access:</strong> View all your data in your profile and settings</li>
                                                <li><strong>Activity Log:</strong> See your <Link href="/settings?tab=activity" className="text-primary hover:underline">login history and content generation activity</Link></li>
                                                <li><strong>Export:</strong> Download all your data at any time</li>
                                                <li><strong>Correction:</strong> Update or correct any information</li>
                                                <li><strong>Deletion:</strong> Request complete account and data deletion</li>
                                            </ul>
                                            <p className="text-sm">
                                                Contact <a href="mailto:contact@bayoncoagent.com" className="text-primary hover:underline">contact@bayoncoagent.com</a> to exercise your data rights.
                                            </p>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="item-5">
                                    <AccordionTrigger>How do you handle login security?</AccordionTrigger>
                                    <AccordionContent>
                                        <div className="space-y-3">
                                            <p>We use industry-standard authentication practices:</p>
                                            <ul className="list-disc pl-6 space-y-2 text-sm">
                                                <li><strong>Secure Authentication:</strong> AWS Cognito handles all authentication with secure password hashing</li>
                                                <li><strong>Password Requirements:</strong> Minimum 8 characters with uppercase, lowercase, and numbers</li>
                                                <li><strong>Session Management:</strong> Secure JWT tokens with automatic expiration</li>
                                                <li><strong>Login Monitoring:</strong> Track all login attempts and active sessions</li>
                                                <li><strong>Device Management:</strong> View and manage all logged-in devices</li>
                                            </ul>
                                            <p className="text-sm">
                                                Monitor your <Link href="/settings?tab=activity" className="text-primary hover:underline">login history</Link> and sign out suspicious sessions.
                                            </p>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="item-6">
                                    <AccordionTrigger>What if I suspect unauthorized access?</AccordionTrigger>
                                    <AccordionContent>
                                        <div className="space-y-3">
                                            <p>If you notice suspicious activity, take these steps immediately:</p>
                                            <ol className="list-decimal pl-6 space-y-2 text-sm">
                                                <li>Change your password in <Link href="/settings" className="text-primary hover:underline">Settings → Security</Link></li>
                                                <li>Review your <Link href="/settings?tab=activity" className="text-primary hover:underline">login history</Link> for unfamiliar devices or locations</li>
                                                <li>Sign out all devices except your current session</li>
                                                <li>Contact support immediately at <a href="mailto:contact@bayoncoagent.com" className="text-primary hover:underline">contact@bayoncoagent.com</a></li>
                                            </ol>
                                            <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                                                We monitor for suspicious activity and will alert you of any unusual login attempts.
                                            </p>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="item-7">
                                    <AccordionTrigger>Are you GDPR/CCPA compliant?</AccordionTrigger>
                                    <AccordionContent>
                                        <div className="space-y-3">
                                            <p>Yes. We comply with major data protection regulations:</p>
                                            <ul className="list-disc pl-6 space-y-2 text-sm">
                                                <li><strong>GDPR:</strong> Full compliance with EU data protection requirements</li>
                                                <li><strong>CCPA:</strong> California Consumer Privacy Act compliance</li>
                                                <li><strong>Data Rights:</strong> Easy access, correction, deletion, and export of your data</li>
                                                <li><strong>Consent:</strong> Clear consent mechanisms for data collection and processing</li>
                                                <li><strong>International Transfers:</strong> Appropriate safeguards for data transfers</li>
                                            </ul>
                                            <p className="text-sm">
                                                Read our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link> and <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link> for complete details.
                                            </p>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                    </Card>

                    {/* Account & Billing */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Account & Billing</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="item-1">
                                    <AccordionTrigger>How do I update my account information?</AccordionTrigger>
                                    <AccordionContent>
                                        Go to <Link href="/settings" className="text-primary hover:underline">Settings</Link> to update your personal and professional information. For email or password changes, use Settings → Account Security. Changes are saved automatically and will be reflected in your AI-generated content.
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="item-2">
                                    <AccordionTrigger>Can I export my data?</AccordionTrigger>
                                    <AccordionContent>
                                        Yes. You can export all your content, research reports, and profile data at any time from Settings → Data Export. We provide exports in multiple formats including PDF, Word, and JSON for easy migration or backup.
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="item-3">
                                    <AccordionTrigger>How do I cancel my subscription?</AccordionTrigger>
                                    <AccordionContent>
                                        We're sorry to see you go! You can cancel anytime from Settings → Billing. Your access will continue until the end of your current billing period. Before canceling, consider reaching out to support - we're here to help resolve any issues.
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                    </Card>

                    {/* Technical Issues */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Technical Issues</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="item-1">
                                    <AccordionTrigger>The AI is taking too long to generate content</AccordionTrigger>
                                    <AccordionContent>
                                        AI generation typically takes 30-60 seconds. If it's taking longer, check your internet connection and try refreshing the page. For complex content like research reports, it may take up to 5 minutes. If issues persist, contact support with details about what you were trying to generate.
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="item-2">
                                    <AccordionTrigger>I'm getting an error message</AccordionTrigger>
                                    <AccordionContent>
                                        Try refreshing the page first. If the error persists, note the exact error message and contact support. Common issues include session timeouts (just log in again) or temporary service disruptions (usually resolved within minutes). Clear your browser cache if problems continue.
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="item-3">
                                    <AccordionTrigger>The app looks broken on my device</AccordionTrigger>
                                    <AccordionContent>
                                        Bayon Coagent is optimized for modern browsers (Chrome, Firefox, Safari, Edge). Make sure you're using the latest version. Clear your browser cache and cookies. The app is fully responsive and works on desktop, tablet, and mobile devices. If issues persist, let us know your device and browser details.
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="item-4">
                                    <AccordionTrigger>I can't log in</AccordionTrigger>
                                    <AccordionContent>
                                        First, verify you're using the correct email and password. Use "Forgot Password" to reset if needed. Check that your email is verified (check spam folder for verification email). If you're still having trouble, contact support with your registered email address.
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                    </Card>
                </div>

                {/* Contact Section */}
                <Card className="mt-12 bg-primary/5">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">Still need help?</CardTitle>
                        <CardDescription className="text-base">
                            Our support team is here to assist you
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <a href="mailto:contact@bayoncoagent.com">
                                <Button size="lg">
                                    <Mail className="h-5 w-5 mr-2" />
                                    Email Support
                                </Button>
                            </a>
                            <Link href="/training-hub">
                                <Button size="lg" variant="outline">
                                    <Book className="h-5 w-5 mr-2" />
                                    View Training Hub
                                </Button>
                            </Link>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Average response time: 24 hours
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
