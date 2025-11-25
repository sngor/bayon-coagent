/**
 * Mock data for Public Records APIs
 * 
 * Contains sample life event data for testing the life event analyzer
 * and lead scoring functionality.
 */

export const publicRecordsMockData = {
    lifeEvents: [
        // Marriage records
        {
            id: 'marriage-001',
            personId: 'person-001',
            eventType: 'marriage' as const,
            eventDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
            location: 'Seattle, WA 98101',
            confidence: 95,
            source: 'king-county-clerk',
            details: {
                spouseName: 'Jane Smith',
                marriageDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
                venue: 'Seattle City Hall'
            }
        },
        {
            id: 'marriage-002',
            personId: 'person-002',
            eventType: 'marriage' as const,
            eventDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days ago
            location: 'Dallas, TX 75201',
            confidence: 90,
            source: 'dallas-county-clerk',
            details: {
                spouseName: 'Michael Johnson',
                marriageDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
                venue: 'Dallas Wedding Chapel'
            }
        },

        // Divorce records
        {
            id: 'divorce-001',
            personId: 'person-003',
            eventType: 'divorce' as const,
            eventDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
            location: 'Houston, TX 77001',
            confidence: 88,
            source: 'harris-county-clerk',
            details: {
                filingDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                finalizedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                hasChildren: true,
                propertyDivision: true
            }
        },
        {
            id: 'divorce-002',
            personId: 'person-004',
            eventType: 'divorce' as const,
            eventDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
            location: 'Bellevue, WA 98004',
            confidence: 92,
            source: 'king-county-clerk',
            details: {
                filingDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
                finalizedDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
                hasChildren: false,
                propertyDivision: true
            }
        },

        // Job change records
        {
            id: 'job-change-001',
            personId: 'person-005',
            eventType: 'job-change' as const,
            eventDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days ago
            location: 'Seattle, WA 98101',
            confidence: 75,
            source: 'employment-verification',
            details: {
                previousEmployer: 'Tech Corp',
                newEmployer: 'Innovation Inc',
                startDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
                salaryIncrease: true,
                relocationRequired: false
            }
        },
        {
            id: 'job-change-002',
            personId: 'person-006',
            eventType: 'job-change' as const,
            eventDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
            location: 'Dallas, TX 75201',
            confidence: 80,
            source: 'employment-verification',
            details: {
                previousEmployer: 'Local Bank',
                newEmployer: 'National Finance',
                startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
                salaryIncrease: true,
                relocationRequired: true
            }
        },

        // Retirement records
        {
            id: 'retirement-001',
            personId: 'person-007',
            eventType: 'retirement' as const,
            eventDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(), // 25 days ago
            location: 'Fort Worth, TX 76101',
            confidence: 85,
            source: 'social-security-admin',
            details: {
                retirementDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
                previousEmployer: 'City of Fort Worth',
                pensionBenefits: true,
                age: 65
            }
        },

        // Birth records
        {
            id: 'birth-001',
            personId: 'person-008',
            eventType: 'birth' as const,
            eventDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(), // 35 days ago
            location: 'Plano, TX 75023',
            confidence: 98,
            source: 'vital-records',
            details: {
                birthDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
                hospital: 'Plano Medical Center',
                parentNames: ['John Doe', 'Jane Doe'],
                firstChild: false
            }
        },
        {
            id: 'birth-002',
            personId: 'person-009',
            eventType: 'birth' as const,
            eventDate: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(), // 50 days ago
            location: 'Arlington, TX 76001',
            confidence: 96,
            source: 'vital-records',
            details: {
                birthDate: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
                hospital: 'Arlington Memorial Hospital',
                parentNames: ['Robert Smith', 'Lisa Smith'],
                firstChild: true
            }
        },

        // Death records
        {
            id: 'death-001',
            personId: 'person-010',
            eventType: 'death' as const,
            eventDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(), // 40 days ago
            location: 'Irving, TX 75001',
            confidence: 100,
            source: 'vital-records',
            details: {
                deathDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
                age: 78,
                survivingSpouse: true,
                estate: true,
                propertyOwned: true
            }
        }
    ],

    propertyOwnershipChanges: [
        {
            id: 'property-001',
            propertyAddress: '123 Main St, Seattle, WA 98101',
            previousOwner: 'John Smith',
            newOwner: 'Jane Doe',
            transferDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
            transferType: 'sale',
            salePrice: 450000,
            location: 'Seattle, WA 98101'
        },
        {
            id: 'property-002',
            propertyAddress: '456 Oak Ave, Bellevue, WA 98004',
            previousOwner: 'Estate of Robert Johnson',
            newOwner: 'Michael Brown',
            transferDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
            transferType: 'inheritance',
            salePrice: null,
            location: 'Dallas, TX 75201'
        },
        {
            id: 'property-003',
            propertyAddress: '789 Pine St, Tacoma, WA 98402',
            previousOwner: 'Sarah Wilson',
            newOwner: 'David Lee',
            transferDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            transferType: 'divorce-settlement',
            salePrice: null,
            location: 'Houston, TX 77001'
        }
    ],

    // Sample prospects with multiple events
    prospects: [
        {
            id: 'prospect-001',
            location: 'Seattle, WA 98101',
            events: [
                {
                    id: 'marriage-001',
                    personId: 'person-001',
                    eventType: 'marriage' as const,
                    eventDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
                    location: 'Seattle, WA 98101',
                    confidence: 95,
                    source: 'king-county-clerk'
                },
                {
                    id: 'job-change-003',
                    personId: 'person-001',
                    eventType: 'job-change' as const,
                    eventDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
                    location: 'Seattle, WA 98101',
                    confidence: 80,
                    source: 'employment-verification'
                }
            ],
            leadScore: 85,
            lastAnalyzed: new Date().toISOString()
        },
        {
            id: 'prospect-002',
            location: 'Dallas, TX 75201',
            events: [
                {
                    id: 'divorce-001',
                    personId: 'person-003',
                    eventType: 'divorce' as const,
                    eventDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                    location: 'Dallas, TX 75201',
                    confidence: 88,
                    source: 'dallas-county-clerk'
                }
            ],
            leadScore: 72,
            lastAnalyzed: new Date().toISOString()
        }
    ]
};