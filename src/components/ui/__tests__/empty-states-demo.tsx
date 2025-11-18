/**
 * Empty States Component Demo
 * 
 * This file demonstrates the usage of the empty state components
 * and can be used for manual testing and verification.
 */

import React from "react";
import {
    EmptyState,
    NoDataEmptyState,
    NoResultsEmptyState,
    FirstTimeUseEmptyState,
} from "../empty-states";
import {
    FileText,
    Search,
    Sparkles,
    ClipboardList,
    Users,
} from "lucide-react";

export function EmptyStatesDemo() {
    return (
        <div className="space-y-8 p-8">
            <div>
                <h2 className="text-2xl font-bold mb-4">Basic Empty State</h2>
                <EmptyState
                    icon={<FileText className="w-8 h-8 text-primary" />}
                    title="No documents found"
                    description="You haven't created any documents yet. Start by creating your first document to get organized."
                    action={{
                        label: "Create Document",
                        onClick: () => console.log("Create document clicked"),
                    }}
                />
            </div>

            <div>
                <h2 className="text-2xl font-bold mb-4">No Data Empty State</h2>
                <NoDataEmptyState
                    icon={<ClipboardList className="w-8 h-8 text-primary" />}
                    title="No marketing plans yet"
                    description="Create your first AI-powered marketing plan to start growing your real estate business."
                    action={{
                        label: "Generate Marketing Plan",
                        onClick: () => console.log("Generate plan clicked"),
                        variant: "ai",
                    }}
                />
            </div>

            <div>
                <h2 className="text-2xl font-bold mb-4">No Results Empty State</h2>
                <NoResultsEmptyState
                    icon={<Search className="w-8 h-8 text-muted-foreground" />}
                    searchTerm="luxury condos"
                    onClearSearch={() => console.log("Clear search clicked")}
                />
            </div>

            <div>
                <h2 className="text-2xl font-bold mb-4">
                    No Results (without search term)
                </h2>
                <NoResultsEmptyState
                    icon={<Search className="w-8 h-8 text-muted-foreground" />}
                />
            </div>

            <div>
                <h2 className="text-2xl font-bold mb-4">
                    First Time Use Empty State
                </h2>
                <FirstTimeUseEmptyState
                    icon={<Sparkles className="w-8 h-8 text-primary" />}
                    title="Welcome to Content Engine"
                    description="Generate professional marketing content powered by AI. Create blog posts, social media content, video scripts, and more in seconds."
                    action={{
                        label: "Start Creating",
                        onClick: () => console.log("Start creating clicked"),
                        variant: "ai",
                    }}
                    secondaryAction={{
                        label: "Learn More",
                        onClick: () => console.log("Learn more clicked"),
                    }}
                />
            </div>

            <div>
                <h2 className="text-2xl font-bold mb-4">
                    Empty State with Multiple Actions
                </h2>
                <EmptyState
                    icon={<Users className="w-8 h-8 text-primary" />}
                    title="No team members yet"
                    description="Invite team members to collaborate on your marketing campaigns and share insights."
                    action={{
                        label: "Invite Team Member",
                        onClick: () => console.log("Invite clicked"),
                    }}
                    secondaryAction={{
                        label: "Import Contacts",
                        onClick: () => console.log("Import clicked"),
                    }}
                />
            </div>

            <div>
                <h2 className="text-2xl font-bold mb-4">
                    Subtle Variant (for inline use)
                </h2>
                <NoResultsEmptyState
                    icon={<Search className="w-6 h-6 text-muted-foreground" />}
                    searchTerm="test query"
                    onClearSearch={() => console.log("Clear clicked")}
                    className="py-6"
                />
            </div>
        </div>
    );
}

export default EmptyStatesDemo;

