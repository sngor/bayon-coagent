#!/usr/bin/env python3
"""
Test Strands Agent for Real Estate Assistant
"""

from strands import Agent
from strands_tools import calculator, python_repl, http_request

def main():
    # Create an agent with community tools using Bedrock Claude 4 Sonnet by default
    agent = Agent(
        tools=[calculator, python_repl, http_request],
        system_prompt="""You are a helpful real estate assistant powered by AI. 
        You can help with:
        - Property calculations (mortgage payments, ROI, valuations)
        - Market research and data analysis
        - Real estate math and financial analysis
        - Web research for market trends
        
        Always be accurate with calculations and provide clear explanations."""
    )

    print("🏠 Real Estate AI Agent initialized!")
    print("Available tools: Calculator, Python REPL, HTTP Requests")
    print("-" * 50)

    # Test the agent with a real estate question
    print("Testing with a mortgage calculation question...")
    response = agent("Calculate the monthly mortgage payment for a $500,000 house with 20% down payment, 30-year loan at 7% interest rate. Show me the calculation steps.")
    print(f"Agent Response:\n{response}")
    
    print("\n" + "=" * 50)
    
    # Test conversation memory
    print("Testing conversation memory...")
    agent("My name is Sarah and I'm a real estate agent in Austin, Texas.")
    response = agent("What's my name and where do I work?")
    print(f"Memory Test Response:\n{response}")

if __name__ == "__main__":
    main()