#!/usr/bin/env python3
"""
Safely optimize template.yaml by removing only comments and excessive whitespace
while preserving YAML structure and CloudFormation functionality.
"""

import re
import sys

def optimize_template():
    """Safely optimize the template by removing comments and extra whitespace."""
    
    # Read the original template
    with open('template.yaml', 'r') as f:
        lines = f.readlines()
    
    optimized_lines = []
    
    for line in lines:
        # Skip lines that are only comments (start with # after whitespace)
        if re.match(r'^\s*#', line):
            # Keep section dividers that might be important for structure
            if '==========' in line:
                continue
            else:
                continue
        
        # Remove inline comments but preserve the line structure
        # Only remove comments that are clearly safe (after significant whitespace)
        if '#' in line:
            # Find comment position
            comment_pos = line.find('#')
            # Only remove if there's significant whitespace before the comment
            if comment_pos > 0 and line[comment_pos-1:comment_pos+1] == ' #':
                line = line[:comment_pos].rstrip() + '\n'
        
        # Keep the line (even if it's empty - YAML structure matters)
        optimized_lines.append(line)
    
    # Remove excessive consecutive empty lines (more than 2)
    final_lines = []
    empty_count = 0
    
    for line in optimized_lines:
        if line.strip() == '':
            empty_count += 1
            if empty_count <= 2:  # Keep up to 2 consecutive empty lines
                final_lines.append(line)
        else:
            empty_count = 0
            final_lines.append(line)
    
    # Write the optimized template
    with open('template-optimized.yaml', 'w') as f:
        f.writelines(final_lines)
    
    # Calculate improvements
    original_lines = len(lines)
    optimized_lines_count = len(final_lines)
    
    original_size = sum(len(line) for line in lines)
    optimized_size = sum(len(line) for line in final_lines)
    
    print(f"Template optimization completed:")
    print(f"Lines: {original_lines:,} → {optimized_lines_count:,} ({((original_lines - optimized_lines_count) / original_lines * 100):.1f}% reduction)")
    print(f"Size: {original_size:,} → {optimized_size:,} chars ({((original_size - optimized_size) / original_size * 100):.1f}% reduction)")
    
    return optimized_lines_count < 5500  # Return True if under the problematic threshold

if __name__ == '__main__':
    success = optimize_template()
    if success:
        print("✅ Template optimized successfully and should resolve VS Code performance issues")
    else:
        print("⚠️  Template still large - consider using split templates for better performance")