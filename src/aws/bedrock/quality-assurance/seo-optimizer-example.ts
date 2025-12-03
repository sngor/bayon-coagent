/**
 * SEO Optimizer Usage Examples
 * 
 * Demonstrates how to use the SEO optimization system.
 */

import { getSEOOptimizer, SEOConfig } from './seo-optimizer';

/**
 * Example 1: Basic SEO optimization for a blog post
 */
async function example1_BasicBlogOptimization() {
    console.log('Example 1: Basic Blog Post SEO Optimization\n');

    const content = `
# Real Estate Market Trends in Austin

The Austin real estate market has been experiencing significant growth. 
Home prices have increased by 15% over the past year. Many buyers are 
looking for properties in the downtown area. The average home price is 
now $450,000. Inventory levels remain low with only 2.5 months of supply.

## Why Austin is Hot

Austin offers great job opportunities, no state income tax, and a vibrant 
culture. Tech companies are moving here in droves. The population has 
grown by 20% in the last five years.

## What Buyers Should Know

Competition is fierce. Buyers need to be prepared to act quickly. 
Getting pre-approved for a mortgage is essential. Working with an 
experienced local agent can make all the difference.
    `.trim();

    const config: SEOConfig = {
        targetKeywords: ['Austin real estate', 'Austin housing market', 'buy home Austin'],
        contentType: 'blog',
        targetAudience: 'home buyers',
        geographic: 'Austin, Texas',
        minReadabilityScore: 60,
    };

    const optimizer = getSEOOptimizer();
    const result = await optimizer.optimizeSEO(content, config);

    console.log('Current SEO Score:', (result.currentScore * 100).toFixed(0) + '/100');
    console.log('Potential Score:', (result.potentialScore * 100).toFixed(0) + '/100');
    console.log('\nKeyword Analysis:');
    console.log('- Primary Keywords:', result.keywords.primary.join(', '));
    console.log('- Secondary Keywords:', result.keywords.secondary.join(', '));
    console.log('- Suggested Keywords:', result.keywords.suggestions.join(', '));

    console.log('\nMeta Description:');
    console.log('- Suggested:', result.metaDescription.suggested);
    console.log('- Length:', result.metaDescription.length, 'characters');

    console.log('\nStructure Analysis:');
    console.log('- Has H1:', result.structure.hasH1);
    console.log('- Heading Hierarchy:', result.structure.headingHierarchy);
    console.log('- Readability Score:', result.structure.readabilityScore);

    console.log('\nPriority Improvements:');
    result.priorityImprovements.forEach((improvement, i) => {
        console.log(`${i + 1}. ${improvement}`);
    });

    console.log('\nAssessment:', result.assessment);
    console.log('Estimated Effort:', result.estimatedEffort);
}

/**
 * Example 2: SEO optimization for a landing page
 */
async function example2_LandingPageOptimization() {
    console.log('\n\nExample 2: Landing Page SEO Optimization\n');

    const content = `
<html>
<head>
    <meta name="description" content="Buy homes in Austin">
</head>
<body>
    <h1>Find Your Dream Home in Austin</h1>
    
    <p>Looking for the perfect home in Austin, Texas? Our team of experienced 
    real estate agents can help you find exactly what you're looking for. 
    Whether you're a first-time buyer or looking to upgrade, we have the 
    expertise and local knowledge to guide you through every step of the 
    home buying process.</p>
    
    <h2>Our Services</h2>
    
    <p>We offer comprehensive real estate services including buyer representation, 
    seller representation, property management, and investment consulting. Our 
    agents have decades of combined experience in the Austin market.</p>
    
    <h2>Why Choose Us</h2>
    
    <p>We know Austin inside and out. We've helped hundreds of families find 
    their perfect home. Our clients love working with us because we listen to 
    their needs and work tirelessly to exceed their expectations.</p>
    
    <h2>Get Started Today</h2>
    
    <p>Contact us now for a free consultation. Let's discuss your real estate 
    goals and create a plan to make them a reality.</p>
</body>
</html>
    `.trim();

    const config: SEOConfig = {
        targetKeywords: [
            'Austin real estate agent',
            'buy home Austin',
            'Austin realtor',
            'Austin homes for sale',
        ],
        contentType: 'landing-page',
        targetAudience: 'home buyers and sellers',
        geographic: 'Austin, Texas',
        analyzeLinks: true,
        analyzeImages: true,
    };

    const optimizer = getSEOOptimizer();
    const result = await optimizer.optimizeSEO(content, config);

    console.log('Current SEO Score:', (result.currentScore * 100).toFixed(0) + '/100');
    console.log('Potential Score:', (result.potentialScore * 100).toFixed(0) + '/100');

    console.log('\nMeta Description Analysis:');
    console.log('- Current:', result.metaDescription.current);
    console.log('- Issues:', result.metaDescription.issues.join(', '));
    console.log('- Suggested:', result.metaDescription.suggested);

    console.log('\nTop Suggestions:');
    result.contentSuggestions
        .filter(s => s.priority === 'high')
        .forEach((suggestion, i) => {
            console.log(`\n${i + 1}. ${suggestion.message}`);
            console.log('   Action:', suggestion.action);
            console.log('   Impact:', suggestion.impact);
        });
}

