'use client';

import { useState, useEffect } from 'react';
import { Search, Bed, Bath, Home, DollarSign, MapPin, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { searchPropertiesForDashboard, trackPropertyView, sendPropertyInquiry } from '@/features/client-dashboards/actions/client-dashboard-actions';

interface PropertySearchProps {
    token: string;
    primaryColor: string;
    onContactAgent: () => void;
}

interface PropertyListing {
    id: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    price: number;
    bedrooms: number;
    bathrooms: number;
    squareFeet: number;
    propertyType: string;
    images: string[];
    listingDate: string;
    status: 'active' | 'pending' | 'sold' | 'expired';
}

interface SearchCriteria {
    location: string;
    minPrice: string;
    maxPrice: string;
    bedrooms: string;
    bathrooms: string;
    propertyType: string;
    minSquareFeet: string;
    maxSquareFeet: string;
}

/**
 * Property Search Component
 * 
 * Provides a branded property search interface for clients with:
 * - Search filters (location, price, beds, baths, property type, sqft)
 * - Property listing grid with photos and key details
 * - Property detail modal with photo gallery and map
 * - Agent branding throughout
 * - Analytics tracking for property views
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.5
 */
export function PropertySearch({ token, primaryColor, onContactAgent }: PropertySearchProps) {
    const [criteria, setCriteria] = useState<SearchCriteria>({
        location: '',
        minPrice: '',
        maxPrice: '',
        bedrooms: '',
        bathrooms: '',
        propertyType: '',
        minSquareFeet: '',
        maxSquareFeet: '',
    });

    const [properties, setProperties] = useState<PropertyListing[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedProperty, setSelectedProperty] = useState<PropertyListing | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalResults, setTotalResults] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [showInquiryModal, setShowInquiryModal] = useState(false);
    const [inquiryMessage, setInquiryMessage] = useState('');
    const [sendingInquiry, setSendingInquiry] = useState(false);

    const RESULTS_PER_PAGE = 12;

    // Handle search
    const handleSearch = async (page: number = 1) => {
        setLoading(true);
        setError(null);

        try {
            const result = await searchPropertiesForDashboard(token, {
                location: criteria.location || undefined,
                minPrice: criteria.minPrice ? parseInt(criteria.minPrice) : undefined,
                maxPrice: criteria.maxPrice ? parseInt(criteria.maxPrice) : undefined,
                bedrooms: criteria.bedrooms ? parseInt(criteria.bedrooms) : undefined,
                bathrooms: criteria.bathrooms ? parseInt(criteria.bathrooms) : undefined,
                propertyType: criteria.propertyType ? [criteria.propertyType] : undefined,
                minSquareFeet: criteria.minSquareFeet ? parseInt(criteria.minSquareFeet) : undefined,
                maxSquareFeet: criteria.maxSquareFeet ? parseInt(criteria.maxSquareFeet) : undefined,
                page,
                limit: RESULTS_PER_PAGE,
            });

            if (result.message === 'success' && result.data) {
                setProperties(result.data.properties as PropertyListing[]);
                setTotalResults(result.data.total);
                setHasMore(result.data.hasMore);
                setCurrentPage(page);
            } else {
                setError(result.message || 'Failed to search properties');
            }
        } catch (err) {
            setError('An error occurred while searching properties');
            console.error('Search error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Handle property view
    const handleViewProperty = async (property: PropertyListing) => {
        setSelectedProperty(property);

        // Track property view for analytics
        try {
            await trackPropertyView(token, property.id);
        } catch (err) {
            console.error('Failed to track property view:', err);
        }
    };

    // Handle inquiry submission
    const handleSendInquiry = async () => {
        if (!selectedProperty || !inquiryMessage.trim()) return;

        setSendingInquiry(true);
        try {
            const result = await sendPropertyInquiry(
                token,
                selectedProperty.id,
                inquiryMessage
            );

            if (result.message === 'success') {
                setShowInquiryModal(false);
                setInquiryMessage('');
                alert('Your inquiry has been sent to your agent!');
            } else {
                alert('Failed to send inquiry. Please try again.');
            }
        } catch (err) {
            console.error('Failed to send inquiry:', err);
            alert('An error occurred. Please try again.');
        } finally {
            setSendingInquiry(false);
        }
    };

    // Format price
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    };

    // Format number with commas
    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('en-US').format(num);
    };

    return (
        <div className="space-y-6">
            {/* Search Filters */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Search Filters
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Location */}
                    <div>
                        <Label htmlFor="location" className="text-sm font-medium">
                            Location (City or ZIP)
                        </Label>
                        <div className="relative mt-1">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                id="location"
                                placeholder="e.g., Miami or 33101"
                                value={criteria.location}
                                onChange={(e) => setCriteria({ ...criteria, location: e.target.value })}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    {/* Min Price */}
                    <div>
                        <Label htmlFor="minPrice" className="text-sm font-medium">
                            Min Price
                        </Label>
                        <div className="relative mt-1">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                id="minPrice"
                                type="number"
                                placeholder="e.g., 200000"
                                value={criteria.minPrice}
                                onChange={(e) => setCriteria({ ...criteria, minPrice: e.target.value })}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    {/* Max Price */}
                    <div>
                        <Label htmlFor="maxPrice" className="text-sm font-medium">
                            Max Price
                        </Label>
                        <div className="relative mt-1">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                id="maxPrice"
                                type="number"
                                placeholder="e.g., 500000"
                                value={criteria.maxPrice}
                                onChange={(e) => setCriteria({ ...criteria, maxPrice: e.target.value })}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    {/* Bedrooms */}
                    <div>
                        <Label htmlFor="bedrooms" className="text-sm font-medium">
                            Bedrooms
                        </Label>
                        <Select
                            value={criteria.bedrooms}
                            onValueChange={(value) => setCriteria({ ...criteria, bedrooms: value })}
                        >
                            <SelectTrigger id="bedrooms" className="mt-1">
                                <SelectValue placeholder="Any" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">Any</SelectItem>
                                <SelectItem value="1">1+</SelectItem>
                                <SelectItem value="2">2+</SelectItem>
                                <SelectItem value="3">3+</SelectItem>
                                <SelectItem value="4">4+</SelectItem>
                                <SelectItem value="5">5+</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Bathrooms */}
                    <div>
                        <Label htmlFor="bathrooms" className="text-sm font-medium">
                            Bathrooms
                        </Label>
                        <Select
                            value={criteria.bathrooms}
                            onValueChange={(value) => setCriteria({ ...criteria, bathrooms: value })}
                        >
                            <SelectTrigger id="bathrooms" className="mt-1">
                                <SelectValue placeholder="Any" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">Any</SelectItem>
                                <SelectItem value="1">1+</SelectItem>
                                <SelectItem value="2">2+</SelectItem>
                                <SelectItem value="3">3+</SelectItem>
                                <SelectItem value="4">4+</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Property Type */}
                    <div>
                        <Label htmlFor="propertyType" className="text-sm font-medium">
                            Property Type
                        </Label>
                        <Select
                            value={criteria.propertyType}
                            onValueChange={(value) => setCriteria({ ...criteria, propertyType: value })}
                        >
                            <SelectTrigger id="propertyType" className="mt-1">
                                <SelectValue placeholder="Any" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">Any</SelectItem>
                                <SelectItem value="single-family">Single Family</SelectItem>
                                <SelectItem value="condo">Condo</SelectItem>
                                <SelectItem value="townhouse">Townhouse</SelectItem>
                                <SelectItem value="multi-family">Multi-Family</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Min Square Feet */}
                    <div>
                        <Label htmlFor="minSquareFeet" className="text-sm font-medium">
                            Min Sq Ft
                        </Label>
                        <Input
                            id="minSquareFeet"
                            type="number"
                            placeholder="e.g., 1000"
                            value={criteria.minSquareFeet}
                            onChange={(e) => setCriteria({ ...criteria, minSquareFeet: e.target.value })}
                            className="mt-1"
                        />
                    </div>

                    {/* Max Square Feet */}
                    <div>
                        <Label htmlFor="maxSquareFeet" className="text-sm font-medium">
                            Max Sq Ft
                        </Label>
                        <Input
                            id="maxSquareFeet"
                            type="number"
                            placeholder="e.g., 3000"
                            value={criteria.maxSquareFeet}
                            onChange={(e) => setCriteria({ ...criteria, maxSquareFeet: e.target.value })}
                            className="mt-1"
                        />
                    </div>
                </div>

                {/* Search Button */}
                <div className="flex justify-end pt-2">
                    <Button
                        onClick={() => handleSearch(1)}
                        disabled={loading}
                        className="shadow-lg hover:shadow-xl transition-all"
                        style={{
                            backgroundColor: primaryColor,
                            color: '#ffffff',
                        }}
                        size="lg"
                    >
                        <Search className="h-5 w-5 mr-2" />
                        {loading ? 'Searching...' : 'Search Properties'}
                    </Button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-red-800 dark:text-red-200">{error}</p>
                </div>
            )}

            {/* Results Summary */}
            {!loading && properties.length > 0 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Showing {((currentPage - 1) * RESULTS_PER_PAGE) + 1} - {Math.min(currentPage * RESULTS_PER_PAGE, totalResults)} of {totalResults} properties
                    </p>
                </div>
            )}

            {/* Property Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-lg h-80 animate-pulse" />
                    ))}
                </div>
            ) : properties.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {properties.map((property) => (
                            <PropertyCard
                                key={property.id}
                                property={property}
                                primaryColor={primaryColor}
                                onViewDetails={() => handleViewProperty(property)}
                                formatPrice={formatPrice}
                                formatNumber={formatNumber}
                            />
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalResults > RESULTS_PER_PAGE && (
                        <div className="flex items-center justify-center gap-2 pt-4">
                            <Button
                                onClick={() => handleSearch(currentPage - 1)}
                                disabled={currentPage === 1 || loading}
                                variant="outline"
                                size="sm"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Previous
                            </Button>
                            <span className="text-sm text-gray-600 dark:text-gray-400 px-4">
                                Page {currentPage} of {Math.ceil(totalResults / RESULTS_PER_PAGE)}
                            </span>
                            <Button
                                onClick={() => handleSearch(currentPage + 1)}
                                disabled={!hasMore || loading}
                                variant="outline"
                                size="sm"
                            >
                                Next
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </>
            ) : !loading && (
                <div className="text-center py-12">
                    <Home className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                        No properties found. Try adjusting your search criteria.
                    </p>
                </div>
            )}

            {/* Property Detail Modal */}
            {selectedProperty && (
                <PropertyDetailModal
                    property={selectedProperty}
                    primaryColor={primaryColor}
                    onClose={() => setSelectedProperty(null)}
                    onAskAgent={() => {
                        setShowInquiryModal(true);
                    }}
                    formatPrice={formatPrice}
                    formatNumber={formatNumber}
                />
            )}

            {/* Inquiry Modal */}
            {showInquiryModal && selectedProperty && (
                <InquiryModal
                    property={selectedProperty}
                    primaryColor={primaryColor}
                    message={inquiryMessage}
                    onMessageChange={setInquiryMessage}
                    onSend={handleSendInquiry}
                    onClose={() => {
                        setShowInquiryModal(false);
                        setInquiryMessage('');
                    }}
                    sending={sendingInquiry}
                />
            )}
        </div>
    );
}

