'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Phone, Mail, MessageSquare, CheckCircle2, Clock, ExternalLink, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MortgageCalculator } from '@/components/mortgage-calculator';
import { RenovationROICalculator } from '@/components/renovation-roi-calculator';
import { RentalPotentialCalculator } from '@/components/rental-potential-calculator';
import { ClientDashboard, SecuredLink, listDashboardDocumentsForClient, type DashboardDocument } from '@/features/client-dashboards/actions/client-dashboard-actions';
import {
    CMAReportSkeleton,
    PropertySearchSkeleton,
    HomeValuationSkeleton,
    DocumentViewerSkeleton,
} from './loading-skeletons';
import { CreateAccountBanner } from './create-account-banner';

// Dynamic imports for heavy components with loading skeletons
const CMAReport = dynamic(() => import('./cma-report').then(mod => ({ default: mod.CMAReport })), {
    loading: () => <CMAReportSkeleton />,
    ssr: false,
});

const PropertySearch = dynamic(() => import('./property-search').then(mod => ({ default: mod.PropertySearch })), {
    loading: () => <PropertySearchSkeleton />,
    ssr: false,
});

const HomeValuation = dynamic(() => import('./home-valuation').then(mod => ({ default: mod.HomeValuation })), {
    loading: () => <HomeValuationSkeleton />,
    ssr: false,
});

const DocumentViewer = dynamic(() => import('./document-viewer').then(mod => ({ default: mod.DocumentViewer })), {
    loading: () => <DocumentViewerSkeleton />,
    ssr: false,
});

const ContactForm = dynamic(() => import('./contact-form').then(mod => ({ default: mod.ContactForm })), {
    ssr: false,
});

interface ClientDashboardViewProps {
    dashboard: ClientDashboard;
    link: SecuredLink;
    token: string;
}

/**
 * Client Dashboard View Component
 * 
 * Displays a branded client dashboard with conditional sections based on enabled features.
 * Includes:
 * - Branded header with agent logo, name, and contact info
 * - Prominent "Contact Agent" button
 * - Conditional sections (CMA, Property Search, Home Valuation, Documents)
 * - Footer with agent branding
 * - Responsive design for mobile viewing
 * 
 * Requirements: 4.1, 8.1, 8.2
 */
