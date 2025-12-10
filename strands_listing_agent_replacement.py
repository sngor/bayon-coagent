#!/usr/bin/env python3
"""
Strands-Powered Listing Description Agent for Bayon Coagent
Replaces: src/aws/bedrock/flows/listing-description-generator.ts
"""

from strands import Agent, tool
from strands_tools import http_request, python_repl
import json
from typing import Dict, List, Any, Optional

@tool
def analyze_comparable_listings(location: str, property_type: str, price_range: str = "") -> str:
    """Analyze comparable listings to identify competitive advantages.
    
    Args:
        location: Property location
        property_type: Type of property (single-family, condo, etc.)
        price_range: Price range for comparables
    """
    # This would integrate with MLS or property data APIs
    comparable_data = f"""
    🏠 COMPARABLE LISTINGS ANALYSIS: {location}
    
    Market Positioning:
    • Average Days on Market: 25 days
    • Price per Sq Ft: $245 (market average)
    • Most Common Features: Updated kitchens (78%), hardwood floors (65%)
    • Competitive Advantages: Outdoor space (+15% premium), recent renovations (+12%)
    
    Buyer Preferences in {location}:
    • Top Search Terms: "move-in ready", "updated kitchen", "large yard"
    • Most Viewed Features: Master suite, open floor plan, garage
    • Price Sensitivity: High for properties >$500K
    
    Positioning Strategy:
    • Emphasize unique features not common in area
    • Highlight recent updates and move-in ready condition
    • Focus on lifestyle benefits and location advantages
    """
    return comparable_data

@tool
def get_neighborhood_insights(address: str) -> str:
    """Get neighborhood insights for listing context.
    
    Args:
        address: Property address or neighborhood
    """
    # This would integrate with your neighborhood analysis tools
    insights = f"""
    🏘️ NEIGHBORHOOD INSIGHTS: {address}
    
    Demographics & Lifestyle:
    • Primary Buyer Profile: Young professionals (35%), growing families (40%)
    • Average Household Income: $85,000
    • School Ratings: 8.5/10 average (highly rated district)
    • Commute Times: 22 min to downtown, 15 min to major employment centers
    
    Amenities & Attractions:
    • Parks & Recreation: 3 parks within 1 mile, community center
    • Shopping & Dining: Trendy restaurants, farmers market, shopping district
    • Transportation: Bus routes, bike lanes, walkable score 7.2/10
    
    Market Dynamics:
    • Appreciation Rate: 8.2% annually (above city average)
    • Inventory Levels: Low (seller's market)
    • Future Development: New retail complex planned, light rail extension
    """
    return insights

@tool
def analyze_buyer_persona(persona_type: str, property_features: str) -> str:
    """Analyze buyer persona to tailor listing description.
    
    Args:
        persona_type: Target buyer persona (first-time, family, luxury, etc.)
        property_features: Key property features to highlight
    """
    persona_strategies = {
        "first-time-buyer": {
            "focus": ["affordability", "move-in ready", "low maintenance", "neighborhood amenities"],
            "tone": "encouraging and educational",
            "pain_points": ["down payment concerns", "maintenance fears", "market complexity"],
            "motivators": ["building equity", "stability", "pride of ownership"]
        },
        "growing-family": {
            "focus": ["space", "bedrooms", "yard", "schools", "safety"],
            "tone": "warm and family-oriented", 
            "pain_points": ["outgrowing current space", "school districts", "safety concerns"],
            "motivators": ["room to grow", "good schools", "family memories"]
        },
        "luxury-buyer": {
            "focus": ["premium finishes", "exclusivity", "craftsmanship", "unique features"],
            "tone": "sophisticated and elegant",
            "pain_points": ["finding unique properties", "quality concerns", "investment value"],
            "motivators": ["status", "quality", "exclusivity", "investment"]
        },
        "investor": {
            "focus": ["ROI potential", "rental income", "appreciation", "condition"],
            "tone": "analytical and data-driven",
            "pain_points": ["cash flow", "maintenance costs", "vacancy risk"],
            "motivators": ["passive income", "appreciation", "tax benefits"]
        }
    }
    
    strategy = persona_strategies.get(persona_type, persona_strategies["first-time-buyer"])
    
    analysis = f"""
    🎯 BUYER PERSONA ANALYSIS: {persona_type.replace('-', ' ').title()}
    
    Key Focus Areas:
    {chr(10).join(f'• {focus.title()}' for focus in strategy['focus'])}
    
    Recommended Tone: {strategy['tone']}
    
    Address These Pain Points:
    {chr(10).join(f'• {pain.title()}' for pain in strategy['pain_points'])}
    
    Highlight These Motivators:
    {chr(10).join(f'• {motivator.title()}' for motivator in strategy['motivators'])}
    
    Messaging Strategy:
    • Lead with features that solve their main pain points
    • Use emotional language that connects to their motivators
    • Include specific details that matter to this persona
    • End with a call-to-action that addresses their decision-making process
    """
    
    return analysis

