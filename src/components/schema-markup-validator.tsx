'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    CheckCircle2,
    AlertCircle,
    AlertTriangle,
    ChevronDown,
    ChevronUp,
    Code,
    FileText,
    User,
    MessageSquare,
} from 'lucide-react';
import type {
    PageValidationResult,
    ComprehensiveValidationReport,
} from '@/lib/schema/comprehensive-validator';
import { extractAllIssues } from '@/lib/schema/comprehensive-validator';

interface SchemaMarkupValidatorProps {
    report: ComprehensiveValidationReport;
    className?: string;
}

/**
 * SchemaMarkupValidator Component
 * 
 * Displays validation results, shows preview of generated schema,
 * and provides fix suggestions.
 * 
 * Requirements: 8.4, 8.5
 */
export function SchemaMarkupValidator({
    report,
    className = '',
}: SchemaMarkupValidatorProps) {
    const [expandedPages, setExpandedPages] = useState<Set<number>>(new Set());
    const [showSchemaPreview, setShowSchemaPreview] = useState<number | null>(null);

    const togglePage = (index: number) => {
        const newExpanded = new Set(expandedPages);
        if (newExpanded.has(index)) {
            newExpanded.delete(index);
        } else {
            newExpanded.add(index);
        }
        setExpandedPages(newExpanded);
    };

    const getPageIcon = (pageType: string) => {
        switch (pageType) {
            case 'profile':
                return <User className="h-4 w-4" />;
            case 'blog-post':
                return <FileText className="h-4 w-4" />;
            case 'testimonials':
                return <MessageSquare className="h-4 w-4" />;
            default:
                return <FileText className="h-4 w-4" />;
        }
    };

    const getStatusBadge = (pageResult: PageValidationResult) => {
        if (pageResult.hasErrors) {
            return (
                <Badge variant="destructive" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {pageResult.errorCount} Error{pageResult.errorCount !== 1 ? 's' : ''}
                </Badge>
            );
        }

        if (pageResult.hasWarnings) {
            return (
                <Badge variant="secondary" className="gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {pageResult.warningCount} Warning{pageResult.warningCount !== 1 ? 's' : ''}
                </Badge>
            );
        }

        return (
            <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-700">
                <CheckCircle2 className="h-3 w-3" />
                Valid
            </Badge>
        );
    };

    const allIssues = extractAllIssues(report);

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle>Schema Markup Validation</CardTitle>
                        <CardDescription>
                            Validation results for {report.totalPages} page{report.totalPages !== 1 ? 's' : ''}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            <span className="text-sm font-medium">Valid Pages</span>
                        </div>
                        <div className="text-2xl font-bold">
                            {report.totalPages - report.pagesWithErrors - report.pagesWithWarnings}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            of {report.totalPages} total
                        </div>
                    </div>

                    <div className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="h-5 w-5 text-red-600" />
                            <span className="text-sm font-medium">Errors</span>
                        </div>
                        <div className="text-2xl font-bold text-red-600">
                            {report.totalErrors}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            across {report.pagesWithErrors} page{report.pagesWithErrors !== 1 ? 's' : ''}
                        </div>
                    </div>

                    <div className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-600" />
                            <span className="text-sm font-medium">Warnings</span>
                        </div>
                        <div className="text-2xl font-bold text-yellow-600">
                            {report.totalWarnings}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            across {report.pagesWithWarnings} page{report.pagesWithWarnings !== 1 ? 's' : ''}
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Page Results */}
                <div className="space-y-3">
                    <h4 className="text-sm font-medium">Page Details</h4>

                    {report.pageResults.map((pageResult, index) => (
                        <Collapsible
                            key={index}
                            open={expandedPages.has(index)}
                            onOpenChange={() => togglePage(index)}
                        >
                            <div className="border rounded-lg">
                                <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        {getPageIcon(pageResult.pageType)}
                                        <div className="text-left">
                                            <div className="font-medium text-sm">{pageResult.pageName}</div>
                                            <div className="text-xs text-muted-foreground capitalize">
                                                {pageResult.pageType.replace('-', ' ')}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {getStatusBadge(pageResult)}
                                        {expandedPages.has(index) ? (
                                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </div>
                                </CollapsibleTrigger>

                                <CollapsibleContent>
                                    <div className="p-4 pt-0 space-y-4">
                                        {/* Validation Results */}
                                        {pageResult.validations.map((validation, vIndex) => (
                                            <div key={vIndex} className="space-y-2">
                                                {validation.errors.length > 0 && (
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2 text-sm font-medium text-red-600">
                                                            <AlertCircle className="h-4 w-4" />
                                                            Errors
                                                        </div>
                                                        {validation.errors.map((error, eIndex) => (
                                                            <div
                                                                key={eIndex}
                                                                className="p-3 rounded-lg border border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900"
                                                            >
                                                                <div className="flex items-start gap-2">
                                                                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                                                                    <div className="flex-1">
                                                                        <div className="text-sm font-medium">{error.field}</div>
                                                                        <div className="text-sm text-muted-foreground">
                                                                            {error.message}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {validation.warnings.length > 0 && (
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2 text-sm font-medium text-yellow-600">
                                                            <AlertTriangle className="h-4 w-4" />
                                                            Warnings
                                                        </div>
                                                        {validation.warnings.map((warning, wIndex) => (
                                                            <div
                                                                key={wIndex}
                                                                className="p-3 rounded-lg border border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20 dark:border-yellow-900"
                                                            >
                                                                <div className="flex items-start gap-2">
                                                                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                                                                    <div className="flex-1">
                                                                        <div className="text-sm font-medium">{warning.field}</div>
                                                                        <div className="text-sm text-muted-foreground">
                                                                            {warning.message}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {validation.errors.length === 0 && validation.warnings.length === 0 && (
                                                    <div className="p-3 rounded-lg border border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-900">
                                                        <div className="flex items-center gap-2 text-green-600">
                                                            <CheckCircle2 className="h-4 w-4" />
                                                            <span className="text-sm">Schema is valid</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        {/* Schema Preview */}
                                        <div className="space-y-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    setShowSchemaPreview(
                                                        showSchemaPreview === index ? null : index
                                                    )
                                                }
                                                className="gap-2"
                                            >
                                                <Code className="h-4 w-4" />
                                                {showSchemaPreview === index ? 'Hide' : 'Show'} Schema Preview
                                            </Button>

                                            {showSchemaPreview === index && (
                                                <div className="rounded-lg border bg-muted/50 p-4 overflow-x-auto">
                                                    <pre className="text-xs">
                                                        {JSON.stringify(pageResult.schemas, null, 2)}
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CollapsibleContent>
                            </div>
                        </Collapsible>
                    ))}
                </div>

                {/* Fix Suggestions */}
                {allIssues.length > 0 && (
                    <>
                        <Separator />
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium">Fix Suggestions</h4>
                            <div className="space-y-2">
                                {Array.from(new Set(allIssues.map((i) => i.message))).map(
                                    (message, index) => {
                                        const issue = allIssues.find((i) => i.message === message);
                                        if (!issue) return null;

                                        return (
                                            <div
                                                key={index}
                                                className="p-3 rounded-lg border bg-card flex items-start gap-2"
                                            >
                                                <div className="mt-0.5">
                                                    {issue.severity === 'error' ? (
                                                        <AlertCircle className="h-4 w-4 text-red-600" />
                                                    ) : (
                                                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-sm font-medium">{issue.field}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {message}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* Success Message */}
                {report.totalErrors === 0 && report.totalWarnings === 0 && (
                    <div className="text-center py-8">
                        <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-600" />
                        <h3 className="text-lg font-semibold mb-1">All Schema Markup is Valid!</h3>
                        <p className="text-sm text-muted-foreground">
                            Your pages have proper structured data for search engines.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
