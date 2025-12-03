"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Lightbulb, Clock, Target, Eye, CheckCircle2, X, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface Opportunity {
    id: string;
    type: "trend" | "gap" | "timing" | "competitive";
    title: string;
    description: string;
    potentialImpact: number;
    confidence: number;
    status: "new" | "viewed" | "acted-on" | "dismissed";
    suggestions: Array<{
        title: string;
        description: string;
        actionUrl?: string;
    }>;
    supportingData: any[];
    createdAt: string;
    expiresAt?: string;
}

interface OpportunityDashboardProps {
    className?: string;
}

export function OpportunityDashboard({ className }: OpportunityDashboardProps) {
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | Opportunity["type"]>("all");
    const { toast } = useToast();

    useEffect(() => {
        fetchOpportunities();
    }, [filter]);

    const fetchOpportunities = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (filter !== "all") {
                params.append("type", filter);
            }
            params.append("status", "new,viewed");

            const response = await fetch(`/api/agentstrands/opportunities?${params}`);
            if (!response.ok) throw new Error("Failed to fetch opportunities");

            const data = await response.json();
            setOpportunities(data.opportunities || []);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load opportunities",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const updateOpportunityStatus = async (
        id: string,
        status: Opportunity["status"],
        outcome?: string
    ) => {
        try {
            const response = await fetch("/api/agentstrands/opportunities", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    opportunityId: id,
                    status,
                    outcome: outcome ? { action: outcome, result: "completed" } : undefined,
                }),
            });

            if (!response.ok) throw new Error("Failed to update opportunity");

            // Refresh opportunities
            fetchOpportunities();

            toast({
                title: "Opportunity updated",
                description: `Marked as ${status.replace("-", " ")}`,
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update opportunity",
                variant: "destructive",
            });
        }
    };

    const getTypeIcon = (type: Opportunity["type"]) => {
        switch (type) {
            case "trend":
                return <TrendingUp className="h-4 w-4" />;
            case "gap":
                return <Target className="h-4 w-4" />;
            case "timing":
                return <Clock className="h-4 w-4" />;
            case "competitive":
                return <Lightbulb className="h-4 w-4" />;
        }
    };

    const getTypeColor = (type: Opportunity["type"]) => {
        switch (type) {
            case "trend":
                return "bg-blue-500/10 text-blue-500 border-blue-500/20";
            case "gap":
                return "bg-purple-500/10 text-purple-500 border-purple-500/20";
            case "timing":
                return "bg-green-500/10 text-green-500 border-green-500/20";
            case "competitive":
                return "bg-orange-500/10 text-orange-500 border-orange-500/20";
        }
    };

    const getImpactLabel = (impact: number) => {
        if (impact >= 80) return { label: "High", color: "bg-red-500" };
        if (impact >= 50) return { label: "Medium", color: "bg-yellow-500" };
        return { label: "Low", color: "bg-green-500" };
    };

    if (isLoading) {
        return (
            <div className={cn("space-y-4", className)}>
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    const filteredOpportunities =
        filter === "all"
            ? opportunities
            : opportunities.filter((opp) => opp.type === filter);

    return (
        <div className={cn("space-y-6", className)}>
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Opportunities</h2>
                <p className="text-muted-foreground">
                    AI-detected opportunities to grow your business
                </p>
            </div>

            {/* Filters */}
            <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="trend">Trends</TabsTrigger>
                    <TabsTrigger value="gap">Gaps</TabsTrigger>
                    <TabsTrigger value="timing">Timing</TabsTrigger>
                    <TabsTrigger value="competitive">Competitive</TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Opportunities List */}
            {filteredOpportunities.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-lg font-medium">No opportunities found</p>
                        <p className="text-sm text-muted-foreground">
                            Check back later for new insights
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {filteredOpportunities.map((opportunity) => {
                        const impact = getImpactLabel(opportunity.potentialImpact);
                        return (
                            <Card key={opportunity.id} className="overflow-hidden">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    variant="outline"
                                                    className={cn("gap-1", getTypeColor(opportunity.type))}
                                                >
                                                    {getTypeIcon(opportunity.type)}
                                                    {opportunity.type}
                                                </Badge>
                                                <Badge variant="outline" className="gap-1">
                                                    <div className={cn("h-2 w-2 rounded-full", impact.color)} />
                                                    {impact.label} Impact
                                                </Badge>
                                                <Badge variant="outline">
                                                    {Math.round(opportunity.confidence)}% confidence
                                                </Badge>
                                            </div>
                                            <CardTitle className="text-xl">{opportunity.title}</CardTitle>
                                            <CardDescription>{opportunity.description}</CardDescription>
                                        </div>
                                        <div className="flex gap-2">
                                            {opportunity.status === "new" && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        updateOpportunityStatus(opportunity.id, "viewed")
                                                    }
                                                    title="Mark as viewed"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                    updateOpportunityStatus(opportunity.id, "dismissed")
                                                }
                                                title="Dismiss"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Suggestions */}
                                    {opportunity.suggestions.length > 0 && (
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-medium">Suggested Actions</h4>
                                            <div className="space-y-2">
                                                {opportunity.suggestions.map((suggestion, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="flex items-start gap-3 rounded-lg border p-3"
                                                    >
                                                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                                                        <div className="flex-1 space-y-1">
                                                            <p className="text-sm font-medium">{suggestion.title}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {suggestion.description}
                                                            </p>
                                                        </div>
                                                        {suggestion.actionUrl && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                asChild
                                                                onClick={() =>
                                                                    updateOpportunityStatus(
                                                                        opportunity.id,
                                                                        "acted-on",
                                                                        suggestion.title
                                                                    )
                                                                }
                                                            >
                                                                <a
                                                                    href={suggestion.actionUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    title="Take action"
                                                                    aria-label="Take action on this suggestion"
                                                                >
                                                                    <ExternalLink className="h-4 w-4" />
                                                                </a>
                                                            </Button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() =>
                                                updateOpportunityStatus(opportunity.id, "acted-on")
                                            }
                                            className="flex-1"
                                        >
                                            Take Action
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => updateOpportunityStatus(opportunity.id, "viewed")}
                                        >
                                            Save for Later
                                        </Button>
                                    </div>

                                    {/* Metadata */}
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                        <span>
                                            Created {new Date(opportunity.createdAt).toLocaleDateString()}
                                        </span>
                                        {opportunity.expiresAt && (
                                            <span>
                                                Expires {new Date(opportunity.expiresAt).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
