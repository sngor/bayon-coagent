/**
 * Efficiency Optimizer
 * 
 * This module provides response optimization capabilities:
 * 1. Filler word and greeting removal
 * 2. Structured formatting (bullet points, tables)
 * 3. Answer prioritization (answer before reasoning)
 * 
 * Requirements: 7.1, 7.2, 7.4
 */

/**
 * Configuration for efficiency optimization
 */
export interface OptimizationConfig {
  maxLength?: number;
  useBulletPoints: boolean;
  useTables: boolean;
  removeGreetings: boolean;
  removeFiller: boolean;
  prioritizeAnswer: boolean;
}

/**
 * Result of optimization processing
 */
export interface OptimizationResult {
  optimizedText: string;
  modificationsApplied: string[];
  originalLength: number;
  optimizedLength: number;
  reductionPercentage: number;
}

/**
 * Represents a structured data section that can be formatted as a table
 */
interface TableCandidate {
  startIndex: number;
  endIndex: number;
  rows: string[][];
  headers: string[];
}

/**
 * Represents a list section that can be formatted as bullet points
 */
interface ListCandidate {
  startIndex: number;
  endIndex: number;
  items: string[];
}

/**
 * Filler words and phrases to remove
 */
const FILLER_PATTERNS = [
  // Conversational greetings
  /^(hello|hi|hey|greetings|good morning|good afternoon|good evening)[,!.\s]*/gi,
  /\b(thank you for (asking|your question|reaching out))[,.\s]*/gi,
  
  // Unnecessary politeness
  /\b(i hope this helps|i hope that helps|hope this helps)[,.\s]*/gi,
  /\b(please (feel free to|don't hesitate to))[,.\s]*/gi,
  /\b(let me know if you (have|need))[,.\s]*/gi,
  /\b(if you have any (other )?questions)[,.\s]*/gi,
  
  // Hedging language (excessive)
  /\b(kind of|sort of|basically|actually|literally)\b/gi,
  /\b(you know|I mean|like)\b/gi,
  
  // Redundant phrases
  /\b(in order to)\b/g, // Replace with "to"
  /\b(due to the fact that)\b/g, // Replace with "because"
  /\b(at this point in time)\b/g, // Replace with "now"
  /\b(in the event that)\b/g, // Replace with "if"
  
  // Closing pleasantries
  /\b(have a (great|good|nice|wonderful) day)[,!.\s]*/gi,
  /\b(best (of luck|wishes|regards))[,!.\s]*/gi,
];

/**
 * Replacements for redundant phrases (pattern -> replacement)
 */
const PHRASE_REPLACEMENTS: Record<string, string> = {
  'in order to': 'to',
  'due to the fact that': 'because',
  'at this point in time': 'now',
  'in the event that': 'if',
  'for the purpose of': 'to',
  'with regard to': 'regarding',
  'in spite of the fact that': 'although',
};

/**
 * Patterns to detect reasoning sections that should be moved after the answer
 */
const REASONING_INDICATORS = [
  /^(here's why|the reason is|this is because|let me explain)/i,
  /^(to understand this|to break this down|to analyze)/i,
  /^(first|second|third|finally|in conclusion)/i,
];

/**
 * Patterns to detect answer sections
 */
const ANSWER_INDICATORS = [
  /^(the answer is|in summary|to summarize|bottom line)/i,
  /^(key takeaway|main point|in short)/i,
  /^(yes|no),/i,
];

/**
 * Efficiency Optimizer Service
 * 
 * Optimizes AI-generated responses for maximum readability and conciseness
 */
export class EfficiencyOptimizer {
  private config: OptimizationConfig;

  constructor(config: Partial<OptimizationConfig> = {}) {
    this.config = {
      useBulletPoints: true,
      useTables: true,
      removeGreetings: true,
      removeFiller: true,
      prioritizeAnswer: true,
      ...config,
    };
  }

  /**
   * Optimize a response for efficiency and readability
   */
  optimize(text: string): OptimizationResult {
    const originalLength = text.length;
    let optimizedText = text;
    const modificationsApplied: string[] = [];

    // Step 1: Remove filler words and greetings
    if (this.config.removeFiller || this.config.removeGreetings) {
      const fillerResult = this.removeFiller(optimizedText);
      optimizedText = fillerResult.text;
      if (fillerResult.modified) {
        modificationsApplied.push('Removed filler words and greetings');
      }
    }

    // Step 2: Prioritize answer over reasoning
    if (this.config.prioritizeAnswer) {
      const priorityResult = this.prioritizeAnswer(optimizedText);
      optimizedText = priorityResult.text;
      if (priorityResult.modified) {
        modificationsApplied.push('Restructured to prioritize answer');
      }
    }

    // Step 3: Format lists as bullet points
    if (this.config.useBulletPoints) {
      const bulletResult = this.formatAsBullets(optimizedText);
      optimizedText = bulletResult.text;
      if (bulletResult.modified) {
        modificationsApplied.push('Converted lists to bullet points');
      }
    }

    // Step 4: Format structured data as tables
    if (this.config.useTables) {
      const tableResult = this.formatAsTables(optimizedText);
      optimizedText = tableResult.text;
      if (tableResult.modified) {
        modificationsApplied.push('Converted structured data to tables');
      }
    }

    // Step 5: Truncate if max length specified
    if (this.config.maxLength && optimizedText.length > this.config.maxLength) {
      optimizedText = this.truncate(optimizedText, this.config.maxLength);
      modificationsApplied.push(`Truncated to ${this.config.maxLength} characters`);
    }

    const optimizedLength = optimizedText.length;
    const reductionPercentage = originalLength > 0
      ? ((originalLength - optimizedLength) / originalLength) * 100
      : 0;

    return {
      optimizedText: optimizedText.trim(),
      modificationsApplied,
      originalLength,
      optimizedLength,
      reductionPercentage,
    };
  }

  /**
   * Remove filler words, greetings, and unnecessary phrases
   */
  private removeFiller(text: string): { text: string; modified: boolean } {
    let result = text;
    let modified = false;

    // Remove greeting patterns
    if (this.config.removeGreetings) {
      for (const pattern of FILLER_PATTERNS) {
        const before = result;
        result = result.replace(pattern, '');
        if (before !== result) modified = true;
      }
    }

    // Replace redundant phrases with concise alternatives
    if (this.config.removeFiller) {
      for (const [phrase, replacement] of Object.entries(PHRASE_REPLACEMENTS)) {
        const pattern = new RegExp(phrase, 'gi');
        const before = result;
        result = result.replace(pattern, replacement);
        if (before !== result) modified = true;
      }
    }

    // Clean up extra whitespace
    result = result.replace(/\n{3,}/g, '\n\n'); // Max 2 consecutive newlines
    result = result.replace(/  +/g, ' '); // Multiple spaces to single space
    result = result.trim();

    return { text: result, modified };
  }

  /**
   * Format lists as bullet points
   */
  private formatAsBullets(text: string): { text: string; modified: boolean } {
    const listCandidates = this.detectLists(text);
    
    if (listCandidates.length === 0) {
      return { text, modified: false };
    }

    let result = text;
    let offset = 0;

    // Process lists from end to start to maintain indices
    const sortedLists = [...listCandidates].sort((a, b) => b.startIndex - a.startIndex);

    for (const list of sortedLists) {
      const bulletList = list.items.map(item => `• ${item.trim()}`).join('\n');
      
      const before = result.substring(0, list.startIndex);
      const after = result.substring(list.endIndex);
      result = before + bulletList + after;
    }

    return { text: result, modified: true };
  }

  /**
   * Detect list patterns in text
   */
  private detectLists(text: string): ListCandidate[] {
    const lists: ListCandidate[] = [];
    
    // Pattern 1: Numbered lists (1. 2. 3. or 1) 2) 3))
    // Split into lines and process manually to avoid 's' flag
    const lines = text.split('\n');
    let currentList: string[] = [];
    let listStartIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const numberedMatch = line.match(/^\d+[.)]\s+(.+)/);
      
      if (numberedMatch) {
        if (currentList.length === 0) {
          listStartIndex = text.indexOf(line);
        }
        currentList.push(numberedMatch[1].trim());
      } else if (currentList.length >= 2) {
        // End of list, save it
        const listText = currentList.map((item, idx) => `${idx + 1}. ${item}`).join('\n');
        lists.push({
          startIndex: listStartIndex,
          endIndex: listStartIndex + listText.length,
          items: currentList,
        });
        currentList = [];
        listStartIndex = -1;
      } else {
        currentList = [];
        listStartIndex = -1;
      }
    }
    
    // Check for list at end of text
    if (currentList.length >= 2) {
      const listText = currentList.map((item, idx) => `${idx + 1}. ${item}`).join('\n');
      lists.push({
        startIndex: listStartIndex,
        endIndex: listStartIndex + listText.length,
        items: currentList,
      });
    }

    // Pattern 2: Dash or asterisk lists (- item or * item)
    currentList = [];
    listStartIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const dashMatch = line.match(/^[-*]\s+(.+)/);
      
      if (dashMatch) {
        if (currentList.length === 0) {
          listStartIndex = text.indexOf(line);
        }
        currentList.push(dashMatch[1].trim());
      } else if (currentList.length >= 2) {
        // End of list, save it
        const listText = currentList.map(item => `- ${item}`).join('\n');
        lists.push({
          startIndex: listStartIndex,
          endIndex: listStartIndex + listText.length,
          items: currentList,
        });
        currentList = [];
        listStartIndex = -1;
      } else {
        currentList = [];
        listStartIndex = -1;
      }
    }
    
    // Check for list at end of text
    if (currentList.length >= 2) {
      const listText = currentList.map(item => `- ${item}`).join('\n');
      lists.push({
        startIndex: listStartIndex,
        endIndex: listStartIndex + listText.length,
        items: currentList,
      });
    }

    return lists;
  }

  /**
   * Format structured data as tables
   */
  private formatAsTables(text: string): { text: string; modified: boolean } {
    const tableCandidates = this.detectTables(text);
    
    if (tableCandidates.length === 0) {
      return { text, modified: false };
    }

    let result = text;

    // Process tables from end to start to maintain indices
    const sortedTables = [...tableCandidates].sort((a, b) => b.startIndex - a.startIndex);

    for (const table of sortedTables) {
      const markdownTable = this.createMarkdownTable(table.headers, table.rows);
      
      const before = result.substring(0, table.startIndex);
      const after = result.substring(table.endIndex);
      result = before + markdownTable + after;
    }

    return { text: result, modified: true };
  }

  /**
   * Detect structured data that can be formatted as tables
   */
  private detectTables(text: string): TableCandidate[] {
    const tables: TableCandidate[] = [];
    
    // Pattern: Look for repeated "Label: Value" patterns
    const labelValuePattern = /(?:^|\n)((?:[A-Z][^:\n]+:\s*[^\n]+\n?){3,})/g;
    let match;
    
    while ((match = labelValuePattern.exec(text)) !== null) {
      const startIndex = match.index;
      const fullMatch = match[1];
      
      // Parse label-value pairs
      const pairs = fullMatch
        .split('\n')
        .filter(line => line.includes(':'))
        .map(line => {
          const [label, ...valueParts] = line.split(':');
          return [label.trim(), valueParts.join(':').trim()];
        });
      
      if (pairs.length >= 3) {
        tables.push({
          startIndex,
          endIndex: startIndex + fullMatch.length,
          headers: ['Property', 'Value'],
          rows: pairs,
        });
      }
    }

    return tables;
  }

  /**
   * Create a markdown table from headers and rows
   */
  private createMarkdownTable(headers: string[], rows: string[][]): string {
    const headerRow = `| ${headers.join(' | ')} |`;
    const separatorRow = `| ${headers.map(() => '---').join(' | ')} |`;
    const dataRows = rows.map(row => `| ${row.join(' | ')} |`).join('\n');
    
    return `\n${headerRow}\n${separatorRow}\n${dataRows}\n`;
  }

  /**
   * Prioritize answer over reasoning by restructuring the response
   */
  private prioritizeAnswer(text: string): { text: string; modified: boolean } {
    const paragraphs = text.split(/\n\n+/);
    
    if (paragraphs.length < 2) {
      return { text, modified: false };
    }

    let answerIndex = -1;
    let reasoningIndices: number[] = [];

    // Identify answer and reasoning paragraphs
    paragraphs.forEach((para, index) => {
      const trimmed = para.trim();
      
      // Check if this is an answer paragraph
      if (ANSWER_INDICATORS.some(pattern => pattern.test(trimmed))) {
        answerIndex = index;
      }
      
      // Check if this is a reasoning paragraph
      if (REASONING_INDICATORS.some(pattern => pattern.test(trimmed))) {
        reasoningIndices.push(index);
      }
    });

    // If answer is not first and we found reasoning before it, restructure
    if (answerIndex > 0 && reasoningIndices.some(i => i < answerIndex)) {
      const answerPara = paragraphs[answerIndex];
      const otherParas = paragraphs.filter((_, i) => i !== answerIndex);
      
      const restructured = [answerPara, '', ...otherParas].join('\n\n');
      return { text: restructured, modified: true };
    }

    return { text, modified: false };
  }

  /**
   * Truncate text to maximum length while preserving sentence boundaries
   */
  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }

    // Try to truncate at sentence boundary
    const truncated = text.substring(0, maxLength);
    const lastPeriod = truncated.lastIndexOf('.');
    
    if (lastPeriod > maxLength * 0.8) {
      // If we can preserve at least 80% of content, truncate at sentence
      return truncated.substring(0, lastPeriod + 1);
    }

    // Otherwise, truncate at word boundary with ellipsis
    const lastSpace = truncated.lastIndexOf(' ');
    return truncated.substring(0, lastSpace) + '...';
  }
}

/**
 * Default configuration for efficiency optimization
 */
export const DEFAULT_OPTIMIZATION_CONFIG: OptimizationConfig = {
  useBulletPoints: true,
  useTables: true,
  removeGreetings: true,
  removeFiller: true,
  prioritizeAnswer: true,
};