/**
 * Property Card Component
 * 
 * Displays a property listing card with:
 * - Property photo
 * - Key details (price, beds, baths, sqft)
 * - View Details button
 * - Agent branding
 */
interface PropertyCardProps {
    property: PropertyListing;
    primaryColor: string;
    onViewDetails: () => void;
    formatPrice: (price: number) => string;
    formatNumber: (num: number) => string;
}

function PropertyCard({ property, primaryColor, onViewDetails, formatPrice, formatNumber }: PropertyCardProps) {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            {/* Property Image */}
            <div className="relative h-48 bg-gray-200 dark:bg-gray-700">
                {property.images.length > 0 ? (
                    <img
                        src={property.images[0]}
                        alt={property.address}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Home className="h-16 w-16 text-gray-400" />
                    </div>
                )}
                {/* Status Badge */}
                <div
                    className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold text-white shadow-lg"
                    style={{ backgroundColor: primaryColor }}
                >
                    {property.status.toUpperCase()}
                </div>
            </div>

            {/* Property Details */}
            <div className="p-4 space-y-3">
                {/* Price */}
                <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatPrice(property.price)}
                    </p>
                </div>

                {/* Address */}
                <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                        {property.address}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {property.city}, {property.state} {property.zip}
                    </p>
                </div>

                {/* Property Stats */}
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                        <Bed className="h-4 w-4" />
                        <span>{property.bedrooms} bed</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Bath className="h-4 w-4" />
                        <span>{property.bathrooms} bath</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Home className="h-4 w-4" />
                        <span>{formatNumber(property.squareFeet)} sqft</span>
                    </div>
                </div>

                {/* Property Type */}
                <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                    {property.propertyType}
                </p>

                {/* View Details Button */}
                <Button
                    onClick={onViewDetails}
                    className="w-full"
                    style={{
                        backgroundColor: primaryColor,
                        color: '#ffffff',
                    }}
                >
                    View Details
                </Button>
            </div>
        </div>
    );
}

