"use client"

import * as React from "react"
import { Camera, Heart, Share2, MapPin, Phone, Mail, Home, Search, User } from "lucide-react"
import {
    BottomSheet,
    BottomSheetTrigger,
    SwipeableCard,
    SwipeableGallery,
    TouchButton,
    TouchButtonGroup,
    FloatingActionButton,
    SegmentedControl,
    MobileNav,
    MobileTabBar,
    HapticFeedback,
} from "./ui-components"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

/**
 * Demo component showcasing all mobile UI components
 * 
 * This is a comprehensive example showing how to use the mobile UI components
 * together in a real-world scenario.
 * 
 * Requirements: 4.1, 5.1, 5.2, 8.3
 */
export function MobileUIDemo() {
    const [bottomSheetOpen, setBottomSheetOpen] = React.useState(false)
    const [view, setView] = React.useState<"grid" | "list">("grid")
    const [activeTab, setActiveTab] = React.useState("overview")

    // Sample property data
    const propertyImages = [
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
        "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800",
    ]

    const properties = [
        {
            id: 1,
            title: "Modern Downtown Condo",
            price: "$450,000",
            beds: 2,
            baths: 2,
            sqft: "1,200",
        },
        {
            id: 2,
            title: "Suburban Family Home",
            price: "$650,000",
            beds: 4,
            baths: 3,
            sqft: "2,500",
        },
        {
            id: 3,
            title: "Luxury Waterfront Villa",
            price: "$1,200,000",
            beds: 5,
            baths: 4,
            sqft: "3,800",
        },
    ]

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header with Tab Bar */}
            <div className="sticky top-0 z-30 bg-background border-b">
                <div className="p-4">
                    <h1 className="text-2xl font-bold">Mobile UI Demo</h1>
                    <p className="text-sm text-muted-foreground">
                        Touch-optimized components showcase
                    </p>
                </div>

                <MobileTabBar
                    tabs={[
                        { id: "overview", label: "Overview" },
                        { id: "gallery", label: "Gallery" },
                        { id: "actions", label: "Actions" },
                    ]}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                />
            </div>

            {/* Content */}
            <div className="p-4 space-y-6">
                {/* Overview Tab */}
                {activeTab === "overview" && (
                    <>
                        {/* Segmented Control */}
                        <div>
                            <h2 className="text-lg font-semibold mb-3">View Mode</h2>
                            <SegmentedControl
                                options={[
                                    { value: "grid", label: "Grid" },
                                    { value: "list", label: "List" },
                                ]}
                                value={view}
                                onChange={(value) => setView(value as "grid" | "list")}
                            />
                        </div>

                        {/* Property Cards */}
                        <div>
                            <h2 className="text-lg font-semibold mb-3">Properties</h2>
                            <div className="space-y-4">
                                {properties.map((property) => (
                                    <SwipeableCard
                                        key={property.id}
                                        onSwipeLeft={() => {
                                            HapticFeedback.success()
                                            console.log("Liked:", property.title)
                                        }}
                                        onSwipeRight={() => {
                                            HapticFeedback.error()
                                            console.log("Passed:", property.title)
                                        }}
                                    >
                                        <Card className="overflow-hidden">
                                            <CardHeader>
                                                <CardTitle className="text-lg">{property.title}</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-2">
                                                    <p className="text-2xl font-bold text-primary">
                                                        {property.price}
                                                    </p>
                                                    <div className="flex gap-4 text-sm text-muted-foreground">
                                                        <span>{property.beds} beds</span>
                                                        <span>{property.baths} baths</span>
                                                        <span>{property.sqft} sqft</span>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </SwipeableCard>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* Gallery Tab */}
                {activeTab === "gallery" && (
                    <>
                        <div>
                            <h2 className="text-lg font-semibold mb-3">Property Gallery</h2>
                            <p className="text-sm text-muted-foreground mb-4">
                                Swipe left or right to navigate
                            </p>
                            <SwipeableGallery
                                images={propertyImages}
                                onImageChange={(index) => {
                                    console.log("Image changed to:", index)
                                }}
                                className="h-[400px]"
                            />
                        </div>
                    </>
                )}

                {/* Actions Tab */}
                {activeTab === "actions" && (
                    <>
                        {/* Touch Buttons */}
                        <div>
                            <h2 className="text-lg font-semibold mb-3">Touch Buttons</h2>
                            <TouchButtonGroup orientation="vertical">
                                <TouchButton
                                    variant="primary"
                                    fullWidth
                                    icon={<Phone className="h-5 w-5" />}
                                    onClick={() => HapticFeedback.tap()}
                                >
                                    Call Agent
                                </TouchButton>
                                <TouchButton
                                    variant="secondary"
                                    fullWidth
                                    icon={<Mail className="h-5 w-5" />}
                                    onClick={() => HapticFeedback.tap()}
                                >
                                    Send Email
                                </TouchButton>
                                <TouchButton
                                    variant="outline"
                                    fullWidth
                                    icon={<MapPin className="h-5 w-5" />}
                                    onClick={() => HapticFeedback.tap()}
                                >
                                    Get Directions
                                </TouchButton>
                            </TouchButtonGroup>
                        </div>

                        {/* Bottom Sheet Trigger */}
                        <div>
                            <h2 className="text-lg font-semibold mb-3">Bottom Sheet</h2>
                            <BottomSheetTrigger
                                onClick={() => setBottomSheetOpen(true)}
                                className="w-full"
                            >
                                <TouchButton variant="primary" fullWidth>
                                    Open Property Details
                                </TouchButton>
                            </BottomSheetTrigger>
                        </div>

                        {/* Haptic Feedback Examples */}
                        <div>
                            <h2 className="text-lg font-semibold mb-3">Haptic Feedback</h2>
                            <TouchButtonGroup orientation="vertical">
                                <TouchButton
                                    variant="outline"
                                    fullWidth
                                    onClick={() => HapticFeedback.tap()}
                                >
                                    Light Tap
                                </TouchButton>
                                <TouchButton
                                    variant="outline"
                                    fullWidth
                                    onClick={() => HapticFeedback.press()}
                                >
                                    Medium Press
                                </TouchButton>
                                <TouchButton
                                    variant="outline"
                                    fullWidth
                                    onClick={() => HapticFeedback.success()}
                                >
                                    Success Pattern
                                </TouchButton>
                                <TouchButton
                                    variant="outline"
                                    fullWidth
                                    onClick={() => HapticFeedback.error()}
                                >
                                    Error Pattern
                                </TouchButton>
                                <TouchButton
                                    variant="outline"
                                    fullWidth
                                    onClick={() => HapticFeedback.notification()}
                                >
                                    Notification Pattern
                                </TouchButton>
                            </TouchButtonGroup>
                        </div>
                    </>
                )}
            </div>

            {/* Bottom Sheet */}
            <BottomSheet
                open={bottomSheetOpen}
                onOpenChange={setBottomSheetOpen}
                title="Property Details"
                description="Swipe down to dismiss"
                snapPoints={[90, 50]}
                defaultSnapPoint={1}
            >
                <div className="space-y-4">
                    <div>
                        <h3 className="font-semibold mb-2">Description</h3>
                        <p className="text-sm text-muted-foreground">
                            Beautiful modern condo in the heart of downtown. Features include
                            hardwood floors, stainless steel appliances, and stunning city views.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-2">Features</h3>
                        <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Hardwood floors throughout</li>
                            <li>• Stainless steel appliances</li>
                            <li>• In-unit washer/dryer</li>
                            <li>• Balcony with city views</li>
                            <li>• Parking included</li>
                        </ul>
                    </div>

                    <TouchButtonGroup orientation="vertical">
                        <TouchButton
                            variant="primary"
                            fullWidth
                            icon={<Heart className="h-5 w-5" />}
                        >
                            Save Property
                        </TouchButton>
                        <TouchButton
                            variant="secondary"
                            fullWidth
                            icon={<Share2 className="h-5 w-5" />}
                        >
                            Share Property
                        </TouchButton>
                    </TouchButtonGroup>
                </div>
            </BottomSheet>

            {/* Floating Action Button */}
            <FloatingActionButton
                position="bottom-right"
                icon={<Camera className="h-6 w-6" />}
                onClick={() => {
                    HapticFeedback.press()
                    console.log("Quick capture opened")
                }}
            />

            {/* Mobile Navigation */}
            <MobileNav
                items={[
                    { label: "Home", href: "/", icon: Home },
                    { label: "Search", href: "/search", icon: Search, badge: 3 },
                    { label: "Profile", href: "/profile", icon: User },
                ]}
            />
        </div>
    )
}
