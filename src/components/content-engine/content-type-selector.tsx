/**
 * Content Type Selector Component
 * Extracted from content-engine page for better organization
 */

import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

interface ContentType {
    id: string;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
}

interface ContentTypeSelectorProps {
    contentTypes: ContentType[];
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export function ContentTypeSelector({
    contentTypes,
    activeTab,
    onTabChange
}: ContentTypeSelectorProps) {
    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                    <Label htmlFor="content-type" className="text-sm font-medium whitespace-nowrap">
                        Content Type:
                    </Label>
                    <Select value={activeTab || 'market-update'} onValueChange={onTabChange}>
                        <SelectTrigger id="content-type" className="w-full max-w-md">
                            <SelectValue placeholder="Select content type" />
                        </SelectTrigger>
                        <SelectContent>
                            {contentTypes.map((type) => {
                                const Icon = type.icon;
                                return (
                                    <SelectItem key={type.id} value={type.id}>
                                        <div className="flex items-center gap-2">
                                            <Icon className="w-4 h-4" />
                                            <span>{type.title}</span>
                                        </div>
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
        </Card>
    );
}