/**
 * AI Visibility Export Module
 * 
 * This module provides functionality to export AI visibility data as PDF reports.
 * It generates comprehensive reports with visibility scores, mentions, sentiment analysis,
 * and competitor comparison data.
 */

import { jsPDF } from 'jspdf';
import type { AIMention, AIVisibilityScore } from '@/lib/types/common/common';

/**
 * Export data structure for AI visibility reports
 */
export interface AIVisibilityExportData {
    visibilityScore: AIVisibilityScore;
    mentions: AIMention[];
    competitorData?: Array<{
        name: string;
        score: number;
        mentionCount: number;
        sentimentDistribution: {
            positive: number;
            neutral: number;
            negative: number;
        };
    }>;
    dateRange: {
        start: string;
        end: string;
    };
    agentName: string;
}

/**
 * Generates a PDF report with AI visibility data
 * 
 * @param data - The export data containing visibility scores, mentions, and competitor data
 * @returns Buffer containing the PDF file
 */
export async function generatePDFReport(data: AIVisibilityExportData): Promise<Buffer> {
    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let yPosition = margin;

    // Helper function to add new page if needed
    const checkPageBreak = (requiredSpace: number) => {
        if (yPosition + requiredSpace > pageHeight - margin) {
            pdf.addPage();
            yPosition = margin;
            return true;
        }
        return false;
    };

    // Helper function to add text with word wrap
    const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 10) => {
        pdf.setFontSize(fontSize);
        const lines = pdf.splitTextToSize(text, maxWidth);
        pdf.text(lines, x, y);
        return lines.length * (fontSize * 0.35); // Return height used
    };

    // Title
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('AI Visibility Report', margin, yPosition);
    yPosition += 12;

    // Agent name and date range
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Agent: ${data.agentName}`, margin, yPosition);
    yPosition += 7;
    pdf.text(`Report Period: ${new Date(data.dateRange.start).toLocaleDateString()} - ${new Date(data.dateRange.end).toLocaleDateString()}`, margin, yPosition);
    yPosition += 7;
    pdf.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, margin, yPosition);
    yPosition += 12;

    // Divider line
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // === VISIBILITY SCORE SECTION ===
    checkPageBreak(40);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Visibility Score Overview', margin, yPosition);
    yPosition += 10;

    // Score box
    pdf.setFillColor(240, 240, 255);
    pdf.rect(margin, yPosition, contentWidth, 30, 'F');

    pdf.setFontSize(36);
    pdf.setFont('helvetica', 'bold');
    pdf.text(data.visibilityScore.score.toFixed(1), margin + 10, yPosition + 20);

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('out of 100', margin + 40, yPosition + 20);

    // Trend indicator
    const trendText = data.visibilityScore.trend === 'up' ? '↑' :
        data.visibilityScore.trend === 'down' ? '↓' : '→';
    const trendColor = data.visibilityScore.trend === 'up' ? [0, 150, 0] :
        data.visibilityScore.trend === 'down' ? [200, 0, 0] : [100, 100, 100];
    pdf.setTextColor(trendColor[0], trendColor[1], trendColor[2]);
    pdf.setFontSize(14);
    pdf.text(`${trendText} ${Math.abs(data.visibilityScore.trendPercentage).toFixed(1)}%`, margin + 10, yPosition + 27);
    pdf.setTextColor(0, 0, 0);

    yPosition += 35;

    // Score breakdown
    checkPageBreak(50);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Score Breakdown', margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const breakdown = data.visibilityScore.breakdown;
    pdf.text(`Mention Frequency: ${breakdown.mentionFrequency.toFixed(1)}`, margin + 5, yPosition);
    yPosition += 6;
    pdf.text(`Sentiment Score: ${breakdown.sentimentScore.toFixed(1)}`, margin + 5, yPosition);
    yPosition += 6;
    pdf.text(`Prominence Score: ${breakdown.prominenceScore.toFixed(1)}`, margin + 5, yPosition);
    yPosition += 6;
    pdf.text(`Platform Diversity: ${breakdown.platformDiversity.toFixed(1)}`, margin + 5, yPosition);
    yPosition += 10;

    // === MENTIONS SUMMARY ===
    checkPageBreak(40);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Mentions Summary', margin, yPosition);
    yPosition += 10;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Total Mentions: ${data.visibilityScore.mentionCount}`, margin, yPosition);
    yPosition += 8;

    // Sentiment distribution
    const sentiment = data.visibilityScore.sentimentDistribution;
    pdf.setTextColor(0, 150, 0);
    pdf.text(`Positive: ${sentiment.positive} (${((sentiment.positive / data.visibilityScore.mentionCount) * 100).toFixed(1)}%)`, margin + 5, yPosition);
    yPosition += 6;
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Neutral: ${sentiment.neutral} (${((sentiment.neutral / data.visibilityScore.mentionCount) * 100).toFixed(1)}%)`, margin + 5, yPosition);
    yPosition += 6;
    pdf.setTextColor(200, 0, 0);
    pdf.text(`Negative: ${sentiment.negative} (${((sentiment.negative / data.visibilityScore.mentionCount) * 100).toFixed(1)}%)`, margin + 5, yPosition);
    pdf.setTextColor(0, 0, 0);
    yPosition += 10;

    // Platform breakdown
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Platform Breakdown', margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const platforms = data.visibilityScore.platformBreakdown;
    pdf.text(`ChatGPT: ${platforms.chatgpt} mentions`, margin + 5, yPosition);
    yPosition += 6;
    pdf.text(`Perplexity: ${platforms.perplexity} mentions`, margin + 5, yPosition);
    yPosition += 6;
    pdf.text(`Claude: ${platforms.claude} mentions`, margin + 5, yPosition);
    yPosition += 6;
    pdf.text(`Gemini: ${platforms.gemini} mentions`, margin + 5, yPosition);
    yPosition += 12;

    // === RECENT MENTIONS ===
    if (data.mentions.length > 0) {
        checkPageBreak(30);
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Recent Mentions', margin, yPosition);
        yPosition += 10;

        // Show up to 5 most recent mentions
        const recentMentions = data.mentions.slice(0, 5);

        for (const mention of recentMentions) {
            checkPageBreak(35);

            // Mention header
            pdf.setFillColor(250, 250, 250);
            pdf.rect(margin, yPosition, contentWidth, 8, 'F');

            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'bold');
            pdf.text(`${mention.platform.toUpperCase()} - ${new Date(mention.timestamp).toLocaleDateString()}`, margin + 2, yPosition + 5);

            // Sentiment badge
            const sentimentColor = mention.sentiment === 'positive' ? [0, 150, 0] :
                mention.sentiment === 'negative' ? [200, 0, 0] : [100, 100, 100];
            pdf.setTextColor(sentimentColor[0], sentimentColor[1], sentimentColor[2]);
            pdf.text(mention.sentiment.toUpperCase(), pageWidth - margin - 20, yPosition + 5);
            pdf.setTextColor(0, 0, 0);

            yPosition += 10;

            // Query
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'italic');
            const queryHeight = addWrappedText(`Query: ${mention.query}`, margin + 2, yPosition, contentWidth - 4, 9);
            yPosition += queryHeight + 3;

            // Snippet
            pdf.setFont('helvetica', 'normal');
            const snippetHeight = addWrappedText(mention.snippet, margin + 2, yPosition, contentWidth - 4, 9);
            yPosition += snippetHeight + 8;
        }

        if (data.mentions.length > 5) {
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'italic');
            pdf.text(`... and ${data.mentions.length - 5} more mentions`, margin, yPosition);
            yPosition += 10;
        }
    }

    // === COMPETITOR COMPARISON ===
    if (data.competitorData && data.competitorData.length > 0) {
        checkPageBreak(30);
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Competitor Comparison', margin, yPosition);
        yPosition += 10;

        // Sort competitors by score
        const sortedCompetitors = [...data.competitorData].sort((a, b) => b.score - a.score);

        // Table header
        pdf.setFillColor(240, 240, 240);
        pdf.rect(margin, yPosition, contentWidth, 8, 'F');
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Agent', margin + 2, yPosition + 5);
        pdf.text('Score', margin + 80, yPosition + 5);
        pdf.text('Mentions', margin + 110, yPosition + 5);
        pdf.text('Sentiment', margin + 145, yPosition + 5);
        yPosition += 10;

        // Table rows
        pdf.setFont('helvetica', 'normal');
        for (const competitor of sortedCompetitors) {
            checkPageBreak(8);

            pdf.text(competitor.name.substring(0, 30), margin + 2, yPosition);
            pdf.text(competitor.score.toFixed(1), margin + 80, yPosition);
            pdf.text(competitor.mentionCount.toString(), margin + 110, yPosition);

            const posPercent = ((competitor.sentimentDistribution.positive / competitor.mentionCount) * 100).toFixed(0);
            pdf.text(`${posPercent}% positive`, margin + 145, yPosition);

            yPosition += 7;
        }
    }

    // === FOOTER ===
    const totalPages = (pdf as any).internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        pdf.text('Generated by Bayon Coagent AI Visibility Monitoring', pageWidth / 2, pageHeight - 6, { align: 'center' });
    }

    // Convert to buffer
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));
    return pdfBuffer;
}

/**
 * Generates a filename for the export
 * 
 * @param agentName - The agent's name
 * @param dateRange - The date range for the report
 * @returns A formatted filename
 */
export function generateExportFilename(agentName: string, dateRange: { start: string; end: string }): string {
    const sanitizedName = agentName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const startDate = new Date(dateRange.start).toISOString().split('T')[0];
    const endDate = new Date(dateRange.end).toISOString().split('T')[0];
    return `ai_visibility_${sanitizedName}_${startDate}_to_${endDate}.pdf`;
}
