#!/usr/bin/env python3
"""
Test Strands Integration for Bayon Coagent
Run this to verify Strands is working before integrating with TypeScript
"""

import sys
import os

def test_strands_installation():
    """Test if Strands is properly installed."""
    try:
        from strands import Agent
        from strands_tools import calculator, python_repl, http_request
        print("✅ Strands packages imported successfully")
        return True
    except ImportError as e:
        print(f"❌ Strands import failed: {e}")
        return False

def test_basic_agent():
    """Test basic agent creation and execution."""
    try:
        from strands import Agent
        from strands_tools import calculator
        
        # Create a simple test agent
        agent = Agent(
            tools=[calculator],
            system_prompt="You are a helpful assistant that can do math calculations."
        )
        
        # Test basic functionality
        response = agent("What is 2 + 2?")
        print(f"✅ Basic agent test successful: {response[:100]}...")
        return True
        
    except Exception as e:
        print(f"❌ Basic agent test failed: {e}")
        return False

def test_research_agent():
    """Test the research agent functionality."""
    try:
        # Import our research agent
        sys.path.append(os.path.join(os.path.dirname(__file__), 'src/services/strands'))
        from research_agent import create_enhanced_research_agent
        
        # Create research agent
        agent = create_enhanced_research_agent()
        
        # Test with a simple query
        response = agent("What are the current real estate market trends?")
        print(f"✅ Research agent test successful: {response[:200]}...")
        return True
        
    except Exception as e:
        print(f"❌ Research agent test failed: {e}")
        return False

def main():
    """Run all tests."""
    print("🧪 Testing Strands Integration for Bayon Coagent")
    print("=" * 50)
    
    tests = [
        ("Strands Installation", test_strands_installation),
        ("Basic Agent", test_basic_agent),
        ("Research Agent", test_research_agent),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n🔍 Testing {test_name}...")
        if test_func():
            passed += 1
        else:
            print(f"   ⚠️  {test_name} test failed")
    
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Strands integration is ready.")
        return True
    else:
        print("❌ Some tests failed. Please check the errors above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)