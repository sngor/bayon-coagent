/**
 * Mock data for Demographics APIs
 * 
 * Contains sample demographic data for testing neighborhood profile
 * generation functionality.
 */

export const demographicsMockData = {
    areas: [
        // Austin areas
        {
            id: 'austin-78701',
            name: 'Austin, TX 78701',
            city: 'Austin',
            state: 'TX',
            zipCode: '78701',
            stateCode: '48',
            placeCode: '05000',
            population: 12450,
            medianHouseholdIncome: 85000,
            housingUnits: 6200,
            totalWorkers: 8900,
            ownerOccupiedPercent: 45,
            medianHomeValue: 650000,
            ageDistribution: {
                under18: 12.5,
                age18to34: 42.3,
                age35to54: 28.7,
                age55to74: 13.2,
                over75: 3.3
            },
            householdComposition: {
                familyHouseholds: 38.2,
                nonFamilyHouseholds: 61.8,
                averageHouseholdSize: 2.1
            },
            education: {
                highSchoolOrHigher: 95.8,
                bachelorsOrHigher: 78.4,
                graduateOrProfessional: 35.2
            },
            employment: {
                unemploymentRate: 3.2,
                topIndustries: ['Technology', 'Professional Services', 'Government', 'Healthcare']
            }
        },
        {
            id: 'austin-78702',
            name: 'Austin, TX 78702',
            city: 'Austin',
            state: 'TX',
            zipCode: '78702',
            stateCode: '48',
            placeCode: '05000',
            population: 18750,
            medianHouseholdIncome: 72000,
            housingUnits: 8900,
            totalWorkers: 12300,
            ownerOccupiedPercent: 62,
            medianHomeValue: 485000,
            ageDistribution: {
                under18: 18.7,
                age18to34: 35.2,
                age35to54: 32.1,
                age55to74: 11.8,
                over75: 2.2
            },
            householdComposition: {
                familyHouseholds: 52.3,
                nonFamilyHouseholds: 47.7,
                averageHouseholdSize: 2.4
            },
            education: {
                highSchoolOrHigher: 89.3,
                bachelorsOrHigher: 58.7,
                graduateOrProfessional: 22.1
            },
            employment: {
                unemploymentRate: 4.1,
                topIndustries: ['Technology', 'Construction', 'Retail', 'Food Service']
            }
        },

        // Dallas areas
        {
            id: 'dallas-75201',
            name: 'Dallas, TX 75201',
            city: 'Dallas',
            state: 'TX',
            zipCode: '75201',
            stateCode: '48',
            placeCode: '19000',
            population: 8920,
            medianHouseholdIncome: 95000,
            housingUnits: 5200,
            totalWorkers: 7100,
            ownerOccupiedPercent: 35,
            medianHomeValue: 580000,
            ageDistribution: {
                under18: 8.9,
                age18to34: 48.7,
                age35to54: 31.2,
                age55to74: 9.8,
                over75: 1.4
            },
            householdComposition: {
                familyHouseholds: 28.5,
                nonFamilyHouseholds: 71.5,
                averageHouseholdSize: 1.8
            },
            education: {
                highSchoolOrHigher: 97.2,
                bachelorsOrHigher: 82.1,
                graduateOrProfessional: 41.3
            },
            employment: {
                unemploymentRate: 2.8,
                topIndustries: ['Finance', 'Technology', 'Professional Services', 'Real Estate']
            }
        },

        // Houston areas
        {
            id: 'houston-77001',
            name: 'Houston, TX 77001',
            city: 'Houston',
            state: 'TX',
            zipCode: '77001',
            stateCode: '48',
            placeCode: '35000',
            population: 15600,
            medianHouseholdIncome: 78000,
            housingUnits: 7800,
            totalWorkers: 10200,
            ownerOccupiedPercent: 48,
            medianHomeValue: 420000,
            ageDistribution: {
                under18: 15.3,
                age18to34: 38.9,
                age35to54: 30.7,
                age55to74: 12.8,
                over75: 2.3
            },
            householdComposition: {
                familyHouseholds: 45.7,
                nonFamilyHouseholds: 54.3,
                averageHouseholdSize: 2.2
            },
            education: {
                highSchoolOrHigher: 91.5,
                bachelorsOrHigher: 65.8,
                graduateOrProfessional: 28.4
            },
            employment: {
                unemploymentRate: 3.7,
                topIndustries: ['Energy', 'Healthcare', 'Technology', 'Manufacturing']
            }
        },

        // Plano area
        {
            id: 'plano-75023',
            name: 'Plano, TX 75023',
            city: 'Plano',
            state: 'TX',
            zipCode: '75023',
            stateCode: '48',
            placeCode: '58016',
            population: 32100,
            medianHouseholdIncome: 105000,
            housingUnits: 12800,
            totalWorkers: 18900,
            ownerOccupiedPercent: 78,
            medianHomeValue: 525000,
            ageDistribution: {
                under18: 28.4,
                age18to34: 22.1,
                age35to54: 35.7,
                age55to74: 11.2,
                over75: 2.6
            },
            householdComposition: {
                familyHouseholds: 72.8,
                nonFamilyHouseholds: 27.2,
                averageHouseholdSize: 2.8
            },
            education: {
                highSchoolOrHigher: 96.7,
                bachelorsOrHigher: 75.3,
                graduateOrProfessional: 32.9
            },
            employment: {
                unemploymentRate: 2.1,
                topIndustries: ['Technology', 'Finance', 'Healthcare', 'Professional Services']
            }
        },

        // Fort Worth area
        {
            id: 'fortworth-76101',
            name: 'Fort Worth, TX 76101',
            city: 'Fort Worth',
            state: 'TX',
            zipCode: '76101',
            stateCode: '48',
            placeCode: '27000',
            population: 11200,
            medianHouseholdIncome: 68000,
            housingUnits: 5600,
            totalWorkers: 7800,
            ownerOccupiedPercent: 55,
            medianHomeValue: 385000,
            ageDistribution: {
                under18: 22.1,
                age18to34: 31.5,
                age35to54: 28.9,
                age55to74: 14.7,
                over75: 2.8
            },
            householdComposition: {
                familyHouseholds: 58.3,
                nonFamilyHouseholds: 41.7,
                averageHouseholdSize: 2.5
            },
            education: {
                highSchoolOrHigher: 87.2,
                bachelorsOrHigher: 52.1,
                graduateOrProfessional: 18.7
            },
            employment: {
                unemploymentRate: 4.5,
                topIndustries: ['Manufacturing', 'Transportation', 'Healthcare', 'Government']
            }
        },

        // Arlington area
        {
            id: 'arlington-76001',
            name: 'Arlington, TX 76001',
            city: 'Arlington',
            state: 'TX',
            zipCode: '76001',
            stateCode: '48',
            placeCode: '04000',
            population: 24800,
            medianHouseholdIncome: 71000,
            housingUnits: 10200,
            totalWorkers: 14600,
            ownerOccupiedPercent: 65,
            medianHomeValue: 395000,
            ageDistribution: {
                under18: 25.7,
                age18to34: 28.3,
                age35to54: 31.2,
                age55to74: 12.4,
                over75: 2.4
            },
            householdComposition: {
                familyHouseholds: 64.9,
                nonFamilyHouseholds: 35.1,
                averageHouseholdSize: 2.6
            },
            education: {
                highSchoolOrHigher: 88.9,
                bachelorsOrHigher: 48.3,
                graduateOrProfessional: 16.2
            },
            employment: {
                unemploymentRate: 3.9,
                topIndustries: ['Entertainment', 'Healthcare', 'Retail', 'Education']
            }
        }
    ],

    // Regional statistics for comparison
    regionalStats: {
        texas: {
            medianHouseholdIncome: 64034,
            populationGrowthRate: 1.3,
            unemploymentRate: 3.8,
            medianHomeValue: 172000,
            bachelorsOrHigher: 30.7
        },
        dallasMetro: {
            medianHouseholdIncome: 70000,
            populationGrowthRate: 1.8,
            unemploymentRate: 3.2,
            medianHomeValue: 285000,
            bachelorsOrHigher: 38.4
        },
        austinMetro: {
            medianHouseholdIncome: 80000,
            populationGrowthRate: 2.1,
            unemploymentRate: 2.9,
            medianHomeValue: 425000,
            bachelorsOrHigher: 47.2
        },
        houstonMetro: {
            medianHouseholdIncome: 68000,
            populationGrowthRate: 1.5,
            unemploymentRate: 4.1,
            medianHomeValue: 195000,
            bachelorsOrHigher: 33.8
        }
    }
};