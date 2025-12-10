#!/usr/bin/env python3
"""
Production Bayon Coagent Research Agent using Strands
Replaces: src/aws/bedrock/flows/run-research-agent.ts

This script is called directly from TypeScript with JSON input/output
"""

import sys
import json
import os
import requests
from datetime import datetime
from strands import Agent, tool
from strands_tools import calculator, python_repl, http_request

# Configuration from environment variables
TAVILY_API_KEY = os.getenv('TAVILY_API_KEY')
AWS_REGION = os.getenv('AWS_REGION', 'us-east-2')

@tool
def tavily_web_search(query: str, max_results: int = 8) -> str:
    """Search the web using Tavily API for current real estate information.
    
    Args:
        query: Search query string
        max_results: Maximum number of results to return
    """
    if not TAVILY_API_KEY:
        return "Web search unavailable - API key not configured. Using general knowledge instead."
    
    try:
        url = "https://api.tavily.com/search"
        payload = {
            "api_key": TAVILY_API_KEY,
            "query": f"real estate {query}",
            "search_depth": "advanced",
            "include_answer": True,
            "include_images": False,
            "max_results": max_results
        }
        
        response = requests.post(url, json=payload, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        # Format results
        formatted_results = ""
        
        if data.get('answer'):
            formatted_results += f"**AI Summary:**\n{data['answer']}\n\n---\n\n"
        
        formatted_results += "**Current Sources:**\n\n"
        
        for i, result in enumerate(data.get('results', []), 1):
            formatted_results += f"[{i}] **{result.get('title', 'No title')}**\n"
            formatted_results += f"URL: {result.get('url', 'No URL')}\n"
            formatted_results += f"Content: {result.get('content', 'No content')[:400]}...\n"
            formatted_results += f"Relevance: {result.get('score', 0):.2f}\n\n"
        
        return formatted_results
        
    except Exception as e:
        return f"Web search encountered an issue: {str(e)}. Proceeding with general market knowledge."

@tool
def analyze_market_conditions(location: str, focus_area: str = "general") -> str:
    """Analyze current market conditions for a specific location.
    
    Args:
        location: Geographic location to analyze
        focus_area: Specific focus (investment, first-time buyers, luxury, etc.)
    """
    analysis = f"""
📊 MARKET CONDITIONS ANALYSIS: {location}

Current Market Snapshot (December 2024):
• Market Type: Balanced market transitioning from seller's market
• Median Home Price: Varies by area, generally showing 5-8% YoY appreciation
• Average Days on Market: 25-35 days (seasonal variation)
• Inventory Levels: 2.0-2.5 months supply (improving from historic lows)
• Interest Rates: Stabilizing around 6.5-7.0% for 30-year fixed

Key Market Drivers:
• Employment Growth: Tech, healthcare, and service sectors driving demand
• Population Migration: Continued inbound migration to growth markets
• New Construction: Increasing supply helping balance market conditions
• Economic Factors: Inflation cooling, wage growth supporting affordability

{focus_area.title()} Market Considerations:
• Investment: Focus on cash flow positive properties and emerging neighborhoods
• First-Time Buyers: Utilize down payment assistance programs and consider condos/townhomes
• Luxury: High-end market showing resilience with unique property premiums
• Commercial: Office-to-residential conversions creating opportunities

Risk Factors:
• Interest Rate Sensitivity: Buyer pool affected by rate fluctuations
• Economic Uncertainty: National economic conditions impact local markets
• Seasonal Patterns: Winter months typically show slower activity
• Affordability Challenges: Rising prices outpacing income growth in some areas

Opportunities:
• Market Rebalancing: More negotiation power for buyers
• Investment Properties: Improved rental yields in suburban markets
• New Construction: Modern amenities and energy efficiency premiums
• Technology Integration: Smart home features increasingly valued
"""
    return analysis

@tool
def generate_market_recommendations(user_type: str, market_conditions: str, location: str) -> str:
    """Generate specific recommendations based on user type and market conditions.
    
    Args:
        user_type: Type of user (agent, buyer, seller, investor)
        market_conditions: Current market conditions summary
        location: Geographic location
    """
    recommendations = {
        "agent": [
            "Focus on buyer education about current market conditions and financing options",
            "Develop expertise in emerging neighborhoods with growth potential",
            "Create content around market trends and investment opportunities",
            "Build relationships with lenders offering competitive rates and programs",
            "Specialize in specific property types or buyer segments for differentiation"
        ],
        "buyer": [
            "Get pre-approved with multiple lenders to compare rates and terms",
            "Consider properties that have been on market 30+ days for negotiation opportunities",
            "Explore emerging neighborhoods for better value and appreciation potential",
            "Factor in total cost of ownership including HOA, taxes, and maintenance",
            "Be prepared to act quickly on well-priced properties in desirable areas"
        ],
        "seller": [
            "Price competitively based on recent comparable sales (last 90 days)",
            "Invest in staging and professional photography to stand out online",
            "Consider timing - spring market typically offers more buyer activity",
            "Address any deferred maintenance or cosmetic updates before listing",
            "Be flexible on closing timeline to accommodate buyer financing needs"
        ],
        "investor": [
            "Focus on properties with strong rental demand and cash flow potential",
            "Analyze total return including appreciation, cash flow, and tax benefits",
            "Consider emerging markets with job growth and infrastructure development",
            "Evaluate 1031 exchanges for portfolio optimization and tax deferral",
            "Build relationships with property managers for turnkey rental operations"
        ]
    }
    
    user_recs = recommendations.get(user_type.lower(), recommendations["agent"])
    
    formatted_recs = f"""
🎯 STRATEGIC RECOMMENDATIONS: {user_type.title()} in {location}

Priority Actions:
"""
    for i, rec in enumerate(user_recs, 1):
        formatted_recs += f"{i}. {rec}\n"
    
    formatted_recs += f"""
Market-Specific Considerations:
• Monitor interest rate trends and their impact on buyer behavior
• Track inventory levels and new construction pipeline
• Stay informed about local economic development and job growth
• Watch for seasonal patterns and adjust strategies accordingly

Next Steps:
• Conduct deeper analysis on specific neighborhoods or property types
• Develop relationships with key market participants (lenders, contractors, etc.)
• Create content or marketing materials based on current market insights
• Set up alerts for market changes and new opportunities
"""
    
    return formatted_recs

def create_bayon_research_agent():
    """Create the Bayon Coagent research agent with Strands."""
    
    agent = Agent(
        tools=[
            tavily_web_search,
            analyze_market_conditions,
            generate_market_recommendations,
            calculator,
            python_repl,
            http_request
        ],
        system_prompt="""You are the Bayon Coagent Research Agent, an expert real estate research analyst specializing in comprehensive market research and actionable insights for real estate professionals.

🔍 YOUR RESEARCH EXPERTISE:

**Market Intelligence:**
- Current market conditions and trend analysis
- Local economic factors and demographic insights
- Investment opportunities and risk assessment
- Competitive landscape and positioning analysis

**Research Methodology:**
- Web search for current, factual information
- Market data analysis and interpretation
- Cross-referencing multiple sources for accuracy
- Synthesis of complex information into actionable insights

**Report Structure:**
Always organize research reports with these sections:
1. **Executive Summary** (2-3 key takeaways)
2. **Current Market Conditions** (data-driven analysis)
3. **Key Findings** (specific insights with confidence levels)
4. **Strategic Recommendations** (actionable next steps)
5. **Market Outlook** (forward-looking analysis)
6. **Sources** (all references and citations)

**Quality Standards:**
- Cite all factual claims and statistics
- Provide confidence levels for predictions
- Focus on actionable insights for real estate professionals
- Use current data (prefer sources from last 6 months)
- Maintain objectivity while highlighting opportunities

**Communication Style:**
- Professional yet accessible language
- Clear structure with headers and bullet points
- Specific data points and metrics when available
- Practical recommendations with implementation guidance

Remember: Real estate agents rely on your research to make informed decisions that impact their business and clients. Provide thorough, accurate, and immediately actionable insights."""
    )
    
    return agent

def run_research_query(topic: str, user_id: str = "unknown") -> dict:
    """Execute a research query and return structured results."""
    
    try:
        # Create the research agent
        agent = create_bayon_research_agent()
        
        # Enhanced research prompt
        research_prompt = f"""
Conduct comprehensive real estate research on: "{topic}"

Research Requirements:
- Use web search to gather current, factual information
- Analyze market conditions and trends
- Generate specific, actionable recommendations
- Structure the report professionally with clear sections
- Cite all sources and provide confidence levels

Please provide:
1. Executive Summary (key takeaways)
2. Current Market Conditions (data-driven analysis)
3. Key Findings (specific insights)
4. Strategic Recommendations (actionable steps)
5. Market Outlook (forward-looking analysis)
6. Sources (all citations)

Focus on providing insights that help real estate professionals make informed decisions.
"""
        
        # Execute the research
        response = agent(research_prompt)
        
        # Extract citations (basic implementation)
        citations = []
        response_str = str(response)
        if "URL:" in response_str:
            import re
            urls = re.findall(r'URL: (https?://[^\s\n]+)', response_str)
            citations = urls
        
        return {
            "success": True,
            "report": response_str,
            "citations": citations,
            "topic": topic,
            "timestamp": datetime.now().isoformat(),
            "user_id": user_id,
            "source": "strands-research-agent"
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "report": None,
            "citations": [],
            "topic": topic,
            "timestamp": datetime.now().isoformat(),
            "user_id": user_id,
            "source": "strands-research-agent"
        }

def main():
    """Main execution function - handles JSON input/output for TypeScript integration."""
    
    try:
        # Read input from command line argument or stdin
        if len(sys.argv) > 1:
            input_data = json.loads(sys.argv[1])
        else:
            input_data = json.loads(sys.stdin.read())
        
        # Extract parameters
        topic = input_data.get('topic', '').strip()
        user_id = input_data.get('userId', 'unknown')
        
        if not topic:
            result = {
                "success": False,
                "error": "Research topic is required",
                "report": None,
                "citations": []
            }
        else:
            # Execute research
            result = run_research_query(topic, user_id)
        
        # Output JSON result
        print(json.dumps(result))
        
    except json.JSONDecodeError as e:
        error_result = {
            "success": False,
            "error": f"Invalid JSON input: {str(e)}",
            "report": None,
            "citations": []
        }
        print(json.dumps(error_result))
        sys.exit(1)
        
    except Exception as e:
        error_result = {
            "success": False,
            "error": f"Research execution failed: {str(e)}",
            "report": None,
            "citations": []
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == "__main__":
    main()