@tool
def optimize_listing_seo(description: str, location: str) -> str:
    """Optimize listing description for search engines and MLS.
    
    Args:
        description: Current listing description
        location: Property location for local SEO
    """
    seo_analysis = f"""
    🔍 SEO OPTIMIZATION ANALYSIS
    
    Current Description Length: {len(description)} characters
    Recommended: 200-300 words for optimal MLS performance
    
    Local SEO Keywords to Include:
    • "{location} homes for sale"
    • "{location} real estate"
    • "houses in {location}"
    • "{location} neighborhood"
    
    MLS Optimization Tips:
    • Include specific room counts and square footage early
    • Mention key features buyers search for
    • Use action words: "discover", "enjoy", "experience"
    • Include lifestyle benefits and location advantages
    
    Search Performance Boosters:
    • Mention school districts if highly rated
    • Include commute times to major employers
    • Highlight recent updates and move-in ready status
    • Use neighborhood-specific amenities and attractions
    """
    
    return seo_analysis

def create_intelligent_listing_agent():
    """Create an intelligent listing description agent with market awareness."""
    
    agent = Agent(
        tools=[
            analyze_comparable_listings,
            get_neighborhood_insights,
            analyze_buyer_persona,
            optimize_listing_seo,
            http_request,
            python_repl
        ],
        system_prompt="""You are the Bayon Coagent Listing Description Agent, an expert real estate copywriter who creates compelling, persona-driven property listings that sell homes faster and for higher prices.

🏠 LISTING DESCRIPTION EXPERTISE:

**Market Intelligence Integration:**
- Analyze comparable listings for competitive positioning
- Incorporate neighborhood insights and demographics
- Understand local market dynamics and buyer preferences
- Identify unique selling propositions vs. competition

**Buyer Persona Mastery:**
- First-Time Buyers: Focus on affordability, move-in ready features, neighborhood amenities
- Growing Families: Emphasize space, schools, safety, room to grow
- Empty Nesters: Highlight low maintenance, lifestyle, accessibility, community
- Luxury Buyers: Showcase premium finishes, exclusivity, craftsmanship
- Investors: Present ROI potential, rental income, appreciation prospects
- Downsizers: Focus on efficiency, convenience, walkability

**Writing Excellence:**
- Craft compelling opening hooks that grab attention
- Use vivid, sensory language that helps buyers visualize living there
- Structure descriptions for maximum impact and readability
- Include specific details that justify the price point
- End with strong calls-to-action that motivate showings

**SEO & MLS Optimization:**
- Optimize for local search terms and MLS algorithms
- Include keywords buyers actually search for
- Structure content for maximum visibility and engagement
- Balance keyword optimization with natural, engaging copy

**Emotional Connection:**
- Paint a picture of the lifestyle the property enables
- Address specific pain points of the target buyer persona
- Highlight features that create emotional attachment
- Use storytelling techniques to make properties memorable

**LISTING CREATION PROCESS:**
1. Analyze property features and target buyer persona
2. Research comparable listings and market positioning
3. Gather neighborhood insights and local advantages
4. Craft persona-specific messaging strategy
5. Write compelling description with emotional hooks
6. Optimize for SEO and MLS performance
7. Review and refine for maximum impact

Always create listings that are:
- Factually accurate and legally compliant
- Emotionally engaging and memorable
- Strategically positioned against competition
- Optimized for search and discovery
- Tailored to specific buyer motivations"""
    )
    
    return agent

def main():
    print("🏠 Initializing Intelligent Listing Description Agent...")
    agent = create_intelligent_listing_agent()
    
    print("✅ Listing Agent ready!")
    print("Enhanced capabilities:")
    print("   • Persona-driven descriptions")
    print("   • Market intelligence integration")
    print("   • Competitive analysis")
    print("   • SEO optimization")
    print("   • Neighborhood insights")
    print("   • Emotional storytelling")
    print("=" * 60)
    
    # Test listing description generation
    print("\n🏡 Testing listing description generation...")
    response = agent("""Create a compelling listing description for a 3-bedroom, 2-bathroom single-family home in Austin, Texas. 
    
    Property details:
    - 1,850 sq ft
    - Recently updated kitchen with granite countertops
    - Large backyard with mature trees
    - 2-car garage
    - Near top-rated schools
    - Price: $485,000
    
    Target buyer persona: Growing families
    
    Please analyze the market, research comparable listings, and create a description that will attract the right buyers and generate showings.""")
    
    print(f"Listing Description:\n{response}")

if __name__ == "__main__":
    main()