export function ClientDashboardView({ dashboard, link, token }: ClientDashboardViewProps) {
    const [showContactModal, setShowContactModal] = useState(false);
    const [documents, setDocuments] = useState<DashboardDocument[]>([]);
    const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
    const { branding, clientInfo, dashboardConfig } = dashboard;

    // Load documents when component mounts (if documents are enabled)
    useEffect(() => {
        if (dashboardConfig.enableDocuments) {
            loadDocuments();
        }
    }, [dashboardConfig.enableDocuments, token]);

    const loadDocuments = async () => {
        setIsLoadingDocuments(true);
        try {
            const result = await listDashboardDocumentsForClient(token);
            if (result.message === 'success' && result.data) {
                setDocuments(result.data);
            }
        } catch (error) {
            console.error('Failed to load documents:', error);
        } finally {
            setIsLoadingDocuments(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            {/* Branded Header */}
            <header
                className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 shadow-sm"
                style={{
                    borderBottomColor: `${branding.primaryColor}20`,
                }}
            >
                <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between gap-4">
                        {/* Logo and Agent Info */}
                        <div className="flex items-center gap-4">
                            {branding.logoUrl && (
                                <div
                                    className="flex-shrink-0 h-12 w-12 sm:h-16 sm:w-16 rounded-lg overflow-hidden shadow-md"
                                    style={{
                                        borderColor: branding.primaryColor,
                                        borderWidth: '2px',
                                    }}
                                >
                                    <img
                                        src={branding.logoUrl}
                                        alt="Agent Logo"
                                        className="h-full w-full object-cover"
                                        loading="eager"
                                    />
                                </div>
                            )}
                            <div className="min-w-0">
                                <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                                    Welcome, {clientInfo.name.split(' ')[0]}!
                                </h1>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm text-gray-600 dark:text-gray-400">
                                    <a
                                        href={`tel:${branding.agentContact.phone}`}
                                        className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-white transition-colors"
                                    >
                                        <Phone className="h-3.5 w-3.5" />
                                        <span className="truncate">{branding.agentContact.phone}</span>
                                    </a>
                                    <span className="hidden sm:inline text-gray-300 dark:text-gray-700">•</span>
                                    <a
                                        href={`mailto:${branding.agentContact.email}`}
                                        className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-white transition-colors"
                                    >
                                        <Mail className="h-3.5 w-3.5" />
                                        <span className="truncate">{branding.agentContact.email}</span>
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Contact Agent Button - Prominent */}
                        <Button
                            onClick={() => setShowContactModal(true)}
                            className="flex-shrink-0 shadow-lg hover:shadow-xl transition-all"
                            style={{
                                backgroundColor: branding.primaryColor,
                                color: '#ffffff',
                            }}
                            size="lg"
                        >
                            <MessageSquare className="h-5 w-5" />
                            <span className="hidden sm:inline">Contact Agent</span>
                            <span className="sm:hidden">Contact</span>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
                {/* Welcome Message */}
                <div
                    className="mb-8 rounded-xl p-6 sm:p-8 shadow-lg"
                    style={{
                        backgroundColor: `${branding.primaryColor}10`,
                        borderLeft: `4px solid ${branding.primaryColor}`,
                    }}
                >
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
                        {branding.welcomeMessage}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        Your personalized dashboard with everything you need for your real estate journey.
                    </p>
                </div>

                {/* Create Account Banner - Only shown if dashboard doesn't require auth */}
                {!dashboard.requiresAuth && (
                    <CreateAccountBanner
                        token={token}
                        primaryColor={branding.primaryColor}
                        clientName={clientInfo.name.split(' ')[0]}
                    />
                )}

                {/* Dashboard Sections - Conditional based on enabled features */}
                <div className="space-y-6">
                    {/* CMA Report Section */}
                    {dashboardConfig.enableCMA && (
                        <DashboardSection
                            title="Comparative Market Analysis"
                            description="View your custom market analysis report"
                            primaryColor={branding.primaryColor}
                            isEmpty={!dashboard.cmaData}
                            emptyMessage="Your agent will share a CMA report with you soon."
                        >
                            {dashboard.cmaData && (
                                <CMAReport
                                    subjectProperty={dashboard.cmaData.subjectProperty}
                                    comparables={dashboard.cmaData.comparables}
                                    marketTrends={dashboard.cmaData.marketTrends}
                                    priceRecommendation={dashboard.cmaData.priceRecommendation}
                                    agentNotes={dashboard.cmaData.agentNotes}
                                    primaryColor={branding.primaryColor}
                                    onContactAgent={() => setShowContactModal(true)}
                                />
                            )}
                        </DashboardSection>
                    )}

                    {/* Property Search Section */}
                    {dashboardConfig.enablePropertySearch && (
                        <DashboardSection
                            title="Property Search"
                            description="Search for properties that match your criteria"
                            primaryColor={branding.primaryColor}
                        >
                            <PropertySearch
                                token={token}
                                primaryColor={branding.primaryColor}
                                onContactAgent={() => setShowContactModal(true)}
                            />
                        </DashboardSection>
                    )}

                    {/* Home Valuation Section */}
                    {dashboardConfig.enableHomeValuation && (
                        <DashboardSection
                            title="Home Valuation"
                            description="Get an instant estimate of your home's value"
                            primaryColor={branding.primaryColor}
                        >
                            <HomeValuation
                                token={token}
                                primaryColor={branding.primaryColor}
                                onContactAgent={() => setShowContactModal(true)}
                            />
                        </DashboardSection>
                    )}

                    {/* Documents Section */}
                    {dashboardConfig.enableDocuments && (
                        <DashboardSection
                            title="Documents"
                            description="Access important documents shared by your agent"
                            primaryColor={branding.primaryColor}
                            isEmpty={!isLoadingDocuments && documents.length === 0}
                            emptyMessage="No documents have been shared yet."
                        >
                            {isLoadingDocuments ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-500 dark:text-gray-400">
                                        Loading documents...
                                    </p>
                                </div>
                            ) : (
                                <DocumentViewer
                                    token={token}
                                    documents={documents}
                                    primaryColor={branding.primaryColor}
                                />
                            )}
                        </DashboardSection>
                    )}

                    {/* Transaction Milestones Section */}
                    {dashboardConfig.enableMilestones && dashboard.milestones && (
                        <DashboardSection
                            title="Transaction Milestones"
                            description="Track the progress of your real estate journey"
                            primaryColor={branding.primaryColor}
                            isEmpty={dashboard.milestones.length === 0}
                            emptyMessage="No milestones have been set yet."
                        >
                            <div className="space-y-6">
                                {dashboard.milestones.map((milestone, index) => (
                                    <div key={milestone.id} className="relative flex gap-4">
                                        {/* Timeline Line */}
                                        {index !== dashboard.milestones!.length - 1 && (
                                            <div
                                                className="absolute left-[15px] top-8 bottom-[-24px] w-0.5 bg-gray-200 dark:bg-gray-700"
                                                aria-hidden="true"
                                            />
                                        )}

                                        {/* Status Icon */}
                                        <div className="flex-shrink-0 mt-1">
                                            {milestone.status === 'completed' ? (
                                                <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                                                    <CheckCircle2 className="h-5 w-5" />
                                                </div>
                                            ) : milestone.status === 'in_progress' ? (
                                                <div
                                                    className="h-8 w-8 rounded-full flex items-center justify-center text-white"
                                                    style={{ backgroundColor: branding.primaryColor }}
                                                >
                                                    <Clock className="h-5 w-5 animate-pulse" />
                                                </div>
                                            ) : (
                                                <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                                                    <div className="h-3 w-3 rounded-full bg-current" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 pt-1.5 pb-2">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                                                <h4 className={`font-semibold ${milestone.status === 'completed' ? 'text-gray-900 dark:text-white' :
                                                    milestone.status === 'in_progress' ? 'text-gray-900 dark:text-white' :
                                                        'text-gray-500 dark:text-gray-400'
                                                    }`}>
                                                    {milestone.title}
                                                </h4>
                                                {milestone.date && (
                                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                                        {new Date(milestone.date).toLocaleDateString(undefined, {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </span>
                                                )}
                                            </div>
                                            {milestone.description && (
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {milestone.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </DashboardSection>
                    )}

                    {/* Financial Calculators Section */}
                    {dashboardConfig.enableCalculators && (
                        <DashboardSection
                            title="Financial Tools"
                            description="Plan your finances with our integrated calculators"
                            primaryColor={branding.primaryColor}
                        >
                            <Tabs defaultValue="mortgage" className="w-full">
                                <TabsList className="grid w-full grid-cols-3 mb-6">
                                    <TabsTrigger value="mortgage">Mortgage Calculator</TabsTrigger>
                                    <TabsTrigger value="roi">Renovation ROI</TabsTrigger>
                                    <TabsTrigger value="rental">Rental Potential</TabsTrigger>
                                </TabsList>
                                <TabsContent value="mortgage">
                                    <div className="mt-4">
                                        <MortgageCalculator />
                                    </div>
                                </TabsContent>
                                <TabsContent value="roi">
                                    <div className="mt-4">
                                        <RenovationROICalculator />
                                    </div>
                                </TabsContent>
                                <TabsContent value="rental">
                                    <div className="mt-4">
                                        <RentalPotentialCalculator />
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </DashboardSection>
                    )}

                    {/* Trusted Vendors Section */}
                    {dashboardConfig.enableVendors && dashboard.vendors && (
                        <DashboardSection
                            title="Trusted Vendors"
                            description="Recommended service providers for your needs"
                            primaryColor={branding.primaryColor}
                            isEmpty={dashboard.vendors.length === 0}
                            emptyMessage="No vendors have been recommended yet."
                        >
                            <div className="grid gap-6 md:grid-cols-2">
                                {dashboard.vendors.map((vendor) => (
                                    <div
                                        key={vendor.id}
                                        className="border border-gray-200 dark:border-gray-800 rounded-lg p-5 hover:shadow-md transition-shadow bg-gray-50/50 dark:bg-gray-800/50"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                                    {vendor.name}
                                                </h4>
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 mt-1">
                                                    {vendor.category}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-2 text-sm">
                                            {vendor.phone && (
                                                <a
                                                    href={`tel:${vendor.phone}`}
                                                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                                >
                                                    <Phone className="h-4 w-4" />
                                                    {vendor.phone}
                                                </a>
                                            )}
                                            {vendor.email && (
                                                <a
                                                    href={`mailto:${vendor.email}`}
                                                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                                >
                                                    <Mail className="h-4 w-4" />
                                                    {vendor.email}
                                                </a>
                                            )}
                                            {vendor.website && (
                                                <a
                                                    href={vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                    Visit Website
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </DashboardSection>
                    )}

                    {/* No Features Enabled Message */}
                    {!dashboardConfig.enableCMA &&
                        !dashboardConfig.enablePropertySearch &&
                        !dashboardConfig.enableHomeValuation &&
                        !dashboardConfig.enableDocuments &&
                        !dashboardConfig.enableCalculators &&
                        !dashboardConfig.enableMilestones &&
                        !dashboardConfig.enableVendors && (
                            <div className="text-center py-12">
                                <p className="text-gray-600 dark:text-gray-400 text-lg">
                                    Your agent is setting up your dashboard. Check back soon!
                                </p>
                            </div>
                        )}
                </div>
            </main>

            {/* Footer with Agent Branding */}
            <footer className="mt-16 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            {branding.logoUrl && (
                                <div className="h-10 w-10 rounded-lg overflow-hidden">
                                    <img
                                        src={branding.logoUrl}
                                        alt="Agent Logo"
                                        className="h-full w-full object-cover"
                                        loading="lazy"
                                    />
                                </div>
                            )}
                            <div className="text-center sm:text-left">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    Powered by {clientInfo.name.split(' ')[0]}'s Agent
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500">
                                    Professional Real Estate Services
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <a
                                href={`tel:${branding.agentContact.phone}`}
                                className="hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                                {branding.agentContact.phone}
                            </a>
                            <span className="text-gray-300 dark:text-gray-700">•</span>
                            <a
                                href={`mailto:${branding.agentContact.email}`}
                                className="hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                                {branding.agentContact.email}
                            </a>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Contact Form Modal */}
            {showContactModal && (
                <ContactForm
                    token={token}
                    primaryColor={branding.primaryColor}
                    onClose={() => setShowContactModal(false)}
                    clientName={clientInfo.name}
                    clientEmail={clientInfo.email}
                    clientPhone={clientInfo.phone}
                />
            )}
        </div>
    );
}

/**
 * Dashboard Section Component
 * 
 * Reusable section component for dashboard content areas
 */
interface DashboardSectionProps {
    title: string;
    description: string;
    primaryColor: string;
    children?: React.ReactNode;
    isEmpty?: boolean;
    emptyMessage?: string;
}

function DashboardSection({
    title,
    description,
    primaryColor,
    children,
    isEmpty = false,
    emptyMessage,
}: DashboardSectionProps) {
    return (
        <section className="bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden">
            {/* Section Header */}
            <div
                className="px-6 py-4 border-b border-gray-200 dark:border-gray-800"
                style={{
                    borderLeftWidth: '4px',
                    borderLeftColor: primaryColor,
                }}
            >
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {description}
                </p>
            </div>

            {/* Section Content */}
            <div className="px-6 py-6">
                {isEmpty && emptyMessage ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-500">
                            {emptyMessage}
                        </p>
                    </div>
                ) : (
                    children
                )}
            </div>
        </section>
    );
}
