#!/usr/bin/env python3
"""
Simple Strands Research Execution Script
Called directly from TypeScript with JSON input/output
"""

import sys
import json
import os
from research_agent import run_research_query

def main():
    try:
        # Read input from stdin or command line args
        if len(sys.argv) > 1:
            # Input from command line argument
            input_data = json.loads(sys.argv[1])
        else:
            # Input from stdin
            input_data = json.loads(sys.stdin.read())
        
        # Extract parameters
        topic = input_data.get('topic', '')
        user_id = input_data.get('userId', 'unknown')
        
        if not topic:
            result = {
                "success": False,
                "error": "Topic is required",
                "report": None,
                "citations": []
            }
        else:
            # Run the research query
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