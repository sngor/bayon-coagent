/**
 * MLS API Mock Handlers
 * 
 * Mocks MLS (Multiple Listing Service) APIs that provide:
 * - Listing data
 * - Price changes
 * - Status changes (new, sold, withdrawn, expired)
 * - Agent/competitor listing activity
 * - Market statistics
 */

import { http, HttpResponse } from 'msw';
import { mlsMockData } from '../data/mls-data';

// Base URL for MLS API (example - would be actual MLS provider endpoint)
const MLS_BASE_URL = 'https://api.mls.example.com';

export const mlsHandlers = [
    // Get listings for a specific area
    http.get(`${MLS_BASE_URL}/listings`, ({ request }) => {
        const url = new URL(request.url);
        const location = url.searchParams.get('location');
        const agentId = url.searchParams.get('agentId');
        const status = url.searchParams.get('status');
        const minPrice = url.searchParams.get('minPrice');
        const maxPrice = url.searchParams.get('maxPrice');
        const limit = parseInt(url.searchParams.get('limit') || '50');

        let filteredListings = mlsMockData.listings;

        if (location) {
            filteredListings = filteredListings.filter(listing =>
                listing.address.toLowerCase().includes(location.toLowerCase()) ||
                listing.city.toLowerCase().includes(location.toLowerCase()) ||
                listing.zipCode === location
            );
        }

        if (agentId) {
            filteredListings = filteredListings.filter(listing =>
                listing.listingAgentId === agentId
            );
        }

        if (status) {
            filteredListings = filteredListings.filter(listing =>
                listing.status.toLowerCase() === status.toLowerCase()
            );
        }

        if (minPrice) {
            filteredListings = filteredListings.filter(listing =>
                listing.price >= parseInt(minPrice)
            );
        }

        if (maxPrice) {
            filteredListings = filteredListings.filter(listing =>
                listing.price <= parseInt(maxPrice)
            );
        }

        // Apply limit
        filteredListings = filteredListings.slice(0, limit);

        return HttpResponse.json({
            listings: filteredListings,
            total: filteredListings.length,
            page: 1,
            limit
        });
    }),

    // Get listing by MLS number
    http.get(`${MLS_BASE_URL}/listings/:mlsNumber`, ({ params }) => {
        const { mlsNumber } = params;
        const listing = mlsMockData.listings.find(l => l.mlsNumber === mlsNumber);

        if (!listing) {
            return HttpResponse.json(
                { error: 'Listing not found' },
                { status: 404 }
            );
        }

        return HttpResponse.json({ listing });
    }),

    // Get price history for a listing
    http.get(`${MLS_BASE_URL}/listings/:mlsNumber/price-history`, ({ params }) => {
        const { mlsNumber } = params;
        const priceHistory = mlsMockData.priceHistory.filter(ph =>
            ph.mlsNumber === mlsNumber
        );

        return HttpResponse.json({
            mlsNumber,
            priceHistory: priceHistory.sort((a, b) =>
                new Date(a.date).getTime() - new Date(b.date).getTime()
            )
        });
    }),

    // Get status history for a listing
    http.get(`${MLS_BASE_URL}/listings/:mlsNumber/status-history`, ({ params }) => {
        const { mlsNumber } = params;
        const statusHistory = mlsMockData.statusHistory.filter(sh =>
            sh.mlsNumber === mlsNumber
        );

        return HttpResponse.json({
            mlsNumber,
            statusHistory: statusHistory.sort((a, b) =>
                new Date(a.date).getTime() - new Date(b.date).getTime()
            )
        });
    }),

    // Get agent listings
    http.get(`${MLS_BASE_URL}/agents/:agentId/listings`, ({ params, request }) => {
        const { agentId } = params;
        const url = new URL(request.url);
        const status = url.searchParams.get('status');
        const dateFrom = url.searchParams.get('dateFrom');

        let agentListings = mlsMockData.listings.filter(listing =>
            listing.listingAgentId === agentId
        );

        if (status) {
            agentListings = agentListings.filter(listing =>
                listing.status.toLowerCase() === status.toLowerCase()
            );
        }

        if (dateFrom) {
            agentListings = agentListings.filter(listing =>
                new Date(listing.listDate) >= new Date(dateFrom)
            );
        }

        return HttpResponse.json({
            agentId,
            listings: agentListings,
            total: agentListings.length
        });
    }),

    // Get market statistics
    http.get(`${MLS_BASE_URL}/market-stats`, ({ request }) => {
        const url = new URL(request.url);
        const location = url.searchParams.get('location');
        const period = url.searchParams.get('period') || '30'; // days

        // Filter listings for the location and time period
        const periodDays = parseInt(period);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - periodDays);

        let relevantListings = mlsMockData.listings;

        if (location) {
            relevantListings = relevantListings.filter(listing =>
                listing.address.toLowerCase().includes(location.toLowerCase()) ||
                listing.city.toLowerCase().includes(location.toLowerCase()) ||
                listing.zipCode === location
            );
        }

        const recentListings = relevantListings.filter(listing =>
            new Date(listing.listDate) >= cutoffDate
        );

        const soldListings = recentListings.filter(listing =>
            listing.status === 'Sold'
        );

        const activeListings = recentListings.filter(listing =>
            listing.status === 'Active'
        );

        // Calculate statistics
        const medianPrice = soldListings.length > 0
            ? soldListings.sort((a, b) => a.price - b.price)[Math.floor(soldListings.length / 2)].price
            : 0;

        const avgDaysOnMarket = soldListings.length > 0
            ? soldListings.reduce((sum, listing) => sum + listing.daysOnMarket, 0) / soldListings.length
            : 0;

        return HttpResponse.json({
            location,
            period: periodDays,
            statistics: {
                medianSalePrice: medianPrice,
                avgDaysOnMarket: Math.round(avgDaysOnMarket),
                salesVolume: soldListings.length,
                inventoryLevel: activeListings.length,
                totalListings: recentListings.length,
                pricePerSqFt: medianPrice > 0 ? Math.round(medianPrice / 2000) : 0 // Assuming avg 2000 sqft
            }
        });
    }),

    // Get recent listing changes (new, price reductions, status changes)
    http.get(`${MLS_BASE_URL}/recent-changes`, ({ request }) => {
        const url = new URL(request.url);
        const location = url.searchParams.get('location');
        const changeType = url.searchParams.get('changeType'); // 'new', 'price-reduction', 'status-change'
        const hours = parseInt(url.searchParams.get('hours') || '24');

        const cutoffDate = new Date();
        cutoffDate.setHours(cutoffDate.getHours() - hours);

        let changes: any[] = [];

        if (!changeType || changeType === 'new') {
            // New listings
            const newListings = mlsMockData.listings.filter(listing => {
                const listDate = new Date(listing.listDate);
                return listDate >= cutoffDate &&
                    (!location || listing.address.toLowerCase().includes(location.toLowerCase()));
            });

            changes.push(...newListings.map(listing => ({
                type: 'new-listing',
                mlsNumber: listing.mlsNumber,
                address: listing.address,
                price: listing.price,
                agentId: listing.listingAgentId,
                date: listing.listDate
            })));
        }

        if (!changeType || changeType === 'price-reduction') {
            // Price reductions
            const recentPriceChanges = mlsMockData.priceHistory.filter(ph => {
                const changeDate = new Date(ph.date);
                return changeDate >= cutoffDate && ph.changeType === 'reduction' &&
                    (!location || mlsMockData.listings.find(l =>
                        l.mlsNumber === ph.mlsNumber &&
                        l.address.toLowerCase().includes(location.toLowerCase())
                    ));
            });

            changes.push(...recentPriceChanges.map(change => ({
                type: 'price-reduction',
                mlsNumber: change.mlsNumber,
                oldPrice: change.oldPrice,
                newPrice: change.newPrice,
                reductionAmount: change.oldPrice - change.newPrice,
                reductionPercent: ((change.oldPrice - change.newPrice) / change.oldPrice) * 100,
                date: change.date
            })));
        }

        if (!changeType || changeType === 'status-change') {
            // Status changes
            const recentStatusChanges = mlsMockData.statusHistory.filter(sh => {
                const changeDate = new Date(sh.date);
                return changeDate >= cutoffDate &&
                    (!location || mlsMockData.listings.find(l =>
                        l.mlsNumber === sh.mlsNumber &&
                        l.address.toLowerCase().includes(location.toLowerCase())
                    ));
            });

            changes.push(...recentStatusChanges.map(change => ({
                type: 'status-change',
                mlsNumber: change.mlsNumber,
                oldStatus: change.oldStatus,
                newStatus: change.newStatus,
                date: change.date
            })));
        }

        // Sort by date (most recent first)
        changes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return HttpResponse.json({
            changes,
            total: changes.length,
            location,
            hours,
            changeType
        });
    }),

    // Error simulation
    http.get(`${MLS_BASE_URL}/error-test`, () => {
        return HttpResponse.json(
            { error: 'MLS service temporarily unavailable' },
            { status: 503 }
        );
    }),
];