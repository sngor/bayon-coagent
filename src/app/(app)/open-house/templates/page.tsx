import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { listSessionTemplates } from '../actions';
import { TemplatesContent } from './templates-content';

export default async function TemplatesPage() {
    const { templates, error } = await listSessionTemplates();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-headline font-bold">Session Templates</h2>
                    <p className="text-muted-foreground">
                        Create reusable templates for common open house scenarios
                    </p>
                </div>
            </div>

            {error && (
                <Card className="border-destructive">
                    <CardContent className="pt-6">
                        <p className="text-destructive text-sm">{error}</p>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Your Templates</CardTitle>
                    <CardDescription>
                        Save time by creating templates for different property types and scenarios
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {templates && templates.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No templates yet. Create your first template to streamline session creation.</p>
                        </div>
                    ) : (
                        <TemplatesContent templates={templates || []} />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
