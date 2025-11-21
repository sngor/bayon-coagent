/**
 * Mock data for MLS APIs
 * 
 * Contains sample MLS listing data for testing competitor monitoring
 * and price reduction detection functionality.
 */

export const mlsMockData = {
    listings: [
        // Active listings
        {
            mlsNumber: 'MLS001',
            address: '123 Main St',
            city: 'Austin',
            state: 'TX',
            zipCode: '78701',
            price: 450000,
            originalPrice: 475000,
            status: 'Active',
            listDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
            daysOnMarket: 5,
            bedrooms: 3,
            bathrooms: 2,
            squareFeet: 1800,
            propertyType: 'Single Family',
            listingAgentId: 'agent-001',
            listingAgentName: 'John Smith',
            listingOfficeName: 'Smith Realty',
            description: 'Beautiful home in downtown Austin',
            photos: ['photo1.jpg', 'photo2.jpg'],
            latitude: 30.2672,
            longitude: -97.7431
        },
        {
            mlsNumber: 'MLS002',
            address: '456 Oak Ave',
            city: 'Dallas',
            state: 'TX',
            zipCode: '75201',
            price: 325000,
            originalPrice: 325000,
            status: 'Active',
            listDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), // 12 days ago
            daysOnMarket: 12,
            bedrooms: 2,
            bathrooms: 2,
            squareFeet: 1200,
            propertyType: 'Condo',
            listingAgentId: 'agent-002',
            listingAgentName: 'Jane Doe',
            listingOfficeName: 'Doe Properties',
            description: 'Modern condo in downtown Dallas',
            photos: ['photo3.jpg', 'photo4.jpg'],
            latitude: 32.7767,
            longitude: -96.7970
        },
        {
            mlsNumber: 'MLS003',
            address: '789 Pine St',
            city: 'Houston',
            state: 'TX',
            zipCode: '77001',
            price: 380000,
            originalPrice: 420000,
            status: 'Active',
            listDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(), // 25 days ago
            daysOnMarket: 25,
            bedrooms: 4,
            bathrooms: 3,
            squareFeet: 2200,
            propertyType: 'Single Family',
            listingAgentId: 'agent-003',
            listingAgentName: 'Bob Wilson',
            listingOfficeName: 'Wilson Real Estate',
            description: 'Spacious family home near downtown Houston',
            photos: ['photo5.jpg', 'photo6.jpg'],
            latitude: 29.7604,
            longitude: -95.3698
        },

        // Recently sold listings
        {
            mlsNumber: 'MLS004',
            address: '321 Elm St',
            city: 'Austin',
            state: 'TX',
            zipCode: '78702',
            price: 395000,
            originalPrice: 410000,
            status: 'Sold',
            listDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
            soldDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
            daysOnMarket: 42,
            bedrooms: 3,
            bathrooms: 2.5,
            squareFeet: 1950,
            propertyType: 'Single Family',
            listingAgentId: 'agent-001',
            listingAgentName: 'John Smith',
            listingOfficeName: 'Smith Realty',
            description: 'Charming home in East Austin',
            photos: ['photo7.jpg', 'photo8.jpg'],
            latitude: 30.2672,
            longitude: -97.7331
        },
        {
            mlsNumber: 'MLS005',
            address: '654 Maple Dr',
            city: 'Plano',
            state: 'TX',
            zipCode: '75023',
            price: 525000,
            originalPrice: 525000,
            status: 'Sold',
            listDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            soldDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
            daysOnMarket: 23,
            bedrooms: 4,
            bathrooms: 3,
            squareFeet: 2800,
            propertyType: 'Single Family',
            listingAgentId: 'agent-004',
            listingAgentName: 'Sarah Johnson',
            listingOfficeName: 'Johnson & Associates',
            description: 'Luxury home in prestigious Plano neighborhood',
            photos: ['photo9.jpg', 'photo10.jpg'],
            latitude: 33.0198,
            longitude: -96.6989
        },

        // Withdrawn/Expired listings
        {
            mlsNumber: 'MLS006',
            address: '987 Cedar Ln',
            city: 'Fort Worth',
            state: 'TX',
            zipCode: '76101',
            price: 275000,
            originalPrice: 295000,
            status: 'Withdrawn',
            listDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
            withdrawnDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
            daysOnMarket: 58,
            bedrooms: 3,
            bathrooms: 2,
            squareFeet: 1600,
            propertyType: 'Single Family',
            listingAgentId: 'agent-005',
            listingAgentName: 'Mike Brown',
            listingOfficeName: 'Brown Realty Group',
            description: 'Cozy home in Fort Worth',
            photos: ['photo11.jpg', 'photo12.jpg'],
            latitude: 32.7555,
            longitude: -97.3308
        },
        {
            mlsNumber: 'MLS007',
            address: '147 Birch Way',
            city: 'Arlington',
            state: 'TX',
            zipCode: '76001',
            price: 310000,
            originalPrice: 330000,
            status: 'Expired',
            listDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
            expiredDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
            daysOnMarket: 89,
            bedrooms: 3,
            bathrooms: 2,
            squareFeet: 1750,
            propertyType: 'Single Family',
            listingAgentId: 'agent-006',
            listingAgentName: 'Lisa Davis',
            listingOfficeName: 'Davis Real Estate',
            description: 'Well-maintained home in Arlington',
            photos: ['photo13.jpg', 'photo14.jpg'],
            latitude: 32.7357,
            longitude: -97.1081
        }
    ],

    priceHistory: [
        // Price reductions
        {
            mlsNumber: 'MLS001',
            date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
            oldPrice: 475000,
            newPrice: 450000,
            changeType: 'reduction',
            changeAmount: -25000,
            changePercent: -5.26,
            reason: 'Market adjustment'
        },
        {
            mlsNumber: 'MLS003',
            date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
            oldPrice: 420000,
            newPrice: 380000,
            changeType: 'reduction',
            changeAmount: -40000,
            changePercent: -9.52,
            reason: 'Seller motivated'
        },
        {
            mlsNumber: 'MLS004',
            date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
            oldPrice: 410000,
            newPrice: 395000,
            changeType: 'reduction',
            changeAmount: -15000,
            changePercent: -3.66,
            reason: 'Competitive pricing'
        },
        {
            mlsNumber: 'MLS006',
            date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days ago
            oldPrice: 295000,
            newPrice: 275000,
            changeType: 'reduction',
            changeAmount: -20000,
            changePercent: -6.78,
            reason: 'Price to sell'
        },
        {
            mlsNumber: 'MLS007',
            date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days ago
            oldPrice: 330000,
            newPrice: 310000,
            changeType: 'reduction',
            changeAmount: -20000,
            changePercent: -6.06,
            reason: 'Market conditions'
        }
    ],

    statusHistory: [
        // Recent status changes
        {
            mlsNumber: 'MLS004',
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
            oldStatus: 'Active',
            newStatus: 'Sold',
            reason: 'Accepted offer'
        },
        {
            mlsNumber: 'MLS005',
            date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
            oldStatus: 'Active',
            newStatus: 'Sold',
            reason: 'Closed transaction'
        },
        {
            mlsNumber: 'MLS006',
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
            oldStatus: 'Active',
            newStatus: 'Withdrawn',
            reason: 'Seller decision'
        },
        {
            mlsNumber: 'MLS007',
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
            oldStatus: 'Active',
            newStatus: 'Expired',
            reason: 'Listing period ended'
        }
    ],

    agents: [
        {
            id: 'agent-001',
            name: 'John Smith',
            licenseNumber: 'TX-12345',
            officeName: 'Smith Realty',
            phone: '(512) 555-0101',
            email: 'john@smithrealty.com',
            activeListings: 3,
            soldThisYear: 25,
            averageDaysOnMarket: 28
        },
        {
            id: 'agent-002',
            name: 'Jane Doe',
            licenseNumber: 'TX-23456',
            officeName: 'Doe Properties',
            phone: '(214) 555-0202',
            email: 'jane@doeproperties.com',
            activeListings: 5,
            soldThisYear: 18,
            averageDaysOnMarket: 35
        },
        {
            id: 'agent-003',
            name: 'Bob Wilson',
            licenseNumber: 'TX-34567',
            officeName: 'Wilson Real Estate',
            phone: '(713) 555-0303',
            email: 'bob@wilsonre.com',
            activeListings: 2,
            soldThisYear: 32,
            averageDaysOnMarket: 22
        },
        {
            id: 'agent-004',
            name: 'Sarah Johnson',
            licenseNumber: 'TX-45678',
            officeName: 'Johnson & Associates',
            phone: '(972) 555-0404',
            email: 'sarah@johnsonassoc.com',
            activeListings: 7,
            soldThisYear: 41,
            averageDaysOnMarket: 19
        },
        {
            id: 'agent-005',
            name: 'Mike Brown',
            licenseNumber: 'TX-56789',
            officeName: 'Brown Realty Group',
            phone: '(817) 555-0505',
            email: 'mike@brownrealty.com',
            activeListings: 4,
            soldThisYear: 15,
            averageDaysOnMarket: 42
        },
        {
            id: 'agent-006',
            name: 'Lisa Davis',
            licenseNumber: 'TX-67890',
            officeName: 'Davis Real Estate',
            phone: '(817) 555-0606',
            email: 'lisa@davisre.com',
            activeListings: 6,
            soldThisYear: 28,
            averageDaysOnMarket: 31
        }
    ]
};