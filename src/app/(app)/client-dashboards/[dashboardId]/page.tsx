'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser } from '@/aws/auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { StandardSkeleton } from '@/components/standard/skeleton';
import { toast } from '@/hooks/use-toast';
import { useS3Upload } from '@/hooks/use-s3-upload';
import {
    ArrowLeft,
    Save,
    Link as LinkIcon,
    Copy,
    Ban,
    BarChart3,
    Upload,
    X,
    Calendar,
    ExternalLink,
    Plus,
    Trash2,
    Eye,
    Sparkles,
    MessageSquare,
    RefreshCw,
} from 'lucide-react';
import {
    updateDashboard,
    generateSecuredLink,
    revokeLink,
    getDashboardAnalytics,
    createCMAReport,
    updateCMAReport,
    attachCMAToDashboard,
    uploadDocumentToDashboard,
    removeDocumentFromDashboard,
    listDashboardDocuments,
    type ClientDashboard,
    type DashboardAnalytics,
    type CMAReport,
    type DashboardDocument,
    listValuationsForDashboard,
    getDashboard,
    listDashboardLinks,
    deleteDashboard,
} from '@/features/client-dashboards/actions/client-dashboard-actions';
import { generateClientNudges, type ClientNudge } from '@/features/client-dashboards/actions/client-nudge-actions';
import type { PropertyValuationOutput } from '@/aws/bedrock/flows';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatDistanceToNow } from 'date-fns';

