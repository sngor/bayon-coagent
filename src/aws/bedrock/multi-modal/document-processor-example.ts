/**
 * Document Processor Example Usage
 * 
 * This file demonstrates how to use the DocumentProcessor strand for various
 * document processing tasks in real estate applications.
 */

import {
    getDocumentProcessor,
    type DocumentProcessingInput,
    type DocumentAnalysis,
    type DocumentInsight,
    type DocumentSummary,
    type KnowledgeBaseEntry,
} from './document-processor';
import type { AgentProfile } from '@/aws/dynamodb/agent-profile-repository';

/**
 * Example 1: Process a market report document
 */
export async function processMarketReport(userId?: string): Promise<DocumentAnalysis> {
    const processor = getDocumentProcessor();

    const marketReportContent = `
Q4 2024 Real Estate Market Report - Austin, Texas

Executive Summary:
The Austin real estate market showed strong resilience in Q4 2024, with median home prices 
increasing 8.2% year-over-year to $575,000. Inventory levels improved by 15% compared to Q3, 
providing buyers with more options. Days on market decreased to an average of 32 days, 
indicating continued strong demand.

Key Market Metrics:
- Median Home Price: $575,000 (+8.2% YoY)
- Average Days on Market: 32 days (-5 days from Q3)
- Inventory: 2.8 months (+15% from Q3)
- Closed Sales: 3,245 units (+12% YoY)
- Price per Square Foot: $285 (+6.5% YoY)

Market Trends:
1. Tech Sector Growth: Continued expansion of tech companies in Austin is driving demand 
   for housing in the $600K-$900K range.
2. Suburban Shift: Buyers are increasingly looking at suburbs like Cedar Park and Round Rock 
   for more space and value.
3. New Construction: New home construction increased 20% in Q4, helping to ease inventory constraints.

Forecast for Q1 2025:
We expect moderate price growth of 3-5% in Q1 2025, with inventory levels continuing to improve. 
Interest rates are projected to stabilize around 6.5%, which should support sustained buyer activity.

Recommendations for Agents:
- Focus on properties in the $500K-$700K range for highest activity
- Highlight energy-efficient features as buyers prioritize sustainability
- Emphasize proximity to tech corridors and quality schools
- Prepare for increased competition in suburban markets
    `.trim();

    const input: DocumentProcessingInput = {
        content: marketReportContent,
        format: 'txt',
        documentType: 'market-report',
        filename: 'austin-q4-2024-market-report.txt',
        focus: 'comprehensive',
    };

    const analysis = await processor.processDocument(input, userId);

    console.log('Market Report Analysis:');
    console.log('Title:', analysis.metadata.title);
    console.log('Summary:', analysis.summary.brief);
    console.log('Key Insights:', analysis.insights.length);
    console.log('Quality Score:', analysis.qualityScore);

    return analysis;
}

/**
 * Example 2: Extract insights from a property inspection report
 */
export async function extractInspectionInsights(userId?: string): Promise<DocumentInsight[]> {
    const processor = getDocumentProcessor();

    const inspectionContent = `
Property Inspection Report
Address: 123 Oak Street, Austin, TX 78701
Inspection Date: December 1, 2024
Inspector: John Smith, License #12345

Overall Condition: Good with minor repairs needed

Major Systems:
- HVAC: 5-year-old system in good working order. Recommend annual maintenance.
- Roof: 8 years old, asphalt shingles. Estimated 7-10 years remaining life. Minor repairs needed on flashing.
- Plumbing: Generally good condition. Minor leak detected under kitchen sink - easy repair.
- Electrical: Updated panel, all outlets properly grounded. No safety concerns.
- Foundation: Solid concrete slab, no cracks or settling observed.

Areas Requiring Attention:
1. Kitchen sink leak - Estimated repair cost: $150-$300
2. Roof flashing repair - Estimated cost: $400-$600
3. Exterior paint touch-up needed on south side - Estimated cost: $800-$1,200
4. Garage door opener needs replacement - Estimated cost: $300-$500

Safety Items:
- All smoke detectors functional
- Carbon monoxide detectors present and working
- GFCI outlets properly installed in wet areas
- No radon testing performed (recommend if desired)

Recommendations:
- Address kitchen sink leak before closing
- Schedule roof flashing repair within 6 months
- Budget for exterior painting in next 1-2 years
- Consider home warranty for major systems

Overall Assessment:
This property is in good condition with only minor maintenance items. The major systems 
are functioning properly and have reasonable remaining life. Total estimated repair costs 
for immediate items: $850-$1,400.
    `.trim();

    const insights = await processor.extractInsights(inspectionContent, 'txt', userId);

    console.log('Inspection Insights:');
    insights.forEach((insight, i) => {
        console.log(`${i + 1}. [${insight.category}] ${insight.content}`);
        console.log(`   Importance: ${insight.importance}, Confidence: ${insight.confidence}`);
    });

    return insights;
}

