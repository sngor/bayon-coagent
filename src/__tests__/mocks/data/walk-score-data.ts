/**
 * Mock data for Walk Score API
 * 
 * Contains sample walkability data for testing neighborhood profile
 * generation functionality.
 */

export const walkScoreMockData = {
    locations: [
        // Austin locations
        {
            address: '123 Main St, Austin, TX 78701',
            city: 'Austin',
            state: 'TX',
            zipCode: '78701',
            lat: 30.2672,
            lon: -97.7431,
            walkScore: 89,
            description: 'Very Walkable',
            transitScore: 65,
            bikeScore: 78,
            updated: '2024-01-15'
        },
        {
            address: '456 Oak Ave, Austin, TX 78702',
            city: 'Austin',
            state: 'TX',
            zipCode: '78702',
            lat: 30.2692,
            lon: -97.7351,
            walkScore: 72,
            description: 'Very Walkable',
            transitScore: 45,
            bikeScore: 68,
            updated: '2024-01-15'
        },

        // Dallas locations
        {
            address: '500 Main St, Dallas, TX 75201',
            city: 'Dallas',
            state: 'TX',
            zipCode: '75201',
            lat: 32.7767,
            lon: -96.7970,
            walkScore: 85,
            description: 'Very Walkable',
            transitScore: 72,
            bikeScore: 58,
            updated: '2024-01-15'
        },
        {
            address: '600 Arts Plaza, Dallas, TX 75201',
            city: 'Dallas',
            state: 'TX',
            zipCode: '75201',
            lat: 32.7877,
            lon: -96.8070,
            walkScore: 91,
            description: 'Walker\'s Paradise',
            transitScore: 78,
            bikeScore: 62,
            updated: '2024-01-15'
        },

        // Houston locations
        {
            address: '800 Houston St, Houston, TX 77001',
            city: 'Houston',
            state: 'TX',
            zipCode: '77001',
            lat: 29.7604,
            lon: -95.3698,
            walkScore: 76,
            description: 'Very Walkable',
            transitScore: 52,
            bikeScore: 45,
            updated: '2024-01-15'
        },
        {
            address: '900 Energy Blvd, Houston, TX 77001',
            city: 'Houston',
            state: 'TX',
            zipCode: '77001',
            lat: 29.7714,
            lon: -95.3798,
            walkScore: 68,
            description: 'Somewhat Walkable',
            transitScore: 48,
            bikeScore: 42,
            updated: '2024-01-15'
        },

        // Plano locations
        {
            address: '1000 Excellence Way, Plano, TX 75023',
            city: 'Plano',
            state: 'TX',
            zipCode: '75023',
            lat: 33.0198,
            lon: -96.6989,
            walkScore: 45,
            description: 'Car-Dependent',
            transitScore: 25,
            bikeScore: 38,
            updated: '2024-01-15'
        },
        {
            address: '1100 Shopping Dr, Plano, TX 75023',
            city: 'Plano',
            state: 'TX',
            zipCode: '75023',
            lat: 33.0298,
            lon: -96.7089,
            walkScore: 52,
            description: 'Somewhat Walkable',
            transitScore: 28,
            bikeScore: 41,
            updated: '2024-01-15'
        },

        // Fort Worth locations
        {
            address: '1300 Cowtown Ave, Fort Worth, TX 76101',
            city: 'Fort Worth',
            state: 'TX',
            zipCode: '76101',
            lat: 32.7555,
            lon: -97.3308,
            walkScore: 58,
            description: 'Somewhat Walkable',
            transitScore: 35,
            bikeScore: 48,
            updated: '2024-01-15'
        },

        // Arlington locations
        {
            address: '1400 Heights Rd, Arlington, TX 76001',
            city: 'Arlington',
            state: 'TX',
            zipCode: '76001',
            lat: 32.7357,
            lon: -97.1081,
            walkScore: 42,
            description: 'Car-Dependent',
            transitScore: 22,
            bikeScore: 35,
            updated: '2024-01-15'
        },
        {
            address: '1500 Maverick Way, Arlington, TX 76001',
            city: 'Arlington',
            state: 'TX',
            zipCode: '76001',
            lat: 32.7367,
            lon: -97.1091,
            walkScore: 48,
            description: 'Car-Dependent',
            transitScore: 26,
            bikeScore: 39,
            updated: '2024-01-15'
        },

        // Additional test locations with various scores
        {
            address: 'Walker\'s Paradise Test Location',
            city: 'Test City',
            state: 'TX',
            zipCode: '99999',
            lat: 30.0000,
            lon: -97.0000,
            walkScore: 95,
            description: 'Walker\'s Paradise',
            transitScore: 88,
            bikeScore: 85,
            updated: '2024-01-15'
        },
        {
            address: 'Car-Dependent Test Location',
            city: 'Test City',
            state: 'TX',
            zipCode: '99998',
            lat: 30.0010,
            lon: -97.0010,
            walkScore: 15,
            description: 'Car-Dependent',
            transitScore: 8,
            bikeScore: 12,
            updated: '2024-01-15'
        },
        {
            address: 'Somewhat Walkable Test Location',
            city: 'Test City',
            state: 'TX',
            zipCode: '99997',
            lat: 30.0020,
            lon: -97.0020,
            walkScore: 55,
            description: 'Somewhat Walkable',
            transitScore: 42,
            bikeScore: 48,
            updated: '2024-01-15'
        }
    ],

    // Walk Score categories for reference
    scoreCategories: {
        'walkers-paradise': { min: 90, max: 100, description: 'Walker\'s Paradise' },
        'very-walkable': { min: 70, max: 89, description: 'Very Walkable' },
        'somewhat-walkable': { min: 50, max: 69, description: 'Somewhat Walkable' },
        'car-dependent': { min: 25, max: 49, description: 'Car-Dependent' },
        'car-dependent-minimal': { min: 0, max: 24, description: 'Car-Dependent' }
    },

    // Transit Score categories
    transitCategories: {
        'excellent': { min: 90, max: 100, description: 'Excellent Transit' },
        'excellent-lower': { min: 70, max: 89, description: 'Excellent Transit' },
        'good': { min: 50, max: 69, description: 'Good Transit' },
        'some': { min: 25, max: 49, description: 'Some Transit' },
        'minimal': { min: 0, max: 24, description: 'Minimal Transit' }
    },

    // Bike Score categories
    bikeCategories: {
        'bikers-paradise': { min: 90, max: 100, description: 'Biker\'s Paradise' },
        'very-bikeable': { min: 70, max: 89, description: 'Very Bikeable' },
        'bikeable': { min: 50, max: 69, description: 'Bikeable' },
        'somewhat-bikeable': { min: 25, max: 49, description: 'Somewhat Bikeable' },
        'not-bikeable': { min: 0, max: 24, description: 'Not Bikeable' }
    }
};