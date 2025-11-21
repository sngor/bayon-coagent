/**
 * Mock data for Schools APIs
 * 
 * Contains sample school rating data for testing neighborhood profile
 * generation functionality.
 */

export const schoolsMockData = {
    schools: [
        // Austin schools
        {
            id: 'school-001',
            name: 'Austin Elementary School',
            type: 'public' as const,
            grades: 'K-5',
            rating: 8,
            address: '100 School St',
            city: 'Austin',
            state: 'TX',
            zipCode: '78701',
            phone: '(512) 555-1001',
            website: 'https://austinelem.edu',
            enrollment: 450,
            studentTeacherRatio: 18,
            latitude: 30.2672,
            longitude: -97.7431,
            district: 'Austin ISD',
            principalName: 'Dr. Sarah Johnson'
        },
        {
            id: 'school-002',
            name: 'Central Austin Middle School',
            type: 'public' as const,
            grades: '6-8',
            rating: 7,
            address: '200 Education Ave',
            city: 'Austin',
            state: 'TX',
            zipCode: '78701',
            phone: '(512) 555-1002',
            website: 'https://centralms.edu',
            enrollment: 680,
            studentTeacherRatio: 22,
            latitude: 30.2682,
            longitude: -97.7441,
            district: 'Austin ISD',
            principalName: 'Mr. Robert Davis'
        },
        {
            id: 'school-003',
            name: 'Austin High School',
            type: 'public' as const,
            grades: '9-12',
            rating: 9,
            address: '300 Learning Blvd',
            city: 'Austin',
            state: 'TX',
            zipCode: '78702',
            phone: '(512) 555-1003',
            website: 'https://austinhs.edu',
            enrollment: 1200,
            studentTeacherRatio: 25,
            latitude: 30.2692,
            longitude: -97.7351,
            district: 'Austin ISD',
            principalName: 'Ms. Jennifer Wilson'
        },
        {
            id: 'school-004',
            name: 'St. Mary\'s Catholic School',
            type: 'private' as const,
            grades: 'K-12',
            rating: 9,
            address: '400 Faith Way',
            city: 'Austin',
            state: 'TX',
            zipCode: '78701',
            phone: '(512) 555-1004',
            website: 'https://stmarysaustin.edu',
            enrollment: 320,
            studentTeacherRatio: 12,
            latitude: 30.2662,
            longitude: -97.7421,
            district: 'Private',
            principalName: 'Sister Margaret O\'Brien'
        },

        // Dallas schools
        {
            id: 'school-005',
            name: 'Downtown Dallas Elementary',
            type: 'public' as const,
            grades: 'K-5',
            rating: 6,
            address: '500 Main St',
            city: 'Dallas',
            state: 'TX',
            zipCode: '75201',
            phone: '(214) 555-2001',
            website: 'https://downtownelem.edu',
            enrollment: 380,
            studentTeacherRatio: 20,
            latitude: 32.7767,
            longitude: -96.7970,
            district: 'Dallas ISD',
            principalName: 'Dr. Michael Brown'
        },
        {
            id: 'school-006',
            name: 'Dallas Arts Academy',
            type: 'public' as const,
            grades: '6-12',
            rating: 8,
            address: '600 Arts Plaza',
            city: 'Dallas',
            state: 'TX',
            zipCode: '75201',
            phone: '(214) 555-2002',
            website: 'https://dallasarts.edu',
            enrollment: 850,
            studentTeacherRatio: 19,
            latitude: 32.7777,
            longitude: -96.7980,
            district: 'Dallas ISD',
            principalName: 'Ms. Lisa Martinez'
        },
        {
            id: 'school-007',
            name: 'Trinity Preparatory School',
            type: 'private' as const,
            grades: '9-12',
            rating: 10,
            address: '700 Excellence Dr',
            city: 'Dallas',
            state: 'TX',
            zipCode: '75201',
            phone: '(214) 555-2003',
            website: 'https://trinityprep.edu',
            enrollment: 280,
            studentTeacherRatio: 8,
            latitude: 32.7787,
            longitude: -96.7990,
            district: 'Private',
            principalName: 'Dr. James Anderson'
        },

        // Houston schools
        {
            id: 'school-008',
            name: 'Houston Central Elementary',
            type: 'public' as const,
            grades: 'K-5',
            rating: 7,
            address: '800 Houston St',
            city: 'Houston',
            state: 'TX',
            zipCode: '77001',
            phone: '(713) 555-3001',
            website: 'https://houstoncentralelem.edu',
            enrollment: 520,
            studentTeacherRatio: 21,
            latitude: 29.7604,
            longitude: -95.3698,
            district: 'Houston ISD',
            principalName: 'Dr. Patricia Garcia'
        },
        {
            id: 'school-009',
            name: 'Energy Middle School',
            type: 'public' as const,
            grades: '6-8',
            rating: 6,
            address: '900 Energy Blvd',
            city: 'Houston',
            state: 'TX',
            zipCode: '77001',
            phone: '(713) 555-3002',
            website: 'https://energyms.edu',
            enrollment: 750,
            studentTeacherRatio: 24,
            latitude: 29.7614,
            longitude: -95.3708,
            district: 'Houston ISD',
            principalName: 'Mr. Carlos Rodriguez'
        },

        // Plano schools
        {
            id: 'school-010',
            name: 'Plano West Elementary',
            type: 'public' as const,
            grades: 'K-5',
            rating: 9,
            address: '1000 Excellence Way',
            city: 'Plano',
            state: 'TX',
            zipCode: '75023',
            phone: '(972) 555-4001',
            website: 'https://planowestelem.edu',
            enrollment: 650,
            studentTeacherRatio: 16,
            latitude: 33.0198,
            longitude: -96.6989,
            district: 'Plano ISD',
            principalName: 'Dr. Amanda Thompson'
        },
        {
            id: 'school-011',
            name: 'Plano West Middle School',
            type: 'public' as const,
            grades: '6-8',
            rating: 9,
            address: '1100 Achievement Dr',
            city: 'Plano',
            state: 'TX',
            zipCode: '75023',
            phone: '(972) 555-4002',
            website: 'https://planowestms.edu',
            enrollment: 980,
            studentTeacherRatio: 18,
            latitude: 33.0208,
            longitude: -96.6999,
            district: 'Plano ISD',
            principalName: 'Mr. David Kim'
        },
        {
            id: 'school-012',
            name: 'Plano West High School',
            type: 'public' as const,
            grades: '9-12',
            rating: 10,
            address: '1200 Success Blvd',
            city: 'Plano',
            state: 'TX',
            zipCode: '75023',
            phone: '(972) 555-4003',
            website: 'https://planowesths.edu',
            enrollment: 1850,
            studentTeacherRatio: 20,
            latitude: 33.0218,
            longitude: -96.7009,
            district: 'Plano ISD',
            principalName: 'Dr. Rachel Lee'
        },

        // Fort Worth schools
        {
            id: 'school-013',
            name: 'Fort Worth Elementary',
            type: 'public' as const,
            grades: 'K-5',
            rating: 6,
            address: '1300 Cowtown Ave',
            city: 'Fort Worth',
            state: 'TX',
            zipCode: '76101',
            phone: '(817) 555-5001',
            website: 'https://fwelem.edu',
            enrollment: 420,
            studentTeacherRatio: 22,
            latitude: 32.7555,
            longitude: -97.3308,
            district: 'Fort Worth ISD',
            principalName: 'Ms. Betty Johnson'
        },

        // Arlington schools
        {
            id: 'school-014',
            name: 'Arlington Heights Elementary',
            type: 'public' as const,
            grades: 'K-5',
            rating: 7,
            address: '1400 Heights Rd',
            city: 'Arlington',
            state: 'TX',
            zipCode: '76001',
            phone: '(817) 555-6001',
            website: 'https://arlingtonheights.edu',
            enrollment: 580,
            studentTeacherRatio: 19,
            latitude: 32.7357,
            longitude: -97.1081,
            district: 'Arlington ISD',
            principalName: 'Dr. Mark Williams'
        },
        {
            id: 'school-015',
            name: 'Arlington Middle School',
            type: 'public' as const,
            grades: '6-8',
            rating: 7,
            address: '1500 Maverick Way',
            city: 'Arlington',
            state: 'TX',
            zipCode: '76001',
            phone: '(817) 555-6002',
            website: 'https://arlingtonms.edu',
            enrollment: 820,
            studentTeacherRatio: 21,
            latitude: 32.7367,
            longitude: -97.1091,
            district: 'Arlington ISD',
            principalName: 'Ms. Susan Davis'
        }
    ],

    testScores: [
        // Sample test scores for schools
        {
            schoolId: 'school-001',
            year: '2023',
            testType: 'STAAR',
            subject: 'Reading',
            grade: '3',
            passRate: 85,
            masteryRate: 42
        },
        {
            schoolId: 'school-001',
            year: '2023',
            testType: 'STAAR',
            subject: 'Math',
            grade: '3',
            passRate: 78,
            masteryRate: 38
        },
        {
            schoolId: 'school-003',
            year: '2023',
            testType: 'SAT',
            subject: 'Combined',
            grade: '11',
            averageScore: 1285,
            stateAverage: 1020
        },
        {
            schoolId: 'school-007',
            year: '2023',
            testType: 'SAT',
            subject: 'Combined',
            grade: '11',
            averageScore: 1450,
            stateAverage: 1020
        },
        {
            schoolId: 'school-012',
            year: '2023',
            testType: 'SAT',
            subject: 'Combined',
            grade: '11',
            averageScore: 1380,
            stateAverage: 1020
        }
    ],

    demographics: [
        // Sample school demographics
        {
            schoolId: 'school-001',
            ethnicity: {
                white: 35.2,
                hispanic: 42.1,
                black: 12.8,
                asian: 8.4,
                other: 1.5
            },
            economicStatus: {
                freeReducedLunch: 58.3,
                title1Eligible: true
            },
            specialPrograms: {
                gifted: 12.5,
                specialEducation: 8.7,
                englishLearners: 23.4
            }
        },
        {
            schoolId: 'school-004',
            ethnicity: {
                white: 68.7,
                hispanic: 18.2,
                black: 5.1,
                asian: 6.8,
                other: 1.2
            },
            economicStatus: {
                freeReducedLunch: 15.2,
                title1Eligible: false
            },
            specialPrograms: {
                gifted: 28.3,
                specialEducation: 4.2,
                englishLearners: 8.1
            }
        },
        {
            schoolId: 'school-012',
            ethnicity: {
                white: 45.8,
                hispanic: 22.3,
                black: 8.9,
                asian: 21.2,
                other: 1.8
            },
            economicStatus: {
                freeReducedLunch: 25.7,
                title1Eligible: false
            },
            specialPrograms: {
                gifted: 35.4,
                specialEducation: 6.1,
                englishLearners: 12.8
            }
        }
    ]
};