/**
 * Example 3: Summarize a real estate article
 */
export async function summarizeArticle(userId?: string): Promise<DocumentSummary> {
    const processor = getDocumentProcessor();

    const articleContent = `
The Rise of Smart Homes in Real Estate: What Agents Need to Know

The integration of smart home technology has transformed from a luxury feature to an expected 
amenity in modern real estate. As we move through 2024, understanding smart home technology 
has become essential for real estate professionals.

What Buyers Want:
Today's homebuyers, particularly millennials and Gen Z, expect homes to include smart features. 
According to recent surveys, 78% of buyers under 40 consider smart home features important in 
their purchase decision. The most desired features include:

1. Smart thermostats (Nest, Ecobee) - Energy savings and convenience
2. Smart security systems - Peace of mind and remote monitoring
3. Smart locks - Keyless entry and guest access management
4. Smart lighting - Ambiance control and energy efficiency
5. Video doorbells - Package security and visitor screening

Impact on Home Values:
Research shows that homes with smart features sell 5-7% faster and can command a 3-5% premium 
over comparable homes without these features. However, the key is integration - a cohesive smart 
home system is more valuable than individual disconnected devices.

Marketing Smart Homes:
When listing a smart home, agents should:
- Create a detailed inventory of all smart features
- Provide documentation and login credentials for systems
- Demonstrate features during showings
- Highlight energy savings and security benefits
- Include smart home features prominently in listing descriptions

Common Pitfalls to Avoid:
1. Assuming all smart devices transfer with the home - clarify in the contract
2. Neglecting to mention subscription requirements for certain features
3. Failing to educate buyers on how to use the systems
4. Overlooking compatibility issues between different smart home platforms

The Future:
As technology continues to evolve, agents who understand and can effectively communicate the 
value of smart home features will have a competitive advantage. Consider becoming certified in 
smart home technology or partnering with local smart home installers to better serve your clients.
    `.trim();

    const summary = await processor.summarizeDocument(articleContent, 'txt', userId);

    console.log('Article Summary:');
    console.log('Brief:', summary.brief);
    console.log('\nKey Points:');
    summary.keyPoints.forEach((point, i) => {
        console.log(`${i + 1}. ${point}`);
    });
    console.log('\nTopics:', summary.topics.join(', '));

    return summary;
}

/**
 * Example 4: Index a document for knowledge base
 */
export async function indexDocumentForKnowledgeBase(
    agentProfile: AgentProfile,
    userId?: string
): Promise<KnowledgeBaseEntry> {
    const processor = getDocumentProcessor();

    const guideContent = `
First-Time Homebuyer Guide for Austin, Texas

Introduction:
Buying your first home is an exciting milestone, but it can also feel overwhelming. This guide 
will walk you through the process specific to the Austin market.

Step 1: Assess Your Financial Readiness
- Check your credit score (aim for 620+ for conventional loans)
- Calculate your debt-to-income ratio (should be below 43%)
- Save for down payment (3-20% of purchase price)
- Budget for closing costs (2-5% of purchase price)
- Get pre-approved for a mortgage

Step 2: Understand Austin's Market
- Median home price: $575,000
- Competitive market with multiple offers common
- Average days on market: 30-35 days
- Property taxes: Approximately 2.1% of home value annually
- HOA fees vary widely by neighborhood

Step 3: Choose Your Neighborhoods
Popular first-time buyer areas:
- Pflugerville: Affordable, good schools, growing community
- Round Rock: Family-friendly, tech jobs nearby
- South Austin: Diverse, cultural amenities, higher prices
- Cedar Park: Suburban, excellent schools, new construction

Step 4: Work with a Buyer's Agent
Benefits of representation:
- No cost to you (seller pays commission)
- Expert negotiation skills
- Access to off-market properties
- Guidance through complex paperwork
- Local market knowledge

Step 5: Make an Offer
In Austin's competitive market:
- Be prepared to act quickly
- Consider escalation clauses
- Limit contingencies when possible
- Write a personal letter to sellers
- Be flexible on closing dates

Step 6: Home Inspection and Appraisal
- Always get a professional inspection ($400-$600)
- Negotiate repairs or credits based on findings
- Appraisal protects your investment
- Review all disclosures carefully

Step 7: Closing
- Final walkthrough 24 hours before closing
- Review closing disclosure 3 days before
- Bring certified funds for closing costs
- Bring valid ID
- Plan for 1-2 hours at title company

Austin-Specific Considerations:
- Flood zones: Check FEMA maps
- Water restrictions: Understand local regulations
- Property taxes: No state income tax but higher property taxes
- Growth: Rapid development may affect neighborhood character

Financial Assistance Programs:
- Texas State Affordable Housing Corporation
- Austin Housing Finance Corporation
- VA loans for veterans
- USDA loans for rural areas
- Down payment assistance programs

Common Mistakes to Avoid:
1. Skipping pre-approval
2. Maxing out your budget
3. Waiving inspection in competitive market
4. Forgetting about ongoing costs (maintenance, utilities, taxes)
5. Making major purchases before closing

Next Steps:
Ready to start your home buying journey? Contact a local real estate agent who specializes 
in first-time buyers. They can help you navigate Austin's unique market and find the perfect 
home for your needs and budget.
    `.trim();

    const entry = await processor.indexDocument(
        guideContent,
        'txt',
        'first-time-buyer-guide-austin.txt',
        agentProfile,
        userId
    );

    console.log('Knowledge Base Entry Created:');
    console.log('ID:', entry.id);
    console.log('Title:', entry.metadata.title);
    console.log('Tags:', entry.tags.join(', '));
    console.log('Content Chunks:', entry.contentChunks.length);
    console.log('Insights:', entry.insights.length);

    return entry;
}

