'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { TemplateList } from '@/components/open-house/template-list';
import { TemplateForm } from '@/components/open-house/template-form';
import type { SessionTemplate } from '@/lib/open-house/types';
import { useRouter } from 'next/navigation';

interface TemplatesContentProps {
    templates: SessionTemplate[];
}

export function TemplatesContent({ templates }: TemplatesContentProps) {
    const router = useRouter();
    const [formOpen, setFormOpen] = useState(false);

    const handleUseTemplate = (template: SessionTemplate) => {
        // Navigate to sessions page with template ID in query params
        router.push(`/open-house/sessions?templateId=${template.templateId}`);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button onClick={() => setFormOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Template
                </Button>
            </div>

            <TemplateList templates={templates} onUseTemplate={handleUseTemplate} />

            <TemplateForm open={formOpen} onOpenChange={setFormOpen} />
        </div>
    );
}
