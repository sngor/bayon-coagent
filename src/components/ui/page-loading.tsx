'use client';

import { Loader2, Sparkles, PenTool, BrainCircuit, User, Calculator, Library, MessageSquare } from 'lucide-react';

// Simple Loading Component with Blur Gradient Mesh
function BaseLoadingScreen({
    icon: Icon,
    title,
    description,
    variant = "primary"
}: {
    icon: any;
    title: string;
    description: string;
    variant?: "primary" | "studio" | "research" | "brand" | "market" | "tools" | "library" | "assistant";
}) {
    const variants = {
        primary: {
            bg1: "bg-gradient-to-br from-primary/20 to-purple-500/20",
            bg2: "bg-gradient-to-bl from-purple-500/15 to-primary/15",
            bg3: "bg-gradient-to-tr from-primary/10 to-purple-500/10",
            icon: "bg-gradient-to-br from-primary to-purple-500"
        },
        studio: {
            bg1: "bg-gradient-to-br from-orange-500/20 to-red-500/20",
            bg2: "bg-gradient-to-bl from-red-500/15 to-orange-500/15",
            bg3: "bg-gradient-to-tr from-orange-500/10 to-red-500/10",
            icon: "bg-gradient-to-br from-orange-500 to-red-500"
        },
        research: {
            bg1: "bg-gradient-to-br from-blue-500/20 to-cyan-500/20",
            bg2: "bg-gradient-to-bl from-cyan-500/15 to-blue-500/15",
            bg3: "bg-gradient-to-tr from-blue-500/10 to-cyan-500/10",
            icon: "bg-gradient-to-br from-blue-500 to-cyan-500"
        },
        brand: {
            bg1: "bg-gradient-to-br from-green-500/20 to-emerald-500/20",
            bg2: "bg-gradient-to-bl from-emerald-500/15 to-green-500/15",
            bg3: "bg-gradient-to-tr from-green-500/10 to-emerald-500/10",
            icon: "bg-gradient-to-br from-green-500 to-emerald-500"
        },
        market: {
            bg1: "bg-gradient-to-br from-indigo-500/20 to-purple-600/20",
            bg2: "bg-gradient-to-bl from-purple-600/15 to-indigo-500/15",
            bg3: "bg-gradient-to-tr from-indigo-500/10 to-purple-600/10",
            icon: "bg-gradient-to-br from-indigo-500 to-purple-600"
        },
        tools: {
            bg1: "bg-gradient-to-br from-yellow-500/20 to-orange-500/20",
            bg2: "bg-gradient-to-bl from-orange-500/15 to-yellow-500/15",
            bg3: "bg-gradient-to-tr from-yellow-500/10 to-orange-500/10",
            icon: "bg-gradient-to-br from-yellow-500 to-orange-500"
        },
        library: {
            bg1: "bg-gradient-to-br from-violet-500/20 to-pink-500/20",
            bg2: "bg-gradient-to-bl from-pink-500/15 to-violet-500/15",
            bg3: "bg-gradient-to-tr from-violet-500/10 to-pink-500/10",
            icon: "bg-gradient-to-br from-violet-500 to-pink-500"
        },
        assistant: {
            bg1: "bg-gradient-to-br from-teal-500/20 to-blue-600/20",
            bg2: "bg-gradient-to-bl from-blue-600/15 to-teal-500/15",
            bg3: "bg-gradient-to-tr from-teal-500/10 to-blue-600/10",
            icon: "bg-gradient-to-br from-teal-500 to-blue-600"
        }
    };

    const colors = variants[variant];

    return (
        <div className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
            {/* Blur Gradient Mesh Background */}
            <div className="absolute inset-0 -z-10">
                <div className={`absolute top-0 left-0 w-96 h-96 ${colors.bg1} rounded-full blur-3xl`} />
                <div className={`absolute top-1/2 right-0 w-80 h-80 ${colors.bg2} rounded-full blur-3xl`} />
                <div className={`absolute bottom-0 left-1/3 w-72 h-72 ${colors.bg3} rounded-full blur-3xl`} />
            </div>

            {/* Content */}
            <div className="relative z-10 text-center space-y-6 max-w-md mx-auto px-6">
                {/* Icon */}
                <div className={`mx-auto w-16 h-16 rounded-2xl ${colors.icon} flex items-center justify-center shadow-xl`}>
                    <Icon className="w-8 h-8 text-white" />
                </div>

                {/* Single Loading Animation */}
                <div className="flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>

                {/* Text Content */}
                <div className="space-y-2">
                    <h2 className="text-xl font-semibold text-foreground/90">{title}</h2>
                    <p className="text-sm text-muted-foreground">{description}</p>
                </div>
            </div>
        </div>
    );
}

// Dashboard Loading
export function DashboardLoading() {
    return (
        <BaseLoadingScreen
            icon={Sparkles}
            title="Loading Dashboard"
            description="Preparing your performance insights and AI recommendations"
            variant="primary"
        />
    );
}

// Studio Write Loading
export function StudioWriteLoading() {
    return (
        <BaseLoadingScreen
            icon={PenTool}
            title="Loading Studio"
            description="Setting up your AI content creation workspace"
            variant="studio"
        />
    );
}

// Research Agent Loading
export function ResearchAgentLoading() {
    return (
        <BaseLoadingScreen
            icon={BrainCircuit}
            title="Loading Research Agent"
            description="Preparing AI-powered research tools and knowledge base"
            variant="research"
        />
    );
}

// Brand Profile Loading
export function BrandProfileLoading() {
    return (
        <BaseLoadingScreen
            icon={User}
            title="Loading Brand Profile"
            description="Setting up your professional profile and brand identity"
            variant="brand"
        />
    );
}

// Market Intelligence Loading
export function MarketIntelligenceLoading() {
    return (
        <BaseLoadingScreen
            icon={Sparkles}
            title="Loading Market Intelligence"
            description="Analyzing market trends and opportunities"
            variant="market"
        />
    );
}

// Tools Calculator Loading
export function ToolsCalculatorLoading() {
    return (
        <BaseLoadingScreen
            icon={Calculator}
            title="Loading Calculator Tools"
            description="Setting up mortgage and ROI calculation tools"
            variant="tools"
        />
    );
}

// Library Content Loading
export function LibraryContentLoading() {
    return (
        <BaseLoadingScreen
            icon={Library}
            title="Loading Library"
            description="Organizing your content, reports, and media files"
            variant="library"
        />
    );
}

// Assistant Chat Loading
export function AssistantChatLoading() {
    return (
        <BaseLoadingScreen
            icon={MessageSquare}
            title="Loading AI Assistant"
            description="Connecting to your intelligent real estate assistant"
            variant="assistant"
        />
    );
}