/**
 * Example 5: Search indexed documents
 */
export async function searchKnowledgeBase(query: string): Promise<KnowledgeBaseEntry[]> {
    const processor = getDocumentProcessor();

    // First, index some documents (in real usage, these would already be indexed)
    await indexDocumentForKnowledgeBase({
        agentName: 'Example Agent',
        primaryMarket: 'Austin, TX',
        specialization: 'residential',
        preferredTone: 'professional',
        corePrinciple: 'Client-focused service',
    } as AgentProfile);

    // Now search
    const results = await processor.searchDocuments(query, 5);

    console.log(`Search Results for "${query}":`);
    results.forEach((result, i) => {
        console.log(`${i + 1}. ${result.metadata.title}`);
        console.log(`   Summary: ${result.summary.substring(0, 100)}...`);
        console.log(`   Tags: ${result.tags.slice(0, 5).join(', ')}`);
    });

    return results;
}

/**
 * Example 6: Process multiple document types
 */
export async function processMultipleDocuments(userId?: string): Promise<void> {
    console.log('=== Processing Market Report ===');
    await processMarketReport(userId);

    console.log('\n=== Extracting Inspection Insights ===');
    await extractInspectionInsights(userId);

    console.log('\n=== Summarizing Article ===');
    await summarizeArticle(userId);

    console.log('\n=== Indexing Guide ===');
    await indexDocumentForKnowledgeBase({
        agentName: 'Example Agent',
        primaryMarket: 'Austin, TX',
        specialization: 'residential',
        preferredTone: 'professional',
        corePrinciple: 'Client-focused service',
    } as AgentProfile, userId);

    console.log('\n=== Searching Knowledge Base ===');
    await searchKnowledgeBase('first-time buyer');
}

/**
 * Example 7: Real-world usage in an application
 */
export async function realWorldExample(
    documentContent: string,
    documentFormat: 'pdf' | 'docx' | 'txt' | 'md',
    filename: string,
    agentProfile: AgentProfile,
    userId: string
): Promise<{
    analysis: DocumentAnalysis;
    knowledgeBaseEntry: KnowledgeBaseEntry;
}> {
    const processor = getDocumentProcessor();

    // Step 1: Process the document
    const analysis = await processor.processDocument({
        content: documentContent,
        format: documentFormat,
        filename,
        agentProfile,
        focus: 'comprehensive',
    }, userId);

    // Step 2: Index for knowledge base
    const knowledgeBaseEntry = await processor.indexDocument(
        documentContent,
        documentFormat,
        filename,
        agentProfile,
        userId
    );

    // Step 3: Log high-importance insights
    const highImportanceInsights = analysis.insights.filter(
        insight => insight.importance === 'high'
    );

    console.log(`Processed: ${filename}`);
    console.log(`Found ${highImportanceInsights.length} high-importance insights`);
    console.log(`Indexed with ${knowledgeBaseEntry.contentChunks.length} searchable chunks`);

    return {
        analysis,
        knowledgeBaseEntry,
    };
}

// Export all examples
export const examples = {
    processMarketReport,
    extractInspectionInsights,
    summarizeArticle,
    indexDocumentForKnowledgeBase,
    searchKnowledgeBase,
    processMultipleDocuments,
    realWorldExample,
};