/**
 * Example 3: SEO optimization for a property listing
 */
async function example3_PropertyListingOptimization() {
    console.log('\n\nExample 3: Property Listing SEO Optimization\n');

    const content = `
Beautiful 4-Bedroom Home in West Austin

This stunning property features 4 bedrooms, 3 bathrooms, and 2,500 square 
feet of living space. The home sits on a large lot with mature trees and a 
spacious backyard perfect for entertaining.

The kitchen has been recently updated with granite countertops and stainless 
steel appliances. The master suite includes a walk-in closet and spa-like 
bathroom. Additional features include hardwood floors throughout, a two-car 
garage, and energy-efficient windows.

Located in a highly sought-after neighborhood with top-rated schools nearby. 
Close to shopping, dining, and major employers. Easy access to downtown Austin.

Price: $650,000
    `.trim();

    const config: SEOConfig = {
        targetKeywords: [
            'West Austin homes',
            '4 bedroom house Austin',
            'Austin real estate',
            'homes for sale Austin',
        ],
        contentType: 'listing',
        geographic: 'West Austin, Texas',
        minReadabilityScore: 70,
    };

    const optimizer = getSEOOptimizer();
    const result = await optimizer.optimizeSEO(content, config);

    console.log('SEO Analysis for Property Listing:');
    console.log('Current Score:', (result.currentScore * 100).toFixed(0) + '/100');

    console.log('\nKeyword Optimization:');
    console.log('- Primary Keywords Found:', result.keywords.primary.length);
    console.log('- Underused Keywords:', result.keywords.underused.join(', ') || 'None');
    console.log('- Suggested Keywords:', result.keywords.suggestions.slice(0, 3).join(', '));

    console.log('\nStructure:');
    console.log('- Readability Level:', result.structure.readabilityLevel);
    console.log('- Avg Paragraph Length:', result.structure.avgParagraphLength, 'words');

    console.log('\nQuick Wins:');
    result.contentSuggestions
        .filter(s => s.priority === 'high' || s.priority === 'medium')
        .slice(0, 3)
        .forEach((suggestion, i) => {
            console.log(`${i + 1}. [${suggestion.priority.toUpperCase()}] ${suggestion.message}`);
        });
}

/**
 * Example 4: Comprehensive SEO audit
 */