/**
 * Property Detail Modal Component
 * 
 * Displays detailed property information with:
 * - Photo gallery
 * - Full property details
 * - Map location (placeholder)
 * - "Ask Agent About This Property" button
 */
interface PropertyDetailModalProps {
    property: PropertyListing;
    primaryColor: string;
    onClose: () => void;
    onAskAgent: () => void;
    formatPrice: (price: number) => string;
    formatNumber: (num: number) => string;
}

function PropertyDetailModal({
    property,
    primaryColor,
    onClose,
    onAskAgent,
    formatPrice,
    formatNumber,
}: PropertyDetailModalProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
    };

    return (
        <div
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Property Details
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        aria-label="Close property details"
                    >
                        <X className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Photo Gallery */}
                    {property.images.length > 0 ? (
                        <div className="relative">
                            <div className="relative h-96 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                                <img
                                    src={property.images[currentImageIndex]}
                                    alt={`${property.address} - Image ${currentImageIndex + 1}`}
                                    className="w-full h-full object-cover"
                                />
                                {property.images.length > 1 && (
                                    <>
                                        <button
                                            onClick={prevImage}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 dark:bg-gray-900/90 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-900 transition-colors"
                                            aria-label="Previous image"
                                        >
                                            <ChevronLeft className="h-6 w-6 text-gray-900 dark:text-white" />
                                        </button>
                                        <button
                                            onClick={nextImage}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 dark:bg-gray-900/90 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-900 transition-colors"
                                            aria-label="Next image"
                                        >
                                            <ChevronRight className="h-6 w-6 text-gray-900 dark:text-white" />
                                        </button>
                                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/70 text-white text-sm rounded-full">
                                            {currentImageIndex + 1} / {property.images.length}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                            <Home className="h-24 w-24 text-gray-400" />
                        </div>
                    )}

                    {/* Price and Status */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                {formatPrice(property.price)}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Listed on {new Date(property.listingDate).toLocaleDateString()}
                            </p>
                        </div>
                        <div
                            className="px-4 py-2 rounded-full text-sm font-semibold text-white"
                            style={{ backgroundColor: primaryColor }}
                        >
                            {property.status.toUpperCase()}
                        </div>
                    </div>

                    {/* Address */}
                    <div>
                        <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            {property.address}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {property.city}, {property.state} {property.zip}
                        </p>
                    </div>

                    {/* Property Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                                <Bed className="h-5 w-5" />
                                <span className="text-sm">Bedrooms</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {property.bedrooms}
                            </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                                <Bath className="h-5 w-5" />
                                <span className="text-sm">Bathrooms</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {property.bathrooms}
                            </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                                <Home className="h-5 w-5" />
                                <span className="text-sm">Square Feet</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {formatNumber(property.squareFeet)}
                            </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                                <Home className="h-5 w-5" />
                                <span className="text-sm">Type</span>
                            </div>
                            <p className="text-lg font-bold text-gray-900 dark:text-white capitalize">
                                {property.propertyType}
                            </p>
                        </div>
                    </div>

                    {/* Map Placeholder */}
                    <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                            Location
                        </h4>
                        <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-64 flex items-center justify-center">
                            <div className="text-center">
                                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                                <p className="text-gray-600 dark:text-gray-400">
                                    Map view coming soon
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                                    {property.city}, {property.state}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Ask Agent Button */}
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                        <Button
                            onClick={onAskAgent}
                            className="w-full shadow-lg hover:shadow-xl transition-all"
                            style={{
                                backgroundColor: primaryColor,
                                color: '#ffffff',
                            }}
                            size="lg"
                        >
                            Ask Agent About This Property
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Inquiry Modal Component
 * 
 * Allows clients to send inquiries about properties to their agent
 */
interface InquiryModalProps {
    property: PropertyListing;
    primaryColor: string;
    message: string;
    onMessageChange: (message: string) => void;
    onSend: () => void;
    onClose: () => void;
    sending: boolean;
}

function InquiryModal({
    property,
    primaryColor,
    message,
    onMessageChange,
    onSend,
    onClose,
    sending,
}: InquiryModalProps) {
    return (
        <div
            className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-gray-900 rounded-xl max-w-lg w-full shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        Ask About This Property
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        aria-label="Close inquiry form"
                    >
                        <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Property Info */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <p className="font-semibold text-gray-900 dark:text-white">
                            {property.address}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {property.city}, {property.state} {property.zip}
                        </p>
                    </div>

                    {/* Message Input */}
                    <div>
                        <Label htmlFor="inquiry-message" className="text-sm font-medium mb-2 block">
                            Your Message
                        </Label>
                        <textarea
                            id="inquiry-message"
                            value={message}
                            onChange={(e) => onMessageChange(e.target.value)}
                            placeholder="I'm interested in this property and would like to schedule a viewing..."
                            className="w-full min-h-[120px] px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <Button
                            onClick={onClose}
                            variant="outline"
                            className="flex-1"
                            disabled={sending}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={onSend}
                            disabled={!message.trim() || sending}
                            className="flex-1"
                            style={{
                                backgroundColor: primaryColor,
                                color: '#ffffff',
                            }}
                        >
                            {sending ? 'Sending...' : 'Send Inquiry'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
