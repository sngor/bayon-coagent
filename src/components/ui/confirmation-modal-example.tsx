/**
 * Example Usage of ConfirmationModal
 * 
 * This file demonstrates how to use the confirmation modal in your components.
 * You can delete this file after reviewing the examples.
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useConfirmation } from "@/hooks/use-confirmation";
import { toast } from "@/hooks/use-toast";

export function ConfirmationModalExample() {
    const { confirm, ConfirmationDialog } = useConfirmation();
    const [isDeleting, setIsDeleting] = useState(false);

    // Example 1: Delete content with danger variant
    const handleDeleteContent = async () => {
        const confirmed = await confirm({
            title: "Delete Content?",
            description:
                "This action cannot be undone. This will permanently delete the saved content item.",
            confirmText: "Delete",
            cancelText: "Cancel",
            variant: "danger",
        });

        if (confirmed) {
            setIsDeleting(true);
            try {
                // Your delete logic here
                await new Promise((resolve) => setTimeout(resolve, 1000));
                toast({ title: "Content Deleted", description: "The item has been removed." });
            } catch (error) {
                toast({ variant: "destructive", title: "Error", description: "Failed to delete content." });
            } finally {
                setIsDeleting(false);
            }
        }
    };

    // Example 2: Delete project with warning variant
    const handleDeleteProject = async () => {
        const confirmed = await confirm({
            title: "Delete Project?",
            description:
                "All content in this project will be moved to Uncategorized. This action cannot be undone.",
            confirmText: "Delete Project",
            cancelText: "Keep Project",
            variant: "warning",
        });

        if (confirmed) {
            // Your delete project logic here
            toast({ title: "Project Deleted", description: "The project has been removed." });
        }
    };

    // Example 3: Archive with info variant
    const handleArchive = async () => {
        const confirmed = await confirm({
            title: "Archive Content?",
            description:
                "This content will be moved to your archive. You can restore it later from the archive section.",
            confirmText: "Archive",
            cancelText: "Cancel",
            variant: "info",
        });

        if (confirmed) {
            // Your archive logic here
            toast({ title: "Content Archived", description: "The item has been archived." });
        }
    };

    return (
        <div className="space-y-4 p-8">
            <h2 className="text-2xl font-bold">Confirmation Modal Examples</h2>

            <div className="space-y-2">
                <Button onClick={handleDeleteContent} variant="destructive" disabled={isDeleting}>
                    {isDeleting ? "Deleting..." : "Delete Content (Danger)"}
                </Button>

                <Button onClick={handleDeleteProject} variant="outline">
                    Delete Project (Warning)
                </Button>

                <Button onClick={handleArchive} variant="secondary">
                    Archive Content (Info)
                </Button>
            </div>

            {/* This renders the confirmation dialog */}
            {ConfirmationDialog}
        </div>
    );
}

/**
 * Quick Integration Guide:
 * 
 * 1. Import the hook:
 *    import { useConfirmation } from "@/hooks/use-confirmation";
 * 
 * 2. Use the hook in your component:
 *    const { confirm, ConfirmationDialog } = useConfirmation();
 * 
 * 3. Call confirm() before destructive actions:
 *    const confirmed = await confirm({
 *      title: "Delete Item?",
 *      description: "This action cannot be undone.",
 *      variant: "danger"
 *    });
 *    
 *    if (confirmed) {
 *      // Perform the action
 *    }
 * 
 * 4. Render the dialog in your JSX:
 *    return (
 *      <div>
 *        {/* Your component content *\/}
 *        {ConfirmationDialog}
 *      </div>
 *    );
 */