export default function DashboardBuilderPage() {
    const router = useRouter();
    const params = useParams();
    const { user, isUserLoading } = useUser();
    const dashboardId = params.dashboardId as string;

    // State
    const [dashboard, setDashboard] = useState<ClientDashboard | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
    const [currentLink, setCurrentLink] = useState<{ link: string; expiresAt: number } | null>(null);
    const [showLinkDialog, setShowLinkDialog] = useState(false);
    const [showAnalyticsDialog, setShowAnalyticsDialog] = useState(false);
    const [showCMAPreview, setShowCMAPreview] = useState(false);
    const [expirationDays, setExpirationDays] = useState<number>(30);
    const [cmaReport, setCmaReport] = useState<CMAReport | null>(null);
    const [isSavingCMA, setIsSavingCMA] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Nudges state
    const [nudges, setNudges] = useState<ClientNudge[]>([]);
    const [isLoadingNudges, setIsLoadingNudges] = useState(false);

    // Document management state
    const [documents, setDocuments] = useState<DashboardDocument[]>([]);
    const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
    const [isUploadingDocument, setIsUploadingDocument] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // Valuation state
    const [valuations, setValuations] = useState<(PropertyValuationOutput & { id: string; generatedAt: number; propertyDescription: string })[]>([]);
    const [isLoadingValuations, setIsLoadingValuations] = useState(false);

    // Form state
    const [clientName, setClientName] = useState('');
    const [clientEmail, setClientEmail] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [propertyInterests, setPropertyInterests] = useState('');
    const [notes, setNotes] = useState('');
    const [enableCMA, setEnableCMA] = useState(false);
    const [enablePropertySearch, setEnablePropertySearch] = useState(true);
    const [enableHomeValuation, setEnableHomeValuation] = useState(true);
    const [enableDocuments, setEnableDocuments] = useState(true);
    const [enableCalculators, setEnableCalculators] = useState(false);
    const [enableMilestones, setEnableMilestones] = useState(false);
    const [enableVendors, setEnableVendors] = useState(false);
    const [logoUrl, setLogoUrl] = useState('');
    const [logoS3Key, setLogoS3Key] = useState('');
    const [primaryColor, setPrimaryColor] = useState('#3b82f6');
    const [welcomeMessage, setWelcomeMessage] = useState('');
    const [agentPhone, setAgentPhone] = useState('');
    const [agentEmail, setAgentEmail] = useState('');

    // CMA form state
    const [subjectAddress, setSubjectAddress] = useState('');
    const [subjectBeds, setSubjectBeds] = useState<number>(3);
    const [subjectBaths, setSubjectBaths] = useState<number>(2);
    const [subjectSqft, setSubjectSqft] = useState<number>(1500);
    const [subjectYearBuilt, setSubjectYearBuilt] = useState<number>(2000);
    const [comparables, setComparables] = useState<Array<{
        address: string;
        soldPrice: number;
        soldDate: string;
        beds: number;
        baths: number;
        sqft: number;
        distance: number;
    }>>([]);
    const [medianPrice, setMedianPrice] = useState<number>(0);
    const [daysOnMarket, setDaysOnMarket] = useState<number>(0);
    const [inventoryLevel, setInventoryLevel] = useState<'low' | 'medium' | 'high'>('medium');
    const [priceLow, setPriceLow] = useState<number>(0);
    const [priceMid, setPriceMid] = useState<number>(0);
    const [priceHigh, setPriceHigh] = useState<number>(0);
    const [agentNotes, setAgentNotes] = useState('');

    // Milestones state
    const [milestones, setMilestones] = useState<Array<{
        id: string;
        title: string;
        status: 'pending' | 'in_progress' | 'completed';
        date?: string;
        description?: string;
    }>>([]);

    // Vendors state
    const [vendors, setVendors] = useState<Array<{
        id: string;
        name: string;
        category: string;
        phone?: string;
        email?: string;
        website?: string;
        notes?: string;
    }>>([]);

    // S3 upload hook
    const { upload, isUploading, uploadedUrl, reset: resetUpload } = useS3Upload({
        maxSizeMB: 5,
        allowedTypes: ['image/jpeg', 'image/png', 'image/jpg'],
        onSuccess: (url) => {
            setLogoUrl(url);
            toast({
                title: 'Success',
                description: 'Logo uploaded successfully',
            });
        },
        onError: (error) => {
            toast({
                variant: 'destructive',
                title: 'Upload Failed',
                description: error,
            });
        },
    });

    // Fetch dashboard data
    useEffect(() => {
        if (!user || !dashboardId) {
            setIsLoading(false);
            return;
        }

        const fetchDashboard = async () => {
            setIsLoading(true);
            try {
                const [dashboardResult, linksResult] = await Promise.all([
                    getDashboard(dashboardId),
                    listDashboardLinks(dashboardId)
                ]);

                if (dashboardResult.message === 'success' && dashboardResult.data) {
                    const data = dashboardResult.data;
                    setDashboard(data);
                    // Populate form fields
                    setClientName(data.clientInfo.name);
                    setClientEmail(data.clientInfo.email);
                    setClientPhone(data.clientInfo.phone || '');
                    setPropertyInterests(data.clientInfo.propertyInterests || '');
                    setNotes(data.clientInfo.notes || '');
                    setEnableCMA(data.dashboardConfig.enableCMA);
                    setEnablePropertySearch(data.dashboardConfig.enablePropertySearch);
                    setEnableHomeValuation(data.dashboardConfig.enableHomeValuation);
                    setEnableDocuments(data.dashboardConfig.enableDocuments);
                    setEnableCalculators(data.dashboardConfig.enableCalculators || false);
                    setEnableMilestones(data.dashboardConfig.enableMilestones || false);
                    setEnableVendors(data.dashboardConfig.enableVendors || false);
                    setLogoUrl(data.branding.logoUrl || '');
                    setLogoS3Key(data.branding.logoS3Key || '');
                    setPrimaryColor(data.branding.primaryColor);
                    setWelcomeMessage(data.branding.welcomeMessage);
                    setAgentPhone(data.branding.agentContact.phone);
                    setAgentEmail(data.branding.agentContact.email);

                    // Load milestones and vendors
                    if (data.milestones) setMilestones(data.milestones);
                    if (data.vendors) setVendors(data.vendors);

                    // Load CMA data if exists (populate form fields)
                    if (data.cmaData) {
                        setSubjectAddress(data.cmaData.subjectProperty.address);
                        setSubjectBeds(data.cmaData.subjectProperty.beds);
                        setSubjectBaths(data.cmaData.subjectProperty.baths);
                        setSubjectSqft(data.cmaData.subjectProperty.sqft);
                        setSubjectYearBuilt(data.cmaData.subjectProperty.yearBuilt);
                        setComparables(data.cmaData.comparables);
                        setMedianPrice(data.cmaData.marketTrends.medianPrice);
                        setDaysOnMarket(data.cmaData.marketTrends.daysOnMarket);
                        setInventoryLevel(data.cmaData.marketTrends.inventoryLevel);
                        setPriceLow(data.cmaData.priceRecommendation.low);
                        setPriceMid(data.cmaData.priceRecommendation.mid);
                        setPriceHigh(data.cmaData.priceRecommendation.high);
                        setAgentNotes(data.cmaData.agentNotes || '');
                    }

                    // Load documents
                    await loadDocuments();

                    // Load valuations
                    await loadValuations();
                } else {
                    toast({
                        variant: 'destructive',
                        title: 'Error',
                        description: 'Dashboard not found',
                    });
                    router.push('/client-dashboards');
                    return;
                }

                // Handle links
                if (linksResult.message === 'success' && linksResult.data) {
                    // Find the most recent active link
                    const activeLink = linksResult.data
                        .filter(l => !l.revoked && l.expiresAt > Date.now())
                        .sort((a, b) => b.createdAt - a.createdAt)[0];

                    if (activeLink) {
                        const baseUrl = window.location.origin;
                        const fullUrl = `${baseUrl}/d/${activeLink.token}`;
                        setCurrentLink({
                            link: fullUrl,
                            expiresAt: activeLink.expiresAt
                        });
                    }
                }

            } catch (error) {
                console.error('Error fetching dashboard:', error);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Failed to load dashboard',
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboard();
    }, [user, dashboardId, router]);

    // Fetch analytics and generate nudges
    useEffect(() => {
        if (dashboardId && dashboard) {
            const loadData = async () => {
                try {
                    const analyticsResult = await getDashboardAnalytics(dashboardId);
                    if (analyticsResult.data) {
                        setAnalytics(analyticsResult.data);

                        // Generate nudges
                        setIsLoadingNudges(true);
                        const nudgesResult = await generateClientNudges(dashboard, analyticsResult.data);
                        if (nudgesResult.data) {
                            setNudges(nudgesResult.data);
                        }
                        setIsLoadingNudges(false);
                    }
                } catch (error) {
                    console.error('Error loading analytics/nudges:', error);
                }
            };
            loadData();
        }
    }, [dashboardId, dashboard]);

    // Handle generate nudges manually
    const handleGenerateNudges = async () => {
        if (!dashboard || !analytics) return;

        setIsLoadingNudges(true);
        try {
            const result = await generateClientNudges(dashboard, analytics);
            if (result.message === 'success' && result.data) {
                setNudges(result.data);
                toast({
                    title: 'Success',
                    description: 'Nudges refreshed successfully',
                });
            }
        } catch (error) {
            console.error('Error generating nudges:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to generate nudges',
            });
        } finally {
            setIsLoadingNudges(false);
        }
    };

    // Load documents
    const loadDocuments = async () => {
        if (!dashboardId) return;

        setIsLoadingDocuments(true);
        try {
            const result = await listDashboardDocuments(dashboardId);
            if (result.message === 'success' && result.data) {
                setDocuments(result.data);
            }
        } catch (error) {
            console.error('Error loading documents:', error);
        } finally {
            setIsLoadingDocuments(false);
        }
    };

    // Load valuations
    const loadValuations = async () => {
        if (!dashboardId) return;

        setIsLoadingValuations(true);
        try {
            const result = await listValuationsForDashboard(dashboardId);
            if (result.message === 'success' && result.data) {
                setValuations(result.data);
            }
        } catch (error) {
            console.error('Error loading valuations:', error);
        } finally {
            setIsLoadingValuations(false);
        }
    };

    // Handle logo upload
    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        const url = await upload(file, user.id, 'dashboard-logo');
        if (url) {
            setLogoS3Key(`agents/${user.id}/branding/logo.${file.name.split('.').pop()}`);
        }
    };

    // Handle save
    const handleSave = async () => {
        if (!user || !dashboard) return;

        setIsSaving(true);
        try {
            const formData = new FormData();
            formData.append('dashboardId', dashboardId);
            formData.append('clientName', clientName);
            formData.append('clientEmail', clientEmail);
            formData.append('clientPhone', clientPhone);
            formData.append('propertyInterests', propertyInterests);
            formData.append('notes', notes);
            formData.append('enableCMA', enableCMA.toString());
            formData.append('enablePropertySearch', enablePropertySearch.toString());
            formData.append('enableHomeValuation', enableHomeValuation.toString());
            formData.append('enableHomeValuation', enableHomeValuation.toString());
            formData.append('enableDocuments', enableDocuments.toString());
            formData.append('enableCalculators', enableCalculators.toString());
            formData.append('enableMilestones', enableMilestones.toString());
            formData.append('enableVendors', enableVendors.toString());
            formData.append('logoUrl', logoUrl);
            formData.append('logoS3Key', logoS3Key);
            formData.append('primaryColor', primaryColor);
            formData.append('welcomeMessage', welcomeMessage);
            formData.append('agentPhone', agentPhone);
            formData.append('agentEmail', agentEmail);
            formData.append('milestones', JSON.stringify(milestones));
            formData.append('vendors', JSON.stringify(vendors));

            const result = await updateDashboard(null, formData);

            if (result.message === 'success' && result.data) {
                setDashboard(result.data);
                toast({
                    title: 'Success',
                    description: 'Dashboard updated successfully',
                });
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: result.message || 'Failed to update dashboard',
                });
            }
        } catch (error) {
            console.error('Error saving dashboard:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to save dashboard',
            });
        } finally {
            setIsSaving(false);
        }
    };

    // Handle delete dashboard
    const handleDeleteDashboard = async () => {
        if (!user || !dashboardId) return;

        setIsDeleting(true);
        try {
            const formData = new FormData();
            formData.append('dashboardId', dashboardId);

            const result = await deleteDashboard(null, formData);

            if (result.message === 'success') {
                toast({
                    title: 'Success',
                    description: 'Dashboard deleted successfully',
                });
                router.push('/client-dashboards');
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: result.message || 'Failed to delete dashboard',
                });
                setIsDeleting(false);
                setShowDeleteDialog(false);
            }
        } catch (error) {
            console.error('Error deleting dashboard:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to delete dashboard',
            });
            setIsDeleting(false);
            setShowDeleteDialog(false);
        }
    };

    // Handle generate link
    const handleGenerateLink = async () => {
        if (!user) return;

        try {
            const formData = new FormData();
            formData.append('dashboardId', dashboardId);
            formData.append('expirationDays', expirationDays.toString());

            const result = await generateSecuredLink(null, formData);

            if (result.message === 'success' && result.data) {
                setCurrentLink(result.data);
                toast({
                    title: 'Success',
                    description: 'Secured link generated successfully',
                });
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: result.message || 'Failed to generate link',
                });
            }
        } catch (error) {
            console.error('Error generating link:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to generate link',
            });
        }
    };

    // Handle copy link
    const handleCopyLink = () => {
        if (!currentLink) return;

        navigator.clipboard.writeText(currentLink.link);
        toast({
            title: 'Copied',
            description: 'Link copied to clipboard',
        });
    };

    // Handle revoke link
    const handleRevokeLink = async () => {
        if (!user || !currentLink) return;

        try {
            const formData = new FormData();
            formData.append('dashboardId', dashboardId);
            // Extract token from link
            const token = currentLink.link.split('/d/')[1];
            formData.append('token', token);

            const result = await revokeLink(null, formData);

            if (result.message === 'success') {
                setCurrentLink(null);
                toast({
                    title: 'Success',
                    description: 'Link revoked successfully',
                });
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: result.message || 'Failed to revoke link',
                });
            }
        } catch (error) {
            console.error('Error revoking link:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to revoke link',
            });
        }
    };

    // Handle view analytics
    const handleViewAnalytics = async () => {
        if (!user) return;

        try {
            const result = await getDashboardAnalytics(dashboardId);

            if (result.message === 'success' && result.data) {
                setAnalytics(result.data);
                setShowAnalyticsDialog(true);
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: result.message || 'Failed to load analytics',
                });
            }
        } catch (error) {
            console.error('Error loading analytics:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to load analytics',
            });
        }
    };

    // Handle add comparable
    const handleAddComparable = () => {
        setComparables([
            ...comparables,
            {
                address: '',
                soldPrice: 0,
                soldDate: new Date().toISOString().split('T')[0],
                beds: 3,
                baths: 2,
                sqft: 1500,
                distance: 0,
            },
        ]);
    };

    // Handle remove comparable
    const handleRemoveComparable = (index: number) => {
        setComparables(comparables.filter((_, i) => i !== index));
    };

    // Handle update comparable
    const handleUpdateComparable = (index: number, field: string, value: any) => {
        const updated = [...comparables];
        updated[index] = { ...updated[index], [field]: value };
        setComparables(updated);
    };

    // Handle document upload
    const handleDocumentUpload = async (files: FileList | null) => {
        if (!files || files.length === 0 || !dashboardId) return;

        const file = files[0];

        // Validate file type
        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'image/png',
            'image/jpeg',
            'image/jpg',
        ];

        if (!allowedTypes.includes(file.type)) {
            toast({
                variant: 'destructive',
                title: 'Invalid File Type',
                description: 'Only PDF, DOCX, XLSX, PNG, JPG, and JPEG files are allowed',
            });
            return;
        }

        // Validate file size (25MB)
        const maxSize = 25 * 1024 * 1024;
        if (file.size > maxSize) {
            toast({
                variant: 'destructive',
                title: 'File Too Large',
                description: 'File size must be less than 25MB',
            });
            return;
        }

        setIsUploadingDocument(true);
        try {
            const result = await uploadDocumentToDashboard(dashboardId, file);

            if (result.message === 'success' && result.data) {
                setDocuments([...documents, result.data]);
                toast({
                    title: 'Success',
                    description: 'Document uploaded successfully',
                });
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Upload Failed',
                    description: result.message || 'Failed to upload document',
                });
            }
        } catch (error) {
            console.error('Error uploading document:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to upload document',
            });
        } finally {
            setIsUploadingDocument(false);
        }
    };

    // Handle document remove
    const handleRemoveDocument = async (documentId: string) => {
        if (!confirm('Are you sure you want to remove this document?')) return;

        try {
            const result = await removeDocumentFromDashboard(documentId);

            if (result.message === 'success') {
                setDocuments(documents.filter(doc => doc.id !== documentId));
                toast({
                    title: 'Success',
                    description: 'Document removed successfully',
                });
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: result.message || 'Failed to remove document',
                });
            }
        } catch (error) {
            console.error('Error removing document:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to remove document',
            });
        }
    };

    // Milestone handlers
    const handleAddMilestone = () => {
        setMilestones([
            ...milestones,
            {
                id: crypto.randomUUID(),
                title: 'New Milestone',
                status: 'pending',
                date: new Date().toISOString().split('T')[0],
            }
        ]);
    };

    const handleRemoveMilestone = (id: string) => {
        setMilestones(milestones.filter(m => m.id !== id));
    };

    const handleUpdateMilestone = (id: string, field: string, value: any) => {
        setMilestones(milestones.map(m => m.id === id ? { ...m, [field]: value } : m));
    };

    // Vendor handlers
    const handleAddVendor = () => {
        setVendors([
            ...vendors,
            {
                id: crypto.randomUUID(),
                name: '',
                category: 'General',
                phone: '',
                email: '',
            }
        ]);
    };

    const handleRemoveVendor = (id: string) => {
        setVendors(vendors.filter(v => v.id !== id));
    };

    const handleUpdateVendor = (id: string, field: string, value: any) => {
        setVendors(vendors.map(v => v.id === id ? { ...v, [field]: value } : v));
    };

    // Handle drag and drop
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleDocumentUpload(e.dataTransfer.files);
    };

    // Format file size
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    // Get file type icon
    const getFileTypeIcon = (contentType: string): string => {
        if (contentType.includes('pdf')) return '📄';
        if (contentType.includes('word')) return '📝';
        if (contentType.includes('sheet')) return '📊';
        if (contentType.includes('image')) return '🖼️';
        return '📎';
    };

    // Handle save CMA
    const handleSaveCMA = async () => {
        if (!user) return;

        // Validation
        if (!subjectAddress) {
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: 'Subject property address is required',
            });
            return;
        }

        if (comparables.length < 3 || comparables.length > 5) {
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: 'Please add 3-5 comparable properties',
            });
            return;
        }

        setIsSavingCMA(true);
        try {
            const cmaData = {
                subjectProperty: {
                    address: subjectAddress,
                    beds: subjectBeds,
                    baths: subjectBaths,
                    sqft: subjectSqft,
                    yearBuilt: subjectYearBuilt,
                },
                comparables,
                marketTrends: {
                    medianPrice,
                    daysOnMarket,
                    inventoryLevel,
                },
                priceRecommendation: {
                    low: priceLow,
                    mid: priceMid,
                    high: priceHigh,
                },
                agentNotes,
            };

            let result;
            if (cmaReport) {
                // Update existing CMA
                const formData = new FormData();
                formData.append('cmaReportId', cmaReport.id);
                formData.append('updates', JSON.stringify(cmaData));
                result = await updateCMAReport(null, formData);
            } else {
                // Create new CMA
                const formData = new FormData();
                formData.append('cmaData', JSON.stringify(cmaData));
                result = await createCMAReport(null, formData);
            }

            if (result.message === 'success' && result.data) {
                setCmaReport(result.data);

                // Attach to dashboard
                const attachFormData = new FormData();
                attachFormData.append('dashboardId', dashboardId);
                attachFormData.append('cmaReportId', result.data.id);
                const attachResult = await attachCMAToDashboard(null, attachFormData);

                if (attachResult.message === 'success') {
                    toast({
                        title: 'Success',
                        description: 'CMA report saved successfully',
                    });
                } else {
                    toast({
                        variant: 'destructive',
                        title: 'Warning',
                        description: 'CMA saved but failed to attach to dashboard',
                    });
                }
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: result.message || 'Failed to save CMA report',
                });
            }
        } catch (error) {
            console.error('Error saving CMA:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to save CMA report',
            });
        } finally {
            setIsSavingCMA(false);
        }
    };

    if (isUserLoading || isLoading) {
        return <StandardSkeleton variant="form" />;
    }

    if (!user || !dashboard) {
        return null;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push('/client-dashboards')}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Dashboard Builder</h1>
                        <p className="text-sm text-muted-foreground">
                            Configure your client's personalized dashboard
                        </p>
                    </div>
                </div>
                <Button onClick={handleSave} disabled={isSaving}>
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => setShowDeleteDialog(true)}
                    title="Delete Dashboard"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>

            {/* Concierge Nudges Section */}
            {nudges && nudges.length > 0 && (
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-primary" />
                                <CardTitle>Concierge Nudges</CardTitle>
                            </div>
                            <Button variant="ghost" size="sm" onClick={handleGenerateNudges} disabled={isLoadingNudges}>
                                <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingNudges ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                        </div>
                        <CardDescription>
                            AI-suggested actions based on client activity
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {nudges.map((nudge) => (
                            <Card key={nudge.id} className="bg-background">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <Badge variant="outline">{nudge.type.replace('_', ' ')}</Badge>
                                    </div>
                                    <CardTitle className="text-base mt-2">{nudge.title}</CardTitle>
                                    <CardDescription className="text-xs">{nudge.reason}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="bg-muted p-3 rounded-md text-sm italic mb-3">
                                        "{nudge.message}"
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full"
                                        onClick={() => {
                                            navigator.clipboard.writeText(nudge.message);
                                            toast({ title: 'Copied', description: 'Message copied to clipboard' });
                                        }}
                                    >
                                        <Copy className="h-3 w-3 mr-2" />
                                        Copy Message
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Client Information Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Client Information</CardTitle>
                    <CardDescription>
                        Basic information about your client
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="clientName">Client Name *</Label>
                            <Input
                                id="clientName"
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                                placeholder="John Doe"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="clientEmail">Email *</Label>
                            <Input
                                id="clientEmail"
                                type="email"
                                value={clientEmail}
                                onChange={(e) => setClientEmail(e.target.value)}
                                placeholder="john@example.com"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="clientPhone">Phone</Label>
                        <Input
                            id="clientPhone"
                            type="tel"
                            value={clientPhone}
                            onChange={(e) => setClientPhone(e.target.value)}
                            placeholder="(555) 123-4567"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="propertyInterests">Property Interests</Label>
                        <Textarea
                            id="propertyInterests"
                            value={propertyInterests}
                            onChange={(e) => setPropertyInterests(e.target.value)}
                            placeholder="Looking for 3-4 bedroom homes in downtown area..."
                            rows={3}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Additional notes about the client..."
                            rows={3}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Dashboard Configuration Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Dashboard Configuration</CardTitle>
                    <CardDescription>
                        Enable or disable features for this client
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="enableCMA">CMA Report</Label>
                            <p className="text-sm text-muted-foreground">
                                Show comparative market analysis reports
                            </p>
                        </div>
                        <Switch
                            id="enableCMA"
                            checked={enableCMA}
                            onCheckedChange={setEnableCMA}
                        />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="enablePropertySearch">Property Search</Label>
                            <p className="text-sm text-muted-foreground">
                                Allow client to search for properties
                            </p>
                        </div>
                        <Switch
                            id="enablePropertySearch"
                            checked={enablePropertySearch}
                            onCheckedChange={setEnablePropertySearch}
                        />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="enableHomeValuation">Home Valuation Tool</Label>
                            <p className="text-sm text-muted-foreground">
                                Enable AI-powered home valuation
                            </p>
                        </div>
                        <Switch
                            id="enableHomeValuation"
                            checked={enableHomeValuation}
                            onCheckedChange={setEnableHomeValuation}
                        />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="enableDocuments">Documents Section</Label>
                            <p className="text-sm text-muted-foreground">
                                Allow document sharing with client
                            </p>
                        </div>
                        <Switch
                            id="enableDocuments"
                            checked={enableDocuments}
                            onCheckedChange={setEnableDocuments}
                        />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="enableCalculators">Financial Calculators</Label>
                            <p className="text-sm text-muted-foreground">
                                Show mortgage and ROI calculators
                            </p>
                        </div>
                        <Switch
                            id="enableCalculators"
                            checked={enableCalculators}
                            onCheckedChange={setEnableCalculators}
                        />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="enableMilestones">Transaction Milestones</Label>
                            <p className="text-sm text-muted-foreground">
                                Track deal progress with client
                            </p>
                        </div>
                        <Switch
                            id="enableMilestones"
                            checked={enableMilestones}
                            onCheckedChange={setEnableMilestones}
                        />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="enableVendors">Trusted Vendors</Label>
                            <p className="text-sm text-muted-foreground">
                                Share your recommended service providers
                            </p>
                        </div>
                        <Switch
                            id="enableVendors"
                            checked={enableVendors}
                            onCheckedChange={setEnableVendors}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Transaction Milestones Section */}
            {enableMilestones && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Transaction Milestones</CardTitle>
                                <CardDescription>
                                    Track key dates and progress
                                </CardDescription>
                            </div>
                            <Button variant="outline" size="sm" onClick={handleAddMilestone}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Milestone
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {milestones.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No milestones added yet.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {milestones.map((milestone, index) => (
                                    <div key={milestone.id} className="flex gap-4 items-start border p-4 rounded-lg">
                                        <div className="flex-1 grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label>Title</Label>
                                                <Input
                                                    value={milestone.title}
                                                    onChange={(e) => handleUpdateMilestone(milestone.id, 'title', e.target.value)}
                                                    placeholder="e.g. Inspection"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Date</Label>
                                                <Input
                                                    type="date"
                                                    value={milestone.date}
                                                    onChange={(e) => handleUpdateMilestone(milestone.id, 'date', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Status</Label>
                                                <Select
                                                    value={milestone.status}
                                                    onValueChange={(value) => handleUpdateMilestone(milestone.id, 'status', value)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="pending">Pending</SelectItem>
                                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                                        <SelectItem value="completed">Completed</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Description (Optional)</Label>
                                                <Input
                                                    value={milestone.description || ''}
                                                    onChange={(e) => handleUpdateMilestone(milestone.id, 'description', e.target.value)}
                                                    placeholder="Details..."
                                                />
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemoveMilestone(milestone.id)}
                                            className="text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Trusted Vendors Section */}
            {enableVendors && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Trusted Vendors</CardTitle>
                                <CardDescription>
                                    Share recommended service providers
                                </CardDescription>
                            </div>
                            <Button variant="outline" size="sm" onClick={handleAddVendor}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Vendor
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {vendors.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No vendors added yet.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {vendors.map((vendor, index) => (
                                    <div key={vendor.id} className="flex gap-4 items-start border p-4 rounded-lg">
                                        <div className="flex-1 grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label>Name</Label>
                                                <Input
                                                    value={vendor.name}
                                                    onChange={(e) => handleUpdateVendor(vendor.id, 'name', e.target.value)}
                                                    placeholder="Company Name"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Category</Label>
                                                <Input
                                                    value={vendor.category}
                                                    onChange={(e) => handleUpdateVendor(vendor.id, 'category', e.target.value)}
                                                    placeholder="e.g. Inspector, Mover"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Phone</Label>
                                                <Input
                                                    value={vendor.phone || ''}
                                                    onChange={(e) => handleUpdateVendor(vendor.id, 'phone', e.target.value)}
                                                    placeholder="(555) 123-4567"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Email</Label>
                                                <Input
                                                    value={vendor.email || ''}
                                                    onChange={(e) => handleUpdateVendor(vendor.id, 'email', e.target.value)}
                                                    placeholder="contact@example.com"
                                                />
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemoveVendor(vendor.id)}
                                            className="text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}



            {/* Client Valuations Section */}
            {
                enableHomeValuation && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Client Valuations</CardTitle>
                            <CardDescription>
                                Home valuations generated by the client
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoadingValuations ? (
                                <div className="space-y-2">
                                    <StandardSkeleton variant="card" />
                                    <StandardSkeleton variant="card" />
                                </div>
                            ) : valuations.length > 0 ? (
                                <div className="space-y-4">
                                    {valuations.map((valuation) => (
                                        <div key={valuation.id} className="border rounded-lg p-4">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <h4 className="font-medium">
                                                        {valuation.propertyAnalysis?.address || valuation.propertyDescription}
                                                    </h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        Generated {formatDistanceToNow(new Date(valuation.generatedAt), { addSuffix: true })}
                                                    </p>
                                                </div>
                                                <Badge variant={
                                                    valuation.marketValuation.confidenceLevel === 'high' ? 'default' :
                                                        valuation.marketValuation.confidenceLevel === 'medium' ? 'secondary' : 'outline'
                                                }>
                                                    {valuation.marketValuation.confidenceLevel.toUpperCase()} Confidence
                                                </Badge>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 mt-4">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Estimated Value</p>
                                                    <p className="text-lg font-bold">
                                                        ${valuation.marketValuation.estimatedValue.toLocaleString()}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Value Range</p>
                                                    <p className="text-sm font-medium">
                                                        ${valuation.marketValuation.valueRange.low.toLocaleString()} - ${valuation.marketValuation.valueRange.high.toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    No valuations generated yet.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )
            }

            {/* CMA Report Builder Section */}
            {
                enableCMA && (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>CMA Report Builder</CardTitle>
                                    <CardDescription>
                                        Create a comparative market analysis for your client
                                    </CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    {cmaReport && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowCMAPreview(true)}
                                        >
                                            <Eye className="h-4 w-4 mr-2" />
                                            Preview
                                        </Button>
                                    )}
                                    <Button
                                        size="sm"
                                        onClick={handleSaveCMA}
                                        disabled={isSavingCMA}
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        {isSavingCMA ? 'Saving...' : cmaReport ? 'Update CMA' : 'Save CMA'}
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Subject Property */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Subject Property</h3>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="subjectAddress">Property Address *</Label>
                                        <Input
                                            id="subjectAddress"
                                            value={subjectAddress}
                                            onChange={(e) => setSubjectAddress(e.target.value)}
                                            placeholder="123 Main St, City, State 12345"
                                        />
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="subjectBeds">Bedrooms</Label>
                                            <Input
                                                id="subjectBeds"
                                                type="number"
                                                min="0"
                                                value={subjectBeds}
                                                onChange={(e) => setSubjectBeds(parseInt(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="subjectBaths">Bathrooms</Label>
                                            <Input
                                                id="subjectBaths"
                                                type="number"
                                                min="0"
                                                step="0.5"
                                                value={subjectBaths}
                                                onChange={(e) => setSubjectBaths(parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="subjectSqft">Square Feet</Label>
                                            <Input
                                                id="subjectSqft"
                                                type="number"
                                                min="0"
                                                value={subjectSqft}
                                                onChange={(e) => setSubjectSqft(parseInt(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="subjectYearBuilt">Year Built</Label>
                                            <Input
                                                id="subjectYearBuilt"
                                                type="number"
                                                min="1800"
                                                max={new Date().getFullYear()}
                                                value={subjectYearBuilt}
                                                onChange={(e) => setSubjectYearBuilt(parseInt(e.target.value) || 2000)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Comparable Properties */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold">Comparable Properties (3-5 required)</h3>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleAddComparable}
                                        disabled={comparables.length >= 5}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Comparable
                                    </Button>
                                </div>
                                {comparables.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <p>No comparable properties added yet.</p>
                                        <p className="text-sm">Click "Add Comparable" to get started.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {comparables.map((comp, index) => (
                                            <Card key={index}>
                                                <CardContent className="pt-6">
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <h4 className="font-medium">Comparable #{index + 1}</h4>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleRemoveComparable(index)}
                                                            >
                                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                            </Button>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Address</Label>
                                                            <Input
                                                                value={comp.address}
                                                                onChange={(e) =>
                                                                    handleUpdateComparable(index, 'address', e.target.value)
                                                                }
                                                                placeholder="456 Oak Ave, City, State 12345"
                                                            />
                                                        </div>
                                                        <div className="grid gap-4 md:grid-cols-3">
                                                            <div className="space-y-2">
                                                                <Label>Sold Price</Label>
                                                                <Input
                                                                    type="number"
                                                                    min="0"
                                                                    value={comp.soldPrice}
                                                                    onChange={(e) =>
                                                                        handleUpdateComparable(
                                                                            index,
                                                                            'soldPrice',
                                                                            parseInt(e.target.value) || 0
                                                                        )
                                                                    }
                                                                    placeholder="$"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label>Sold Date</Label>
                                                                <Input
                                                                    type="date"
                                                                    value={comp.soldDate}
                                                                    onChange={(e) =>
                                                                        handleUpdateComparable(index, 'soldDate', e.target.value)
                                                                    }
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label>Distance (miles)</Label>
                                                                <Input
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.1"
                                                                    value={comp.distance}
                                                                    onChange={(e) =>
                                                                        handleUpdateComparable(
                                                                            index,
                                                                            'distance',
                                                                            parseFloat(e.target.value) || 0
                                                                        )
                                                                    }
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="grid gap-4 md:grid-cols-3">
                                                            <div className="space-y-2">
                                                                <Label>Bedrooms</Label>
                                                                <Input
                                                                    type="number"
                                                                    min="0"
                                                                    value={comp.beds}
                                                                    onChange={(e) =>
                                                                        handleUpdateComparable(
                                                                            index,
                                                                            'beds',
                                                                            parseInt(e.target.value) || 0
                                                                        )
                                                                    }
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label>Bathrooms</Label>
                                                                <Input
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.5"
                                                                    value={comp.baths}
                                                                    onChange={(e) =>
                                                                        handleUpdateComparable(
                                                                            index,
                                                                            'baths',
                                                                            parseFloat(e.target.value) || 0
                                                                        )
                                                                    }
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label>Square Feet</Label>
                                                                <Input
                                                                    type="number"
                                                                    min="0"
                                                                    value={comp.sqft}
                                                                    onChange={(e) =>
                                                                        handleUpdateComparable(
                                                                            index,
                                                                            'sqft',
                                                                            parseInt(e.target.value) || 0
                                                                        )
                                                                    }
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <Separator />

                            {/* Market Trends */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Market Trends</h3>
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="medianPrice">Median Price</Label>
                                        <Input
                                            id="medianPrice"
                                            type="number"
                                            min="0"
                                            value={medianPrice}
                                            onChange={(e) => setMedianPrice(parseInt(e.target.value) || 0)}
                                            placeholder="$"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="daysOnMarket">Days on Market</Label>
                                        <Input
                                            id="daysOnMarket"
                                            type="number"
                                            min="0"
                                            value={daysOnMarket}
                                            onChange={(e) => setDaysOnMarket(parseInt(e.target.value) || 0)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="inventoryLevel">Inventory Level</Label>
                                        <Select
                                            value={inventoryLevel}
                                            onValueChange={(value: 'low' | 'medium' | 'high') =>
                                                setInventoryLevel(value)
                                            }
                                        >
                                            <SelectTrigger id="inventoryLevel">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="low">Low</SelectItem>
                                                <SelectItem value="medium">Medium</SelectItem>
                                                <SelectItem value="high">High</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Price Recommendation */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Price Recommendation</h3>
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="priceLow">Low Estimate</Label>
                                        <Input
                                            id="priceLow"
                                            type="number"
                                            min="0"
                                            value={priceLow}
                                            onChange={(e) => setPriceLow(parseInt(e.target.value) || 0)}
                                            placeholder="$"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="priceMid">Mid Estimate</Label>
                                        <Input
                                            id="priceMid"
                                            type="number"
                                            min="0"
                                            value={priceMid}
                                            onChange={(e) => setPriceMid(parseInt(e.target.value) || 0)}
                                            placeholder="$"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="priceHigh">High Estimate</Label>
                                        <Input
                                            id="priceHigh"
                                            type="number"
                                            min="0"
                                            value={priceHigh}
                                            onChange={(e) => setPriceHigh(parseInt(e.target.value) || 0)}
                                            placeholder="$"
                                        />
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Agent Notes */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Agent Notes / Commentary</h3>
                                <Textarea
                                    value={agentNotes}
                                    onChange={(e) => setAgentNotes(e.target.value)}
                                    placeholder="Add your professional insights and recommendations for the client..."
                                    rows={6}
                                />
                            </div>
                        </CardContent>
                    </Card>
                )
            }

            {/* Documents Section */}
            {
                enableDocuments && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Documents</CardTitle>
                            <CardDescription>
                                Upload and manage documents to share with your client
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Drag and Drop Upload Area */}
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`
                                border-2 border-dashed rounded-lg p-8 text-center transition-colors
                                ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
                                ${isUploadingDocument ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:border-primary hover:bg-primary/5'}
                            `}
                                onClick={() => document.getElementById('document-upload')?.click()}
                            >
                                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                <p className="text-sm font-medium mb-1">
                                    {isUploadingDocument ? 'Uploading...' : 'Drop files here or click to upload'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    PDF, DOCX, XLSX, PNG, JPG, JPEG (max 25MB)
                                </p>
                                <input
                                    id="document-upload"
                                    type="file"
                                    accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg"
                                    onChange={(e) => handleDocumentUpload(e.target.files)}
                                    disabled={isUploadingDocument}
                                    className="hidden"
                                />
                            </div>

                            {/* Document List */}
                            {isLoadingDocuments ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <p>Loading documents...</p>
                                </div>
                            ) : documents.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <p>No documents uploaded yet.</p>
                                    <p className="text-sm">Upload documents to share with your client.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium mb-3">Uploaded Documents ({documents.length})</h4>
                                    {documents.map((doc) => (
                                        <div
                                            key={doc.id}
                                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <span className="text-2xl">{getFileTypeIcon(doc.contentType)}</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium truncate">{doc.fileName}</p>
                                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                        <span>{formatFileSize(doc.fileSize)}</span>
                                                        <span>•</span>
                                                        <span>
                                                            {new Date(doc.uploadedAt).toLocaleDateString()}
                                                        </span>
                                                        <span>•</span>
                                                        <span className="capitalize">
                                                            {doc.contentType.split('/')[1].replace('vnd.openxmlformats-officedocument.', '').replace('ml.', '')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleRemoveDocument(doc.id)}
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )
            }

            {/* Branding Configuration Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Branding Configuration</CardTitle>
                    <CardDescription>
                        Customize the look and feel of the client dashboard
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="logo">Agent Logo</Label>
                        <div className="flex items-center gap-4">
                            {logoUrl && (
                                <div className="relative w-24 h-24 border rounded-lg overflow-hidden">
                                    <img
                                        src={logoUrl}
                                        alt="Logo"
                                        className="w-full h-full object-cover"
                                    />
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-1 right-1 h-6 w-6"
                                        onClick={() => {
                                            setLogoUrl('');
                                            setLogoS3Key('');
                                        }}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            )}
                            <div>
                                <Input
                                    id="logo"
                                    type="file"
                                    accept="image/jpeg,image/png,image/jpg"
                                    onChange={handleLogoUpload}
                                    disabled={isUploading}
                                    className="max-w-xs"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Upload a logo (max 5MB, will be resized to 200x200)
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="primaryColor">Primary Color</Label>
                        <div className="flex items-center gap-4">
                            <Input
                                id="primaryColor"
                                type="color"
                                value={primaryColor}
                                onChange={(e) => setPrimaryColor(e.target.value)}
                                className="w-20 h-10"
                            />
                            <Input
                                type="text"
                                value={primaryColor}
                                onChange={(e) => setPrimaryColor(e.target.value)}
                                placeholder="#3b82f6"
                                className="max-w-xs"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="welcomeMessage">Welcome Message *</Label>
                        <Textarea
                            id="welcomeMessage"
                            value={welcomeMessage}
                            onChange={(e) => setWelcomeMessage(e.target.value)}
                            placeholder="Welcome to your personalized real estate dashboard..."
                            rows={3}
                        />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="agentPhone">Agent Phone *</Label>
                            <Input
                                id="agentPhone"
                                type="tel"
                                value={agentPhone}
                                onChange={(e) => setAgentPhone(e.target.value)}
                                placeholder="(555) 123-4567"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="agentEmail">Agent Email *</Label>
                            <Input
                                id="agentEmail"
                                type="email"
                                value={agentEmail}
                                onChange={(e) => setAgentEmail(e.target.value)}
                                placeholder="agent@example.com"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Secured Link Management Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Secured Link Management</CardTitle>
                    <CardDescription>
                        Generate and manage access links for this dashboard
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {currentLink ? (
                        <div className="space-y-4">
                            <div className="p-4 border rounded-lg bg-muted/50">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium mb-1">Active Link</p>
                                        <p className="text-xs text-muted-foreground break-all">
                                            {currentLink.link}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            Expires {formatDistanceToNow(new Date(currentLink.expiresAt), { addSuffix: true })}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={handleCopyLink}
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => window.open(currentLink.link, '_blank')}
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="destructive"
                                    onClick={handleRevokeLink}
                                >
                                    <Ban className="h-4 w-4 mr-2" />
                                    Revoke Link
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleViewAnalytics}
                                >
                                    <BarChart3 className="h-4 w-4 mr-2" />
                                    View Analytics
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="expirationDays">Link Expiration</Label>
                                <Select
                                    value={expirationDays.toString()}
                                    onValueChange={(value) => setExpirationDays(parseInt(value))}
                                >
                                    <SelectTrigger id="expirationDays">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="7">7 days</SelectItem>
                                        <SelectItem value="14">14 days</SelectItem>
                                        <SelectItem value="30">30 days</SelectItem>
                                        <SelectItem value="60">60 days</SelectItem>
                                        <SelectItem value="90">90 days</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={handleGenerateLink}>
                                <LinkIcon className="h-4 w-4 mr-2" />
                                Generate Secured Link
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Analytics Dialog */}
            {/* Analytics Dialog */}
            <Dialog open={showAnalyticsDialog} onOpenChange={setShowAnalyticsDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Dashboard Analytics</DialogTitle>
                        <DialogDescription>
                            View engagement metrics for this dashboard
                        </DialogDescription>
                    </DialogHeader>
                    {analytics && (
                        <div className="space-y-4">
                            <div className="grid gap-4 grid-cols-2">
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="text-2xl font-bold">{analytics.views}</div>
                                        <p className="text-xs text-muted-foreground">Total Views</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="text-2xl font-bold">{analytics.propertyViews.length}</div>
                                        <p className="text-xs text-muted-foreground">Property Views</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="text-2xl font-bold">{analytics.documentDownloads.length}</div>
                                        <p className="text-xs text-muted-foreground">Document Downloads</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="text-2xl font-bold">{analytics.valuationRequests?.length || 0}</div>
                                        <p className="text-xs text-muted-foreground">Valuation Requests</p>
                                    </CardContent>
                                </Card>
                            </div>
                            {analytics.lastViewedAt && (
                                <div className="text-sm text-muted-foreground">
                                    Last viewed {formatDistanceToNow(new Date(analytics.lastViewedAt), { addSuffix: true })}
                                </div>
                            )}

                            {/* Contact Requests */}
                            {analytics.contactRequests.length > 0 && (
                                <div>
                                    <h4 className="font-medium mb-2">Contact Requests</h4>
                                    <div className="space-y-2">
                                        {analytics.contactRequests.map((request, index) => (
                                            <div key={index} className="p-3 border rounded-lg">
                                                <div className="flex items-center justify-between mb-1">
                                                    <Badge variant="outline">{request.type}</Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatDistanceToNow(new Date(request.requestedAt), { addSuffix: true })}
                                                    </span>
                                                </div>
                                                <p className="text-sm">{request.message}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Recent Valuations */}
                            {analytics.valuationRequests && analytics.valuationRequests.length > 0 && (
                                <div>
                                    <h4 className="font-medium mb-2">Recent Valuations</h4>
                                    <div className="space-y-2">
                                        {analytics.valuationRequests.map((request, index) => (
                                            <div key={index} className="p-3 border rounded-lg">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-medium text-sm truncate max-w-[200px]">
                                                        {request.propertyDescription}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatDistanceToNow(new Date(request.requestedAt), { addSuffix: true })}
                                                    </span>
                                                </div>
                                                <p className="text-sm font-bold">
                                                    ${request.estimatedValue.toLocaleString()}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={() => setShowAnalyticsDialog(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* CMA Preview Dialog */}
            < Dialog open={showCMAPreview} onOpenChange={setShowCMAPreview} >
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>CMA Report Preview</DialogTitle>
                        <DialogDescription>
                            Preview how the CMA report will appear to your client
                        </DialogDescription>
                    </DialogHeader>
                    {subjectAddress && comparables.length > 0 && (
                        <div className="space-y-6">
                            {/* Subject Property */}
                            <div>
                                <h3 className="text-lg font-semibold mb-3">Subject Property</h3>
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="space-y-2">
                                            <p className="font-medium">{subjectAddress}</p>
                                            <div className="grid grid-cols-4 gap-4 text-sm">
                                                <div>
                                                    <span className="text-muted-foreground">Beds:</span>{' '}
                                                    <span className="font-medium">{subjectBeds}</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Baths:</span>{' '}
                                                    <span className="font-medium">{subjectBaths}</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Sqft:</span>{' '}
                                                    <span className="font-medium">
                                                        {subjectSqft.toLocaleString()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Built:</span>{' '}
                                                    <span className="font-medium">{subjectYearBuilt}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Price Recommendation */}
                            <div>
                                <h3 className="text-lg font-semibold mb-3">Price Recommendation</h3>
                                <Card className="bg-primary/5">
                                    <CardContent className="pt-6">
                                        <div className="grid grid-cols-3 gap-4 text-center">
                                            <div>
                                                <p className="text-sm text-muted-foreground mb-1">Low</p>
                                                <p className="text-2xl font-bold">
                                                    ${priceLow.toLocaleString()}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground mb-1">Mid</p>
                                                <p className="text-3xl font-bold text-primary">
                                                    ${priceMid.toLocaleString()}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground mb-1">High</p>
                                                <p className="text-2xl font-bold">
                                                    ${priceHigh.toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Comparable Properties */}
                            <div>
                                <h3 className="text-lg font-semibold mb-3">Comparable Properties</h3>
                                <div className="space-y-3">
                                    {comparables.map((comp, index) => (
                                        <Card key={index}>
                                            <CardContent className="pt-6">
                                                <div className="flex items-start justify-between">
                                                    <div className="space-y-1">
                                                        <p className="font-medium">{comp.address}</p>
                                                        <div className="flex gap-4 text-sm text-muted-foreground">
                                                            <span>{comp.beds} beds</span>
                                                            <span>{comp.baths} baths</span>
                                                            <span>{comp.sqft.toLocaleString()} sqft</span>
                                                            <span>{comp.distance} mi away</span>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">
                                                            Sold on {new Date(comp.soldDate).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xl font-bold">
                                                            ${comp.soldPrice.toLocaleString()}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            ${Math.round(comp.soldPrice / comp.sqft)}/sqft
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>

                            {/* Market Trends */}
                            <div>
                                <h3 className="text-lg font-semibold mb-3">Market Trends</h3>
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <p className="text-sm text-muted-foreground mb-1">Median Price</p>
                                                <p className="text-xl font-bold">
                                                    ${medianPrice.toLocaleString()}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground mb-1">Days on Market</p>
                                                <p className="text-xl font-bold">{daysOnMarket}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground mb-1">Inventory Level</p>
                                                <Badge
                                                    variant={
                                                        inventoryLevel === 'low'
                                                            ? 'destructive'
                                                            : inventoryLevel === 'high'
                                                                ? 'default'
                                                                : 'secondary'
                                                    }
                                                >
                                                    {inventoryLevel.toUpperCase()}
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Agent Notes */}
                            {agentNotes && (
                                <div>
                                    <h3 className="text-lg font-semibold mb-3">Agent Commentary</h3>
                                    <Card>
                                        <CardContent className="pt-6">
                                            <p className="text-sm whitespace-pre-wrap">{agentNotes}</p>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={() => setShowCMAPreview(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog >
            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Dashboard</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this dashboard? This action cannot be undone and will revoke all active links.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleDeleteDashboard();
                            }}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div >
    );
}
