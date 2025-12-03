'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Code,
    Copy,
    Download,
    CheckCircle2,
    AlertCircle,
    AlertTriangle,
    Sparkles,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
    generateLocalBusinessSchema,
    generatePersonSchema,
    generateFAQPageSchema,
    generateListingSchema,
    generateAgentProfileSchema,
    schemaToScriptTag,
    validateSchema,
} from '@/lib/aeo/schema-generator';
import type { Profile } from '@/lib/types/common/common';

interface SchemaMarkupGeneratorProps {
    profile: Profile;
}

export function SchemaMarkupGenerator({ profile }: SchemaMarkupGeneratorProps) {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<'person' | 'business' | 'combined' | 'faq'>('combined');
    const [copiedSchema, setCopiedSchema] = useState<string | null>(null);

    // Generate schemas
    const personSchema = generatePersonSchema({
        name: profile.name || '',
        jobTitle: profile.jobTitle || 'Real Estate Agent',
        agencyName: profile.agencyName,
        website: profile.website,
        email: profile.email,
        phone: profile.phone,
        city: profile.city,
        state: profile.state,
        profileImage: profile.profileImage,
        socialMedia: {
            facebook: profile.facebookUrl,
            instagram: profile.instagramUrl,
            linkedin: profile.linkedinUrl,
            twitter: profile.twitterUrl,
        },
    });

    const businessSchema = generateLocalBusinessSchema({
        name: profile.name || '',
        agencyName: profile.agencyName,
        address: profile.address,
        city: profile.city,
        state: profile.state,
        zipCode: profile.zipCode,
        phone: profile.phone,
        website: profile.website,
        email: profile.email,
        reviewCount: profile.reviewCount,
        averageRating: profile.averageRating,
    });

    const combinedSchemas = generateAgentProfileSchema({
        name: profile.name || '',
        agencyName: profile.agencyName,
        jobTitle: profile.jobTitle,
        address: profile.address,
        city: profile.city,
        state: profile.state,
        zipCode: profile.zipCode,
        phone: profile.phone,
        email: profile.email,
        website: profile.website,
        profileImage: profile.profileImage,
        reviewCount: profile.reviewCount,
        averageRating: profile.averageRating,
        socialMedia: {
            facebook: profile.facebookUrl,
            instagram: profile.instagramUrl,
            linkedin: profile.linkedinUrl,
            twitter: profile.twitterUrl,
        },
    });

    // Sample FAQ schema
    const faqSchema = generateFAQPageSchema([
        {
            question: 'What areas do you serve?',
            answer: `I serve ${profile.city || 'the local area'} and surrounding communities.`,
        },
        {
            question: 'How many years of experience do you have?',
            answer: `I have ${profile.yearsOfExperience || 'several'} years of experience in real estate.`,
        },
        {
            question: 'What types of properties do you specialize in?',
            answer: profile.specialties || 'I work with residential properties including single-family homes, condos, and investment properties.',
        },
    ]);

    const handleCopy = async (schema: any, type: string) => {
        const jsonString = JSON.stringify(schema, null, 2);
        try {
            await navigator.clipboard.writeText(jsonString);
            setCopiedSchema(type);
            setTimeout(() => setCopiedSchema(null), 2000);
            toast({
                title: 'Copied!',
                description: 'Schema markup copied to clipboard',
            });
        } catch (error) {
            toast({
                title: 'Copy failed',
                description: 'Please try again',
                variant: 'destructive',
            });
        }
    };

    const handleCopyScriptTag = async (schema: any, type: string) => {
        const scriptTag = schemaToScriptTag(schema);
        try {
            await navigator.clipboard.writeText(scriptTag);
            setCopiedSchema(`${type}-script`);
            setTimeout(() => setCopiedSchema(null), 2000);
            toast({
                title: 'Copied!',
                description: 'Script tag copied to clipboard',
            });
        } catch (error) {
            toast({
                title: 'Copy failed',
                description: 'Please try again',
                variant: 'destructive',
            });
        }
    };

    const handleDownload = (schema: any, filename: string) => {
        const jsonString = JSON.stringify(schema, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast({
            title: 'Downloaded!',
            description: `${filename} has been downloaded`,
        });
    };

    const renderSchemaCard = (
        schema: any,
        title: string,
        description: string,
        type: string
    ) => {
        const validation = validateSchema(schema);

        return (
            <div className="space-y-4">
                {/* Validation Status */}
                {validation.valid ? (
                    <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800 dark:text-green-300">
                            Schema is valid and ready to use
                        </AlertDescription>
                    </Alert>
                ) : (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            <div className="font-semibold mb-1">Validation Errors:</div>
                            <ul className="list-disc list-inside text-sm">
                                {validation.errors.map((error, i) => (
                                    <li key={i}>{error}</li>
                                ))}
                            </ul>
                        </AlertDescription>
                    </Alert>
                )}

                {/* Warnings */}
                {validation.warnings.length > 0 && (
                    <Alert className="bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-yellow-800 dark:text-yellow-300">
                            <div className="font-semibold mb-1">Recommendations:</div>
                            <ul className="list-disc list-inside text-sm">
                                {validation.warnings.map((warning, i) => (
                                    <li key={i}>{warning}</li>
                                ))}
                            </ul>
                        </AlertDescription>
                    </Alert>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                    <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleCopy(schema, type)}
                    >
                        {copiedSchema === type ? (
                            <>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Copied!
                            </>
                        ) : (
                            <>
                                <Copy className="mr-2 h-4 w-4" />
                                Copy JSON
                            </>
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyScriptTag(schema, type)}
                    >
                        {copiedSchema === `${type}-script` ? (
                            <>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Copied!
                            </>
                        ) : (
                            <>
                                <Code className="mr-2 h-4 w-4" />
                                Copy Script Tag
                            </>
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(schema, `${type}-schema.json`)}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                    </Button>
                </div>

                {/* Schema Preview */}
                <div className="relative">
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                        <code>{JSON.stringify(schema, null, 2)}</code>
                    </pre>
                </div>

                {/* Implementation Instructions */}
                <Alert>
                    <Code className="h-4 w-4" />
                    <AlertDescription>
                        <div className="font-semibold mb-2">How to implement:</div>
                        <ol className="list-decimal list-inside text-sm space-y-1">
                            <li>Copy the script tag version</li>
                            <li>Paste it in the {'<head>'} section of your website</li>
                            <li>Test with Google's Rich Results Test tool</li>
                            <li>Monitor in Google Search Console</li>
                        </ol>
                    </AlertDescription>
                </Alert>
            </div>
        );
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            Schema Markup Generator
                        </CardTitle>
                        <CardDescription>
                            Generate structured data to help AI search engines understand your profile
                        </CardDescription>
                    </div>
                    <Badge variant="secondary">AI-Optimized</Badge>
                </div>
            </CardHeader>
            <CardContent>
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="combined">Combined</TabsTrigger>
                        <TabsTrigger value="person">Person</TabsTrigger>
                        <TabsTrigger value="business">Business</TabsTrigger>
                        <TabsTrigger value="faq">FAQ</TabsTrigger>
                    </TabsList>

                    <TabsContent value="combined" className="space-y-4 mt-6">
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Complete Profile Schema</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Includes Person, LocalBusiness, and FAQ schemas for maximum AI visibility
                                </p>
                            </div>
                            {renderSchemaCard(
                                combinedSchemas,
                                'Combined Schema',
                                'All schemas for your profile page',
                                'combined'
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="person" className="space-y-4 mt-6">
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Person Schema</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Identifies you as a real estate professional with contact information
                                </p>
                            </div>
                            {renderSchemaCard(
                                personSchema,
                                'Person Schema',
                                'Your professional identity',
                                'person'
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="business" className="space-y-4 mt-6">
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold mb-2">LocalBusiness Schema</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Marks your business for local search and AI recommendations
                                </p>
                            </div>
                            {renderSchemaCard(
                                businessSchema,
                                'LocalBusiness Schema',
                                'Your business information',
                                'business'
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="faq" className="space-y-4 mt-6">
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold mb-2">FAQ Schema</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Helps AI understand common questions about your services
                                </p>
                            </div>
                            {renderSchemaCard(
                                faqSchema,
                                'FAQ Schema',
                                'Frequently asked questions',
                                'faq'
                            )}
                            <Alert>
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                    <div className="font-semibold mb-1">Customize Your FAQs</div>
                                    <p className="text-sm">
                                        This is a sample FAQ schema. Edit the questions and answers to match your
                                        actual services and expertise for better AI visibility.
                                    </p>
                                </AlertDescription>
                            </Alert>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Additional Resources */}
                <div className="mt-6 pt-6 border-t">
                    <h4 className="font-semibold mb-3">Testing & Validation Tools</h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Button variant="outline" size="sm" asChild>
                            <a
                                href="https://search.google.com/test/rich-results"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Google Rich Results Test
                            </a>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                            <a
                                href="https://validator.schema.org/"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Schema.org Validator
                            </a>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
