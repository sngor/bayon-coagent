"use client";

import { useState, useMemo } from "react";
import { Testimonial } from "@/lib/types/common/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, Star, Image as ImageIcon, Calendar } from "lucide-react";
import { format } from "date-fns";

interface TestimonialListProps {
    testimonials: Testimonial[];
    onTestimonialClick?: (testimonial: Testimonial) => void;
}

type FilterStatus = "all" | "featured" | "not-featured";
type FilterPhoto = "all" | "with-photo" | "without-photo";

export function TestimonialList({
    testimonials,
    onTestimonialClick,
}: TestimonialListProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
    const [filterPhoto, setFilterPhoto] = useState<FilterPhoto>("all");
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [dateRange, setDateRange] = useState<{
        start: string;
        end: string;
    }>({ start: "", end: "" });

    // Extract all unique tags from testimonials
    const allTags = useMemo(() => {
        const tagSet = new Set<string>();
        testimonials.forEach((t) => t.tags.forEach((tag) => tagSet.add(tag)));
        return Array.from(tagSet).sort();
    }, [testimonials]);

    // Filter and search testimonials
    const filteredTestimonials = useMemo(() => {
        return testimonials.filter((testimonial) => {
            // Search filter (client name and text)
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesName = testimonial.clientName.toLowerCase().includes(query);
                const matchesText = testimonial.testimonialText
                    .toLowerCase()
                    .includes(query);
                if (!matchesName && !matchesText) return false;
            }

            // Featured status filter
            if (filterStatus === "featured" && !testimonial.isFeatured) return false;
            if (filterStatus === "not-featured" && testimonial.isFeatured)
                return false;

            // Photo presence filter
            if (filterPhoto === "with-photo" && !testimonial.clientPhotoUrl)
                return false;
            if (filterPhoto === "without-photo" && testimonial.clientPhotoUrl)
                return false;

            // Tag filter
            if (selectedTags.length > 0) {
                const hasMatchingTag = selectedTags.some((tag) =>
                    testimonial.tags.includes(tag)
                );
                if (!hasMatchingTag) return false;
            }

            // Date range filter
            if (dateRange.start) {
                const testimonialDate = new Date(testimonial.dateReceived);
                const startDate = new Date(dateRange.start);
                if (testimonialDate < startDate) return false;
            }
            if (dateRange.end) {
                const testimonialDate = new Date(testimonial.dateReceived);
                const endDate = new Date(dateRange.end);
                // Set end date to end of day
                endDate.setHours(23, 59, 59, 999);
                if (testimonialDate > endDate) return false;
            }

            return true;
        });
    }, [
        testimonials,
        searchQuery,
        filterStatus,
        filterPhoto,
        selectedTags,
        dateRange,
    ]);

    const toggleTag = (tag: string) => {
        setSelectedTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
        );
    };

    const clearFilters = () => {
        setSearchQuery("");
        setFilterStatus("all");
        setFilterPhoto("all");
        setSelectedTags([]);
        setDateRange({ start: "", end: "" });
    };

    const hasActiveFilters =
        searchQuery ||
        filterStatus !== "all" ||
        filterPhoto !== "all" ||
        selectedTags.length > 0 ||
        dateRange.start ||
        dateRange.end;

    return (
        <div className="space-y-6">
            {/* Filters Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Filters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by client name or testimonial text..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Filter Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Featured Status */}
                        <div>
                            <label className="text-sm font-medium mb-2 block">Status</label>
                            <Select
                                value={filterStatus}
                                onValueChange={(value) => setFilterStatus(value as FilterStatus)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Testimonials</SelectItem>
                                    <SelectItem value="featured">Featured Only</SelectItem>
                                    <SelectItem value="not-featured">Not Featured</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Photo Presence */}
                        <div>
                            <label className="text-sm font-medium mb-2 block">Photo</label>
                            <Select
                                value={filterPhoto}
                                onValueChange={(value) => setFilterPhoto(value as FilterPhoto)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="with-photo">With Photo</SelectItem>
                                    <SelectItem value="without-photo">Without Photo</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Date Range Start */}
                        <div>
                            <label className="text-sm font-medium mb-2 block">
                                From Date
                            </label>
                            <Input
                                type="date"
                                value={dateRange.start}
                                onChange={(e) =>
                                    setDateRange((prev) => ({ ...prev, start: e.target.value }))
                                }
                            />
                        </div>

                        {/* Date Range End */}
                        <div>
                            <label className="text-sm font-medium mb-2 block">To Date</label>
                            <Input
                                type="date"
                                value={dateRange.end}
                                onChange={(e) =>
                                    setDateRange((prev) => ({ ...prev, end: e.target.value }))
                                }
                            />
                        </div>
                    </div>

                    {/* Tags */}
                    {allTags.length > 0 && (
                        <div>
                            <label className="text-sm font-medium mb-2 block">Tags</label>
                            <div className="flex flex-wrap gap-2">
                                {allTags.map((tag) => (
                                    <Badge
                                        key={tag}
                                        variant={selectedTags.includes(tag) ? "default" : "outline"}
                                        className="cursor-pointer"
                                        onClick={() => toggleTag(tag)}
                                    >
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Clear Filters */}
                    {hasActiveFilters && (
                        <div className="flex justify-end">
                            <Button variant="outline" size="sm" onClick={clearFilters}>
                                Clear All Filters
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Results Count */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    Showing {filteredTestimonials.length} of {testimonials.length}{" "}
                    testimonials
                </p>
            </div>

            {/* Testimonials Grid */}
            {filteredTestimonials.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">
                            {hasActiveFilters
                                ? "No testimonials match your filters"
                                : "No testimonials yet"}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTestimonials.map((testimonial) => (
                        <Card
                            key={testimonial.id}
                            className="cursor-pointer hover:shadow-lg transition-shadow"
                            onClick={() => onTestimonialClick?.(testimonial)}
                        >
                            <CardHeader>
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <CardTitle className="text-base truncate">
                                            {testimonial.clientName}
                                        </CardTitle>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                            <Calendar className="h-3 w-3" />
                                            {format(new Date(testimonial.dateReceived), "MMM d, yyyy")}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1 items-end">
                                        {testimonial.isFeatured && (
                                            <Badge variant="default" className="text-xs">
                                                <Star className="h-3 w-3 mr-1" />
                                                Featured
                                            </Badge>
                                        )}
                                        {testimonial.clientPhotoUrl && (
                                            <Badge variant="secondary" className="text-xs">
                                                <ImageIcon className="h-3 w-3 mr-1" />
                                                Photo
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground line-clamp-3">
                                    {testimonial.testimonialText}
                                </p>
                                {testimonial.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-3">
                                        {testimonial.tags.map((tag) => (
                                            <Badge key={tag} variant="outline" className="text-xs">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
