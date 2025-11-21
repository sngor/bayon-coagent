/**
 * Mock data for Google Places API
 * 
 * Contains sample places data for testing amenities functionality
 * in neighborhood profile generation.
 */

export const googlePlacesMockData = {
    places: [
        // Austin restaurants
        {
            place_id: 'place-001',
            name: 'The Local Bistro',
            formatted_address: '123 Main St, Austin, TX 78701, USA',
            vicinity: 'Downtown Austin',
            types: ['restaurant', 'food', 'establishment'],
            rating: 4.5,
            user_ratings_total: 342,
            price_level: 2,
            geometry: {
                location: {
                    lat: 30.2672,
                    lng: -97.7431
                }
            },
            opening_hours: {
                open_now: true
            },
            photos: [
                {
                    photo_reference: 'photo-ref-001',
                    height: 400,
                    width: 600
                }
            ]
        },
        {
            place_id: 'place-002',
            name: 'Sakura Sushi',
            formatted_address: '456 Oak Ave, Austin, TX 78701, USA',
            vicinity: 'Downtown Austin',
            types: ['restaurant', 'food', 'establishment', 'meal_takeaway'],
            rating: 4.3,
            user_ratings_total: 189,
            price_level: 2,
            geometry: {
                location: {
                    lat: 30.2682,
                    lng: -97.7441
                }
            },
            opening_hours: {
                open_now: false
            }
        },
        {
            place_id: 'place-003',
            name: 'Coffee Corner',
            formatted_address: '789 Pine St, Austin, TX 78701, USA',
            vicinity: 'Downtown Austin',
            types: ['cafe', 'food', 'establishment'],
            rating: 4.7,
            user_ratings_total: 567,
            price_level: 1,
            geometry: {
                location: {
                    lat: 30.2662,
                    lng: -97.7421
                }
            },
            opening_hours: {
                open_now: true
            }
        },

        // Austin shopping
        {
            place_id: 'place-004',
            name: 'Main Street Market',
            formatted_address: '321 Main St, Austin, TX 78701, USA',
            vicinity: 'Downtown Austin',
            types: ['grocery_or_supermarket', 'food', 'store', 'establishment'],
            rating: 4.2,
            user_ratings_total: 234,
            price_level: 2,
            geometry: {
                location: {
                    lat: 30.2692,
                    lng: -97.7451
                }
            },
            opening_hours: {
                open_now: true
            }
        },
        {
            place_id: 'place-005',
            name: 'Fashion Plaza',
            formatted_address: '654 Style Blvd, Austin, TX 78701, USA',
            vicinity: 'Downtown Austin',
            types: ['shopping_mall', 'store', 'establishment'],
            rating: 4.0,
            user_ratings_total: 445,
            price_level: 3,
            geometry: {
                location: {
                    lat: 30.2702,
                    lng: -97.7461
                }
            },
            opening_hours: {
                open_now: true
            }
        },

        // Austin parks and recreation
        {
            place_id: 'place-006',
            name: 'Central Park',
            formatted_address: '987 Park Ave, Austin, TX 78701, USA',
            vicinity: 'Downtown Austin',
            types: ['park', 'establishment'],
            rating: 4.6,
            user_ratings_total: 892,
            geometry: {
                location: {
                    lat: 30.2712,
                    lng: -97.7471
                }
            },
            opening_hours: {
                open_now: true
            }
        },
        {
            place_id: 'place-007',
            name: 'Riverside Trail',
            formatted_address: 'Riverside Dr, Austin, TX 78701, USA',
            vicinity: 'Downtown Austin',
            types: ['park', 'tourist_attraction', 'establishment'],
            rating: 4.4,
            user_ratings_total: 156,
            geometry: {
                location: {
                    lat: 30.2722,
                    lng: -97.7481
                }
            },
            opening_hours: {
                open_now: true
            }
        },

        // Austin healthcare
        {
            place_id: 'place-008',
            name: 'Family Medical Center',
            formatted_address: '147 Health St, Austin, TX 78701, USA',
            vicinity: 'Downtown Austin',
            types: ['hospital', 'health', 'establishment'],
            rating: 4.1,
            user_ratings_total: 78,
            geometry: {
                location: {
                    lat: 30.2732,
                    lng: -97.7491
                }
            },
            opening_hours: {
                open_now: true
            }
        },
        {
            place_id: 'place-009',
            name: 'Urgent Care Plus',
            formatted_address: '258 Care Blvd, Austin, TX 78701, USA',
            vicinity: 'Downtown Austin',
            types: ['hospital', 'health', 'establishment'],
            rating: 3.9,
            user_ratings_total: 124,
            geometry: {
                location: {
                    lat: 30.2742,
                    lng: -97.7501
                }
            },
            opening_hours: {
                open_now: true
            }
        },

        // Austin entertainment
        {
            place_id: 'place-010',
            name: 'Regal Cinema',
            formatted_address: '369 Movie Ln, Austin, TX 78701, USA',
            vicinity: 'Downtown Austin',
            types: ['movie_theater', 'entertainment', 'establishment'],
            rating: 4.2,
            user_ratings_total: 567,
            price_level: 2,
            geometry: {
                location: {
                    lat: 30.2752,
                    lng: -97.7511
                }
            },
            opening_hours: {
                open_now: true
            }
        },
        {
            place_id: 'place-011',
            name: 'Fitness First',
            formatted_address: '741 Gym St, Austin, TX 78701, USA',
            vicinity: 'Downtown Austin',
            types: ['gym', 'health', 'establishment'],
            rating: 4.3,
            user_ratings_total: 289,
            price_level: 2,
            geometry: {
                location: {
                    lat: 30.2762,
                    lng: -97.7521
                }
            },
            opening_hours: {
                open_now: true
            }
        },

        // Dallas places
        {
            place_id: 'place-012',
            name: 'Dallas Diner',
            formatted_address: '500 Main St, Dallas, TX 75201, USA',
            vicinity: 'Downtown Dallas',
            types: ['restaurant', 'food', 'establishment'],
            rating: 4.4,
            user_ratings_total: 423,
            price_level: 2,
            geometry: {
                location: {
                    lat: 32.7767,
                    lng: -96.7970
                }
            },
            opening_hours: {
                open_now: true
            }
        },
        {
            place_id: 'place-013',
            name: 'Dallas Arts District',
            formatted_address: '600 Arts Plaza, Dallas, TX 75201, USA',
            vicinity: 'Downtown Dallas',
            types: ['tourist_attraction', 'establishment'],
            rating: 4.8,
            user_ratings_total: 1234,
            geometry: {
                location: {
                    lat: 32.7877,
                    lng: -96.8070
                }
            },
            opening_hours: {
                open_now: true
            }
        },

        // Houston places
        {
            place_id: 'place-014',
            name: 'Houston Tex-Mex',
            formatted_address: '800 Houston St, Houston, TX 77001, USA',
            vicinity: 'Downtown Houston',
            types: ['restaurant', 'food', 'establishment'],
            rating: 4.5,
            user_ratings_total: 678,
            price_level: 2,
            geometry: {
                location: {
                    lat: 29.7604,
                    lng: -95.3698
                }
            },
            opening_hours: {
                open_now: true
            }
        },
        {
            place_id: 'place-015',
            name: 'Energy Museum',
            formatted_address: '900 Energy Blvd, Houston, TX 77001, USA',
            vicinity: 'Downtown Houston',
            types: ['museum', 'tourist_attraction', 'establishment'],
            rating: 4.3,
            user_ratings_total: 345,
            geometry: {
                location: {
                    lat: 29.7714,
                    lng: -95.3798
                }
            },
            opening_hours: {
                open_now: false
            }
        },

        // Plano places
        {
            place_id: 'place-016',
            name: 'Plano Family Restaurant',
            formatted_address: '1000 Excellence Way, Plano, TX 75023, USA',
            vicinity: 'West Plano',
            types: ['restaurant', 'food', 'establishment'],
            rating: 4.6,
            user_ratings_total: 234,
            price_level: 2,
            geometry: {
                location: {
                    lat: 33.0198,
                    lng: -96.6989
                }
            },
            opening_hours: {
                open_now: true
            }
        },
        {
            place_id: 'place-017',
            name: 'Plano Shopping Center',
            formatted_address: '1100 Shopping Dr, Plano, TX 75023, USA',
            vicinity: 'West Plano',
            types: ['shopping_mall', 'store', 'establishment'],
            rating: 4.2,
            user_ratings_total: 567,
            price_level: 2,
            geometry: {
                location: {
                    lat: 33.0298,
                    lng: -96.7089
                }
            },
            opening_hours: {
                open_now: true
            }
        }
    ],

    placeDetails: [
        {
            place_id: 'place-001',
            formatted_phone_number: '(512) 555-0101',
            website: 'https://thelocalbistro.com',
            reviews: [
                {
                    author_name: 'John D.',
                    rating: 5,
                    text: 'Excellent food and service. The atmosphere is perfect for a date night.',
                    time: 1640995200
                },
                {
                    author_name: 'Sarah M.',
                    rating: 4,
                    text: 'Great local spot with fresh ingredients. Highly recommend the pasta.',
                    time: 1640908800
                }
            ],
            opening_hours: {
                open_now: true,
                weekday_text: [
                    'Monday: 11:00 AM – 10:00 PM',
                    'Tuesday: 11:00 AM – 10:00 PM',
                    'Wednesday: 11:00 AM – 10:00 PM',
                    'Thursday: 11:00 AM – 10:00 PM',
                    'Friday: 11:00 AM – 11:00 PM',
                    'Saturday: 10:00 AM – 11:00 PM',
                    'Sunday: 10:00 AM – 9:00 PM'
                ]
            }
        },
        {
            place_id: 'place-004',
            formatted_phone_number: '(512) 555-0104',
            website: 'https://mainstreetmarket.com',
            reviews: [
                {
                    author_name: 'Mike R.',
                    rating: 4,
                    text: 'Good selection of organic produce. Prices are reasonable.',
                    time: 1640995200
                }
            ],
            opening_hours: {
                open_now: true,
                weekday_text: [
                    'Monday: 7:00 AM – 10:00 PM',
                    'Tuesday: 7:00 AM – 10:00 PM',
                    'Wednesday: 7:00 AM – 10:00 PM',
                    'Thursday: 7:00 AM – 10:00 PM',
                    'Friday: 7:00 AM – 10:00 PM',
                    'Saturday: 7:00 AM – 10:00 PM',
                    'Sunday: 8:00 AM – 9:00 PM'
                ]
            }
        },
        {
            place_id: 'place-006',
            formatted_phone_number: '(512) 555-0106',
            website: 'https://austinparks.gov/central-park',
            reviews: [
                {
                    author_name: 'Lisa K.',
                    rating: 5,
                    text: 'Beautiful park with great walking trails. Perfect for families.',
                    time: 1640995200
                },
                {
                    author_name: 'Tom B.',
                    rating: 4,
                    text: 'Nice green space in the heart of the city. Well maintained.',
                    time: 1640908800
                }
            ],
            opening_hours: {
                open_now: true,
                weekday_text: [
                    'Monday: 6:00 AM – 10:00 PM',
                    'Tuesday: 6:00 AM – 10:00 PM',
                    'Wednesday: 6:00 AM – 10:00 PM',
                    'Thursday: 6:00 AM – 10:00 PM',
                    'Friday: 6:00 AM – 10:00 PM',
                    'Saturday: 6:00 AM – 10:00 PM',
                    'Sunday: 6:00 AM – 10:00 PM'
                ]
            }
        }
    ]
};