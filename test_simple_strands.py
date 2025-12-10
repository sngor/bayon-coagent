#!/usr/bin/env python3
"""
Simple Strands Test for Bayon Coagent Research Agent
"""

from strands import Agent, tool
from strands_tools import calculator, python_repl, http_request
import json

@tool
def mock_web_search(query: str) -> str:
    """Mock web search for testing purposes.
    
    Args:
        query: Search query
    """
    return f"""
    📰 SEARCH RESULTS FOR: {query}
    
    [1] Real Estate Market Trends 2024
    URL: https://example.com/market-trends-2024
    Content: The real estate market in 2024 shows strong fundamentals with 8.2% year-over-year price appreciation. Interest rates have stabilized around 7%, creating a balanced market with opportunities for both buyers and sellers...
    
    [2] Investment Opportunities in Real Estate
    URL: https://example.com/investment-guide
    Content: Current market conditions favor strategic real estate investments, particularly in emerging neighborhoods and multi-family properties. Cash flow positive properties are available in suburban markets...
    """

@tool
def mock_save_report(content: str, title: str, user_id: str) -> str:
    """Mock report saving for testing.
    
    Args:
        content: Report content
        title: Report title  
        user_id: User ID
    """
    report_id = f"report_{hash(title + user_id) % 10000}"
    return f"✅ Report saved successfully! Report ID: {report_id}"

def create_test_research_agent():
    """Create a test research agent."""
    
    agent = Agent(
        tools=[
            mock_web_search,
            mock_save_report,
            calculator,
            python_repl
        ],
        system_prompt="""You are a real estate research agent. You can search the web, analyze data, and generate comprehensive research reports.

When conducting research:
1. Use web search to gather current information
2. Analyze the data and identify key trends
3. Generate a structured report with findings and recommendations
4. Save the report for future reference

Always provide well-structured, actionable insights for real estate professionals."""
    )
    
    return agent

def test_research_query(topic: str, user_id: str = "test-user"):
    """Test a research query."""
    
    print(f"🔍 Testing research query: {topic}")
    print("-" * 50)
    
    # Create agent
    agent = create_test_research_agent()
    
    # Research prompt
    prompt = f"""
    Research topic: {topic}
    User ID: {user_id}
    
    Please:
    1. Search for current information about this topic
    2. Analyze the findings
    3. Generate a comprehensive research report
    4. Save the report when complete
    
    Structure your report with:
    - Executive Summary
    - Key Findings
    - Market Analysis
    - Recommendations
    - Sources
    """
    
    # Execute research
    response = agent(prompt)
    
    print("📊 RESEARCH RESULTS:")
    print(response)
    
    return {
        "success": True,
        "report": str(response),
        "topic": topic,
        "user_id": user_id
    }

def main():
    """Run the test."""
    print("🧪 Testing Simple Strands Research Agent")
    print("=" * 60)
    
    # Test research query
    result = test_research_query("Austin Texas real estate market trends 2025")
    
    print("\n" + "=" * 60)
    if result["success"]:
        print("✅ Test completed successfully!")
        print(f"Report length: {len(result['report'])} characters")
    else:
        print("❌ Test failed")
    
    return result

if __name__ == "__main__":
    result = main()
    
    # Output JSON for TypeScript integration
    print("\n" + "=" * 60)
    print("JSON OUTPUT:")
    print(json.dumps(result, indent=2))