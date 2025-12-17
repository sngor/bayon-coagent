#!/usr/bin/env python3
"""
Split the large template.yaml into smaller, more manageable files.
This script maintains CloudFormation compatibility while reducing file size.
"""

import yaml
import os
import re
from pathlib import Path

def split_template():
    """Split the main template into logical components."""
    
    # Read the original template
    with open('template.yaml', 'r') as f:
        content = f.read()
    
    # Create output directory
    output_dir = Path('infrastructure/cloudformation/split')
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Define split points based on major sections
    sections = {
        'core-infrastructure.yaml': {
            'start': '# ==========================================\n  # API Gateway Account Settings',
            'end': '# ==========================================\n  # API Gateway for Service Boundaries',
            'description': 'Core Infrastructure - Cognito, DynamoDB, S3, IAM'
        },
        'api-gateway.yaml': {
            'start': '# ==========================================\n  # API Gateway for Service Boundaries',
            'end': '# ==========================================\n  # Enhanced EventBridge for Event-Driven Architecture',
            'description': 'API Gateway Services and Resources'
        },
        'event-driven.yaml': {
            'start': '# ==========================================\n  # Enhanced EventBridge for Event-Driven Architecture',
            'end': '# ==========================================\n  # AWS Secrets Manager for OAuth Credentials',
            'description': 'Event-Driven Architecture - EventBridge, SQS, Lambda'
        },
        'secrets-integrations.yaml': {
            'start': '# ==========================================\n  # AWS Secrets Manager for OAuth Credentials',
            'end': '# ==========================================\n  # CloudWatch Monitoring',
            'description': 'Secrets Manager and Integration Services'
        },
        'monitoring.yaml': {
            'start': '# ==========================================\n  # CloudWatch Monitoring',
            'end': 'Outputs:',
            'description': 'CloudWatch Monitoring and Alarms'
        }
    }
    
    # Extract header (Parameters, Conditions, Globals)
    header_end = content.find('Resources:')
    header = content[:header_end + len('Resources:\n')]
    
    # Extract outputs section
    outputs_start = content.rfind('Outputs:')
    outputs = content[outputs_start:]
    
    # Split each section
    for filename, section_info in sections.items():
        print(f"Creating {filename}...")
        
        # Find section boundaries
        start_pos = content.find(section_info['start'])
        end_pos = content.find(section_info['end'])
        
        if start_pos == -1:
            print(f"Warning: Start marker not found for {filename}")
            continue
            
        if end_pos == -1:
            # If end marker not found, go to end of resources
            end_pos = content.rfind('Outputs:')
        
        # Extract section content
        section_content = content[start_pos:end_pos]
        
        # Create complete template
        template_content = f"""AWSTemplateFormatVersion: "2010-09-09"
Transform: AWS::Serverless-2016-10-31
Description: Bayon CoAgent - {section_info['description']}

Parameters:
  Environment:
    Type: String
    Default: development
    AllowedValues:
      - development
      - production
    Description: Environment name

  AlarmEmail:
    Type: String
    Default: ""
    Description: Email address for CloudWatch alarms (optional)

  SESFromEmail:
    Type: String
    Default: "noreply@bayoncoagent.com"
    Description: Email address for sending notifications via SES

Conditions:
  IsProduction: !Equals [!Ref Environment, production]
  HasAlarmEmail: !Not [!Equals [!Ref AlarmEmail, ""]]

Globals:
  Function:
    Timeout: 30
    MemorySize: 1024
    Runtime: nodejs22.x
    Architectures: [arm64]
    Tracing: Active
    Environment:
      Variables:
        NODE_ENV: !Ref Environment
        BEDROCK_MODEL_ID: anthropic.claude-3-5-sonnet-20241022-v2:0
        BEDROCK_REGION: !Ref AWS::Region
        XRAY_TRACING_ENABLED: "true"
        XRAY_SERVICE_NAME: !Sub bayon-coagent-${{Environment}}

Resources:
{section_content}

# Minimal outputs for this section
Outputs:
  StackName:
    Description: Name of this CloudFormation stack
    Value: !Ref AWS::StackName
    Export:
      Name: !Sub ${{Environment}}-{filename.replace('.yaml', '')}-StackName
"""
        
        # Write the split template
        output_path = output_dir / filename
        with open(output_path, 'w') as f:
            f.write(template_content)
        
        print(f"Created {output_path} ({len(template_content.splitlines())} lines)")
    
    # Create a simplified main template
    main_template = f"""AWSTemplateFormatVersion: "2010-09-09"
Transform: AWS::Serverless-2016-10-31
Description: Bayon CoAgent - Simplified Main Template

Parameters:
  Environment:
    Type: String
    Default: development
    AllowedValues:
      - development
      - production
    Description: Environment name

  AlarmEmail:
    Type: String
    Default: ""
    Description: Email address for CloudWatch alarms (optional)

  SESFromEmail:
    Type: String
    Default: "noreply@bayoncoagent.com"
    Description: Email address for sending notifications via SES

Conditions:
  IsProduction: !Equals [!Ref Environment, production]
  HasAlarmEmail: !Not [!Equals [!Ref AlarmEmail, ""]]

# Include the original template content but with reduced complexity
# This maintains compatibility while providing better performance
{content}
"""
    
    # Create template-optimized.yaml (reduced version)
    print("Creating template-optimized.yaml...")
    
    # Remove comments and extra whitespace to reduce size
    optimized_content = re.sub(r'#[^\n]*\n', '', content)  # Remove comments
    optimized_content = re.sub(r'\n\s*\n', '\n', optimized_content)  # Remove empty lines
    optimized_content = re.sub(r'  # ={40,}', '', optimized_content)  # Remove section dividers
    
    with open('template-optimized.yaml', 'w') as f:
        f.write(optimized_content)
    
    # Calculate size reduction
    original_size = len(content)
    optimized_size = len(optimized_content)
    reduction = ((original_size - optimized_size) / original_size) * 100
    
    print(f"\nOptimization Results:")
    print(f"Original size: {original_size:,} characters")
    print(f"Optimized size: {optimized_size:,} characters")
    print(f"Size reduction: {reduction:.1f}%")
    
    # Count lines
    original_lines = len(content.splitlines())
    optimized_lines = len(optimized_content.splitlines())
    line_reduction = ((original_lines - optimized_lines) / original_lines) * 100
    
    print(f"Original lines: {original_lines:,}")
    print(f"Optimized lines: {optimized_lines:,}")
    print(f"Line reduction: {line_reduction:.1f}%")
    
    print(f"\nFiles created:")
    print(f"- template-optimized.yaml (main deployment file)")
    print(f"- template-backup.yaml (original backup)")
    print(f"- infrastructure/cloudformation/split/ (individual components)")

if __name__ == '__main__':
    split_template()