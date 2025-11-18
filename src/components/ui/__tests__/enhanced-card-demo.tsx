/**
 * Demo component to verify EnhancedCard functionality
 * This can be imported into any page to test the component visually
 */

import React from "react";
import {
    EnhancedCard,
    EnhancedCardHeader,
    EnhancedCardTitle,
    EnhancedCardDescription,
    EnhancedCardContent,
    EnhancedCardFooter,
} from "../enhanced-card";

export function EnhancedCardDemo() {
    return (
        <div className="p-8 space-y-8 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold">Enhanced Card Component Demo</h1>

            <section className="space-y-4">
                <h2 className="text-2xl font-semibold">Variants</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Default Variant */}
                    <EnhancedCard variant="default">
                        <EnhancedCardHeader>
                            <EnhancedCardTitle>Default Card</EnhancedCardTitle>
                            <EnhancedCardDescription>
                                Standard card with border and shadow
                            </EnhancedCardDescription>
                        </EnhancedCardHeader>
                        <EnhancedCardContent>
                            This is the default card variant with basic styling.
                        </EnhancedCardContent>
                    </EnhancedCard>

                    {/* Elevated Variant */}
                    <EnhancedCard variant="elevated">
                        <EnhancedCardHeader>
                            <EnhancedCardTitle>Elevated Card</EnhancedCardTitle>
                            <EnhancedCardDescription>
                                Card with enhanced shadow
                            </EnhancedCardDescription>
                        </EnhancedCardHeader>
                        <EnhancedCardContent>
                            This card has a larger shadow that increases on hover.
                        </EnhancedCardContent>
                    </EnhancedCard>

                    {/* Bordered Variant */}
                    <EnhancedCard variant="bordered">
                        <EnhancedCardHeader>
                            <EnhancedCardTitle>Bordered Card</EnhancedCardTitle>
                            <EnhancedCardDescription>
                                Card with prominent border
                            </EnhancedCardDescription>
                        </EnhancedCardHeader>
                        <EnhancedCardContent>
                            This card features a thicker, colored border.
                        </EnhancedCardContent>
                    </EnhancedCard>

                    {/* Glass Variant */}
                    <EnhancedCard variant="glass">
                        <EnhancedCardHeader>
                            <EnhancedCardTitle>Glass Card</EnhancedCardTitle>
                            <EnhancedCardDescription>
                                Card with backdrop blur effect
                            </EnhancedCardDescription>
                        </EnhancedCardHeader>
                        <EnhancedCardContent>
                            This card has a frosted glass appearance with backdrop blur.
                        </EnhancedCardContent>
                    </EnhancedCard>

                    {/* Gradient Variant */}
                    <EnhancedCard variant="gradient">
                        <EnhancedCardHeader>
                            <EnhancedCardTitle>Gradient Card</EnhancedCardTitle>
                            <EnhancedCardDescription>
                                Card with gradient background
                            </EnhancedCardDescription>
                        </EnhancedCardHeader>
                        <EnhancedCardContent>
                            This card features a subtle gradient background.
                        </EnhancedCardContent>
                    </EnhancedCard>
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-semibold">Interactive Cards</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <EnhancedCard variant="elevated" interactive>
                        <EnhancedCardHeader>
                            <EnhancedCardTitle>Interactive Card</EnhancedCardTitle>
                            <EnhancedCardDescription>
                                Hover to see the effect
                            </EnhancedCardDescription>
                        </EnhancedCardHeader>
                        <EnhancedCardContent>
                            This card scales up and shows enhanced shadow on hover.
                        </EnhancedCardContent>
                    </EnhancedCard>

                    <EnhancedCard variant="gradient" interactive>
                        <EnhancedCardHeader>
                            <EnhancedCardTitle>Interactive Gradient</EnhancedCardTitle>
                            <EnhancedCardDescription>
                                Click-ready appearance
                            </EnhancedCardDescription>
                        </EnhancedCardHeader>
                        <EnhancedCardContent>
                            Combines gradient styling with interactive hover effects.
                        </EnhancedCardContent>
                    </EnhancedCard>
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-semibold">Loading State</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <EnhancedCard loading />
                    <EnhancedCard loading variant="elevated" />
                    <EnhancedCard loading variant="bordered" />
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-semibold">With Footer</h2>
                <EnhancedCard variant="elevated" className="max-w-md">
                    <EnhancedCardHeader>
                        <EnhancedCardTitle>Card with Footer</EnhancedCardTitle>
                        <EnhancedCardDescription>
                            Complete card example
                        </EnhancedCardDescription>
                    </EnhancedCardHeader>
                    <EnhancedCardContent>
                        This card demonstrates all sections including a footer with actions.
                    </EnhancedCardContent>
                    <EnhancedCardFooter className="justify-end gap-2">
                        <button className="px-4 py-2 text-sm border rounded-md hover:bg-accent">
                            Cancel
                        </button>
                        <button className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                            Confirm
                        </button>
                    </EnhancedCardFooter>
                </EnhancedCard>
            </section>
        </div>
    );
}