async function example4_ComprehensiveAudit() {
    console.log('\n\nExample 4: Comprehensive SEO Audit\n');

    const content = `
<h1>Austin Real Estate Market Report 2024</h1>

<p>The Austin real estate market continues to show strong performance in 2024. 
This comprehensive report analyzes current trends, pricing data, and future 
projections for buyers, sellers, and investors.</p>

<h2>Market Overview</h2>

<p>Home prices in Austin have increased by 12% year-over-year. The median 
home price is now $485,000. Inventory remains tight with only 2.8 months 
of supply. Days on market average 25 days, indicating strong buyer demand.</p>

<h2>Neighborhood Analysis</h2>

<h3>Downtown Austin</h3>

<p>Downtown condos and townhomes are seeing the highest appreciation rates. 
Luxury properties above $1M are selling quickly. New construction is adding 
supply but demand remains strong.</p>

<h3>South Austin</h3>

<p>South Austin remains popular with young professionals and families. 
Schools are highly rated. Home prices range from $400K to $800K depending 
on the specific neighborhood.</p>

<h2>Market Forecast</h2>

<p>Experts predict continued growth through 2024 and 2025. Job growth and 
population increases will drive demand. Interest rates may stabilize, 
improving affordability for some buyers.</p>

<h2>Conclusion</h2>

<p>The Austin market remains strong for both buyers and sellers. Working 
with an experienced local agent is crucial for success in this competitive 
environment.</p>
    `.trim();

    const config: SEOConfig = {
        targetKeywords: [
            'Austin real estate market',
            'Austin housing market 2024',
            'Austin home prices',
            'Austin market report',
        ],
        contentType: 'article',
        targetAudience: 'real estate professionals and investors',
        geographic: 'Austin, Texas',
        analyzeLinks: true,
        minReadabilityScore: 65,
    };

    const optimizer = getSEOOptimizer();
    const result = await optimizer.optimizeSEO(content, config);

    console.log('=== COMPREHENSIVE SEO AUDIT ===\n');

    console.log('OVERALL SCORES:');
    console.log('- Current SEO Score:', (result.currentScore * 100).toFixed(0) + '/100');
    console.log('- Potential Score:', (result.potentialScore * 100).toFixed(0) + '/100');
    console.log('- Improvement Potential:', ((result.potentialScore - result.currentScore) * 100).toFixed(0) + ' points');

    console.log('\nKEYWORD PERFORMANCE:');
    console.log('- Primary Keywords:', result.keywords.primary.length);
    console.log('- Secondary Keywords:', result.keywords.secondary.length);
    console.log('- Overused:', result.keywords.overused.length);
    console.log('- Underused:', result.keywords.underused.length);

    console.log('\nCONTENT STRUCTURE:');
    console.log('- H1 Present:', result.structure.hasH1 ? '✓' : '✗');
    console.log('- Heading Hierarchy:', result.structure.headingHierarchy ? '✓' : '✗');
    console.log('- Readability Score:', result.structure.readabilityScore + '/100');
    console.log('- Paragraph Length:', result.structure.paragraphLength);

    console.log('\nMETA INFORMATION:');
    console.log('- Meta Description:', result.metaDescription.current ? 'Present' : 'Missing');
    console.log('- Includes Keywords:', result.metaDescription.includesKeywords ? '✓' : '✗');
    console.log('- Optimal Length:', result.metaDescription.length >= 150 && result.metaDescription.length <= 160 ? '✓' : '✗');

    console.log('\nPRIORITY ACTIONS:');
    result.priorityImprovements.forEach((improvement, i) => {
        console.log(`${i + 1}. ${improvement}`);
    });

    console.log('\nALL SUGGESTIONS BY PRIORITY:');
    ['high', 'medium', 'low'].forEach(priority => {
        const suggestions = result.contentSuggestions.filter(s => s.priority === priority);
        if (suggestions.length > 0) {
            console.log(`\n${priority.toUpperCase()} Priority (${suggestions.length}):`);
            suggestions.forEach((s, i) => {
                console.log(`  ${i + 1}. [${s.type}] ${s.message}`);
            });
        }
    });

    console.log('\nFINAL ASSESSMENT:');
    console.log(result.assessment);
    console.log('\nEstimated Implementation Effort:', result.estimatedEffort.toUpperCase());
}

/**
 * Run all examples
 */
async function runAllExamples() {
    try {
        await example1_BasicBlogOptimization();
        await example2_LandingPageOptimization();
        await example3_PropertyListingOptimization();
        await example4_ComprehensiveAudit();
    } catch (error) {
        console.error('Error running examples:', error);
    }
}

// Export examples for testing
export {
    example1_BasicBlogOptimization,
    example2_LandingPageOptimization,
    example3_PropertyListingOptimization,
    example4_ComprehensiveAudit,
    runAllExamples,
};

// Run if executed directly
if (require.main === module) {
    runAllExamples();
}
