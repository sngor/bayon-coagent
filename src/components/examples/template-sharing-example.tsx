'use client';

/**
 * Template Sharing Example Component
 * 
 * Demonstrates how to use the template sharing components together
 * in a real application scenario.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Share2, Users, Bell, Settings } from 'lucide-react';

import { ShareTemplateModal } from '@/components/share-template-modal';
import { TemplateSharingStatus } from '@/components/template-sharing-status';
import { SharingNotifications } from '@/components/sharing-notifications';
import {
    Template,
    TemplatePermissions,
    ContentCategory
} from '@/lib/content-workflow-types';

// Mock template data
const MOCK_TEMPLATE: Template = {
    id: 'template_123',
    userId: 'user_current',
    name: 'Luxury Listing Description Template',
    description: 'Professional template for high-end property listings with market positioning and luxury amenities focus.',
    contentType: ContentCategory.LISTING_DESCRIPTION,
    configuration: {
        promptParameters: {
            propertyType: 'luxury',
            priceRange: 'high-end',
            focusAreas: ['amenities', 'location', 'investment-potential']
        },
        contentStructure: {
            sections: ['headline', 'overview', 'amenities', 'location', 'call-to-action'],
            format: 'listing-description',
            wordCount: 400,
            includeImages: true,
            includeHashtags: true
        },
        stylePreferences: {
            tone: 'sophisticated and compelling',
            length: 'medium',
            keywords: ['luxury', 'premium', 'exclusive', 'investment'],
            targetAudience: 'high-net-worth buyers',
            callToAction: 'Schedule a private showing'
        }
    },
    isShared: true,
    brokerageId: 'brokerage_1',
    permissions: {
        canView: ['user_1', 'user_2', 'user_3'],
        canEdit: ['user_1', 'user_2'],
        canShare: ['user_1'],
        canDelete: []
    },
    isSeasonal: false,
    seasonalTags: [],
    usageCount: 15,
    lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20')
};

export function TemplateSharingExample() {
    const [showShareModal, setShowShareModal] = useState(false);
    const [template, setTemplate] = useState<Template>(MOCK_TEMPLATE);

    const handleShareSuccess = (templateId: string, permissions: TemplatePermissions) => {
        console.log('Template shared successfully:', { templateId, permissions });

        // Update template with new sharing status
        setTemplate(prev => ({
            ...prev,
            isShared: true,
            permissions,
            updatedAt: new Date()
        }));
    };

    const handleUpdateSharing = (templateId: string) => {
        console.log('Update sharing for template:', templateId);
        setShowShareModal(true);
    };

    const handleUnshare = (templateId: string) => {
        console.log('Unshare template:', templateId);

        // Update template to remove sharing
        setTemplate(prev => ({
            ...prev,
            isShared: false,
            permissions: undefined,
            brokerageId: undefined,
            updatedAt: new Date()
        }));
    };

    const handleNotificationAction = (notificationId: string, action: 'approve' | 'deny' | 'dismiss') => {
        console.log('Notification action:', { notificationId, action });
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold">Template Sharing System</h1>
                <p className="text-muted-foreground">
                    Comprehensive team collaboration for template sharing with role-based access control
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Template Info & Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="w-5 h-5" />
                            Template Management
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h3 className="font-semibold text-lg">{template.name}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                {template.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline">{template.contentType}</Badge>
                                <Badge variant="secondary">
                                    {template.usageCount} uses
                                </Badge>
                                {template.isShared && (
                                    <Badge variant="default" className="bg-green-600">
                                        <Share2 className="w-3 h-3 mr-1" />
                                        Shared
                                    </Badge>
                                )}
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <Button
                                onClick={() => setShowShareModal(true)}
                                className="w-full"
                                variant={template.isShared ? "outline" : "default"}
                            >
                                <Share2 className="w-4 h-4 mr-2" />
                                {template.isShared ? 'Update Sharing' : 'Share Template'}
                            </Button>

                            {template.isShared && (
                                <div className="text-xs text-muted-foreground text-center">
                                    Shared with {template.permissions?.canView.length || 0} team members
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Sharing Notifications */}
                <SharingNotifications
                    userId="user_current"
                    brokerageId="brokerage_1"
                    onNotificationAction={handleNotificationAction}
                />
            </div>

            {/* Sharing Status */}
            <TemplateSharingStatus
                template={template}
                brokerageId="brokerage_1"
                currentUserId="user_current"
                onUpdateSharing={handleUpdateSharing}
                onUnshare={handleUnshare}
            />

            {/* Share Modal */}
            <ShareTemplateModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                template={template}
                brokerageId="brokerage_1"
                currentUserId="user_current"
                onShareSuccess={handleShareSuccess}
            />

            {/* Usage Instructions */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        How to Use Template Sharing
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <h4 className="font-medium">For Template Owners:</h4>
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li>• Click "Share Template" to open the sharing modal</li>
                                <li>• Search and select team members to share with</li>
                                <li>• Set granular permissions (view, edit, share, delete)</li>
                                <li>• Add optional sharing message and settings</li>
                                <li>• Monitor sharing activity and usage metrics</li>
                            </ul>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-medium">For Team Members:</h4>
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li>• Receive notifications when templates are shared</li>
                                <li>• Access shared templates in the Library</li>
                                <li>• Use copy-on-write for unauthorized edits</li>
                                <li>• Approve/deny sharing requests (brokers/admins)</li>
                                <li>• View sharing activity and usage history</li>
                            </ul>
                        </div>
                    </div>

                    <Separator />

                    <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">Permission Levels:</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                <span><strong>View:</strong> Use template</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span><strong>Edit:</strong> Modify content</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                                <span><strong>Share:</strong> Share with others</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                <span><strong>Delete:</strong> Remove template</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}