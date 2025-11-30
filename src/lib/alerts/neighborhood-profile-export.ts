/**
 * Neighborhood Profile Export Service
 * 
 * Implements PDF and HTML generation for neighborhood profiles with
 * agent branding, contact information, and professional formatting.
 * 
 * Requirements: 5.8-5.10
 */

import { uploadFile } from '@/aws/s3/client';
import type { NeighborhoodProfile } from './types';
import type { Profile } from '@/lib/types/common';

// Simple logger interface for this module
const logger = {
    debug: (message: string, context?: any) => console.debug(`[NeighborhoodProfileExport] ${message}`, context),
    info: (message: string, context?: any) => console.info(`[NeighborhoodProfileExport] ${message}`, context),
    warn: (message: string, context?: any) => console.warn(`[NeighborhoodProfileExport] ${message}`, context),
    error: (message: string, context?: any) => console.error(`[NeighborhoodProfileExport] ${message}`, context)
};

// ==================== PDF Generation ====================

/**
 * Generates a PDF export of a neighborhood profile
 * Uses jsPDF and html2canvas for client-side PDF generation
 */
export async function generatePDF(
    profile: NeighborhoodProfile,
    agentProfile: Profile,
    aiOutput: any
): Promise<Buffer> {
    logger.info('Starting PDF generation', { profileId: profile.id, location: profile.location });

    try {
        // Dynamic import to avoid SSR issues
        const jsPDF = (await import('jspdf')).default;
        const html2canvas = (await import('html2canvas')).default;

        // Create HTML content for the profile
        const htmlContent = generateProfileHTML(profile, agentProfile, aiOutput, 'pdf');

        // Create a temporary DOM element
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        tempDiv.style.width = '800px';
        tempDiv.style.padding = '40px';
        tempDiv.style.backgroundColor = 'white';
        tempDiv.style.fontFamily = 'Arial, sans-serif';
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '0';

        document.body.appendChild(tempDiv);

        try {
            // Convert HTML to canvas
            const canvas = await html2canvas(tempDiv, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                width: 800,
                height: tempDiv.scrollHeight
            });

            // Create PDF
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [800, canvas.height]
            });

            const imgData = canvas.toDataURL('image/png');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const ratio = canvasWidth / canvasHeight;
            const width = pdfWidth;
            const height = width / ratio;

            let heightLeft = height;
            let position = 0;

            // Add first page
            pdf.addImage(imgData, 'PNG', 0, position, width, height);
            heightLeft -= pdfHeight;

            // Add additional pages if needed
            while (heightLeft >= 0) {
                position = heightLeft - height;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, width, height);
                heightLeft -= pdfHeight;
            }

            // Convert PDF to buffer
            const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));

            logger.info('PDF generation completed', {
                profileId: profile.id,
                size: pdfBuffer.length
            });

            return pdfBuffer;

        } finally {
            // Clean up temporary DOM element
            document.body.removeChild(tempDiv);
        }

    } catch (error) {
        logger.error('PDF generation failed', { profileId: profile.id, error });
        throw new Error(`Failed to generate PDF: ${error}`);
    }
}

// ==================== HTML Generation ====================

/**
 * Generates an HTML export of a neighborhood profile
 * Creates a responsive, shareable HTML page with embedded styles
 */
export function generateHTML(
    profile: NeighborhoodProfile,
    agentProfile: Profile,
    aiOutput: any
): string {
    logger.info('Generating HTML export', { profileId: profile.id, location: profile.location });

    try {
        const htmlContent = generateProfileHTML(profile, agentProfile, aiOutput, 'html');

        const fullHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Neighborhood Profile: ${profile.location}</title>
    <meta name="description" content="Comprehensive neighborhood analysis for ${profile.location} by ${agentProfile.name || 'Real Estate Professional'}">
    <style>
        ${getEmbeddedCSS()}
    </style>
</head>
<body>
    <div class="container">
        ${htmlContent}
    </div>
    <script>
        // Add any interactive features here
        document.addEventListener('DOMContentLoaded', function() {
            // Print functionality
            const printBtn = document.getElementById('print-btn');
            if (printBtn) {
                printBtn.addEventListener('click', function() {
                    window.print();
                });
            }
        });
    </script>
</body>
</html>`;

        logger.info('HTML generation completed', { profileId: profile.id });
        return fullHTML;

    } catch (error) {
        logger.error('HTML generation failed', { profileId: profile.id, error });
        throw new Error(`Failed to generate HTML: ${error}`);
    }
}

// ==================== Common HTML Content Generation ====================

function generateProfileHTML(
    profile: NeighborhoodProfile,
    agentProfile: Profile,
    aiOutput: any,
    format: 'pdf' | 'html'
): string {
    const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return `
        <div class="profile-header">
            <div class="agent-branding">
                ${agentProfile.photoURL ? `
                    <img src="${agentProfile.photoURL}" alt="${agentProfile.name}" class="agent-photo">
                ` : ''}
                <div class="agent-info">
                    <h1 class="agent-name">${agentProfile.name || 'Real Estate Professional'}</h1>
                    ${agentProfile.agencyName ? `<p class="agency-name">${agentProfile.agencyName}</p>` : ''}
                    <div class="contact-info">
                        ${agentProfile.phone ? `<p class="contact-item">📞 ${agentProfile.phone}</p>` : ''}
                        ${agentProfile.website ? `<p class="contact-item">🌐 ${agentProfile.website}</p>` : ''}
                    </div>
                </div>
            </div>
            ${format === 'html' ? `
                <div class="export-actions">
                    <button id="print-btn" class="btn-secondary">Print Report</button>
                </div>
            ` : ''}
        </div>

        <div class="report-header">
            <h1 class="report-title">Neighborhood Profile</h1>
            <h2 class="location-title">${profile.location}</h2>
            <p class="report-date">Generated on ${currentDate}</p>
        </div>

        <div class="executive-summary">
            <h3>Executive Summary</h3>
            <div class="summary-content">
                ${aiOutput.aiInsights || profile.aiInsights}
            </div>
        </div>

        <div class="market-data-section">
            <h3>Market Analysis</h3>
            <div class="market-grid">
                <div class="metric-card">
                    <h4>Median Sale Price</h4>
                    <p class="metric-value">$${profile.marketData.medianSalePrice.toLocaleString()}</p>
                </div>
                <div class="metric-card">
                    <h4>Average Days on Market</h4>
                    <p class="metric-value">${profile.marketData.avgDaysOnMarket} days</p>
                </div>
                <div class="metric-card">
                    <h4>Sales Volume</h4>
                    <p class="metric-value">${profile.marketData.salesVolume} properties</p>
                </div>
                <div class="metric-card">
                    <h4>Inventory Level</h4>
                    <p class="metric-value">${profile.marketData.inventoryLevel} properties</p>
                </div>
            </div>
            ${aiOutput.marketCommentary ? `
                <div class="market-commentary">
                    <h4>Market Commentary</h4>
                    <p>${aiOutput.marketCommentary}</p>
                </div>
            ` : ''}
        </div>

        <div class="demographics-section">
            <h3>Demographics</h3>
            <div class="demographics-grid">
                <div class="demo-card">
                    <h4>Population</h4>
                    <p class="demo-value">${profile.demographics.population.toLocaleString()}</p>
                </div>
                <div class="demo-card">
                    <h4>Median Household Income</h4>
                    <p class="demo-value">$${profile.demographics.medianHouseholdIncome.toLocaleString()}</p>
                </div>
                <div class="demo-card">
                    <h4>Average Household Size</h4>
                    <p class="demo-value">${profile.demographics.householdComposition.averageHouseholdSize.toFixed(1)}</p>
                </div>
            </div>
            ${aiOutput.demographicInsights ? `
                <div class="demographic-insights">
                    <h4>Demographic Insights</h4>
                    <p>${aiOutput.demographicInsights}</p>
                </div>
            ` : ''}
        </div>

        <div class="schools-section">
            <h3>Schools</h3>
            <div class="schools-grid">
                ${profile.schools.map(school => `
                    <div class="school-card">
                        <h4>${school.name}</h4>
                        <p class="school-type">${school.type.charAt(0).toUpperCase() + school.type.slice(1)} • ${school.grades}</p>
                        <div class="school-rating">
                            <span class="rating-value">${school.rating}/10</span>
                            <span class="rating-stars">${'★'.repeat(Math.floor(school.rating / 2))}${'☆'.repeat(5 - Math.floor(school.rating / 2))}</span>
                        </div>
                        <p class="school-distance">${school.distance.toFixed(1)} miles away</p>
                    </div>
                `).join('')}
            </div>
            ${aiOutput.schoolAnalysis ? `
                <div class="school-analysis">
                    <h4>School Analysis</h4>
                    <p>${aiOutput.schoolAnalysis}</p>
                </div>
            ` : ''}
        </div>

        <div class="lifestyle-section">
            <h3>Lifestyle & Amenities</h3>
            <div class="walkability-card">
                <h4>Walkability Score</h4>
                <div class="walkability-score">
                    <span class="score-value">${profile.walkabilityScore}/100</span>
                    <div class="score-bar">
                        <div class="score-fill" style="width: ${profile.walkabilityScore}%"></div>
                    </div>
                </div>
            </div>
            
            <div class="amenities-grid">
                ${Object.entries(profile.amenities).map(([category, items]) => `
                    <div class="amenity-category">
                        <h4>${category.charAt(0).toUpperCase() + category.slice(1)}</h4>
                        <ul class="amenity-list">
                            ${items.slice(0, 5).map((item: any) => `
                                <li>${item.name} (${item.distance?.toFixed(1) || 'N/A'} mi)</li>
                            `).join('')}
                        </ul>
                    </div>
                `).join('')}
            </div>
            
            ${aiOutput.lifestyleFactors ? `
                <div class="lifestyle-insights">
                    <h4>Lifestyle Insights</h4>
                    <p>${aiOutput.lifestyleFactors}</p>
                </div>
            ` : ''}
        </div>

        ${aiOutput.investmentPotential ? `
            <div class="investment-section">
                <h3>Investment Potential</h3>
                <div class="investment-content">
                    ${aiOutput.investmentPotential}
                </div>
            </div>
        ` : ''}

        ${aiOutput.keyHighlights && aiOutput.keyHighlights.length > 0 ? `
            <div class="highlights-section">
                <h3>Key Highlights</h3>
                <ul class="highlights-list">
                    ${aiOutput.keyHighlights.map((highlight: string) => `
                        <li>${highlight}</li>
                    `).join('')}
                </ul>
            </div>
        ` : ''}

        <div class="footer">
            <div class="disclaimer">
                <p><strong>Disclaimer:</strong> This report is for informational purposes only. Market data is subject to change and should be verified independently. Contact ${agentProfile.name || 'your real estate professional'} for the most current information and professional guidance.</p>
            </div>
            <div class="report-info">
                <p>Report generated on ${currentDate} • Powered by Bayon Coagent</p>
            </div>
        </div>
    `;
}

// ==================== CSS Styles ====================

function getEmbeddedCSS(): string {
    return `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8f9fa;
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }

        .profile-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .agent-branding {
            display: flex;
            align-items: center;
            gap: 1.5rem;
        }

        .agent-photo {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            object-fit: cover;
            border: 3px solid white;
        }

        .agent-name {
            font-size: 1.5rem;
            font-weight: bold;
            margin-bottom: 0.25rem;
        }

        .agency-name {
            font-size: 1rem;
            opacity: 0.9;
            margin-bottom: 0.5rem;
        }

        .contact-info {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
        }

        .contact-item {
            font-size: 0.9rem;
            opacity: 0.9;
        }

        .export-actions {
            display: flex;
            gap: 1rem;
        }

        .btn-secondary {
            background: rgba(255,255,255,0.2);
            color: white;
            border: 1px solid rgba(255,255,255,0.3);
            padding: 0.5rem 1rem;
            border-radius: 0.375rem;
            cursor: pointer;
            font-size: 0.9rem;
            transition: background-color 0.2s;
        }

        .btn-secondary:hover {
            background: rgba(255,255,255,0.3);
        }

        .report-header {
            text-align: center;
            padding: 2rem;
            border-bottom: 1px solid #e5e7eb;
        }

        .report-title {
            font-size: 2rem;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 0.5rem;
        }

        .location-title {
            font-size: 1.5rem;
            color: #6b7280;
            margin-bottom: 0.5rem;
        }

        .report-date {
            color: #9ca3af;
            font-size: 0.9rem;
        }

        .executive-summary,
        .market-data-section,
        .demographics-section,
        .schools-section,
        .lifestyle-section,
        .investment-section,
        .highlights-section {
            padding: 2rem;
            border-bottom: 1px solid #e5e7eb;
        }

        .executive-summary h3,
        .market-data-section h3,
        .demographics-section h3,
        .schools-section h3,
        .lifestyle-section h3,
        .investment-section h3,
        .highlights-section h3 {
            font-size: 1.25rem;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 1rem;
        }

        .summary-content {
            font-size: 1rem;
            line-height: 1.7;
            color: #374151;
        }

        .market-grid,
        .demographics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 1rem;
            margin-bottom: 1.5rem;
        }

        .metric-card,
        .demo-card {
            background: #f9fafb;
            padding: 1.5rem;
            border-radius: 0.5rem;
            text-align: center;
            border: 1px solid #e5e7eb;
        }

        .metric-card h4,
        .demo-card h4 {
            font-size: 0.9rem;
            color: #6b7280;
            margin-bottom: 0.5rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .metric-value,
        .demo-value {
            font-size: 1.5rem;
            font-weight: bold;
            color: #1f2937;
        }

        .market-commentary,
        .demographic-insights,
        .school-analysis,
        .lifestyle-insights {
            background: #f0f9ff;
            padding: 1.5rem;
            border-radius: 0.5rem;
            border-left: 4px solid #0ea5e9;
        }

        .market-commentary h4,
        .demographic-insights h4,
        .school-analysis h4,
        .lifestyle-insights h4 {
            font-size: 1rem;
            font-weight: bold;
            color: #0c4a6e;
            margin-bottom: 0.5rem;
        }

        .schools-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
            margin-bottom: 1.5rem;
        }

        .school-card {
            background: #f9fafb;
            padding: 1.5rem;
            border-radius: 0.5rem;
            border: 1px solid #e5e7eb;
        }

        .school-card h4 {
            font-size: 1rem;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 0.5rem;
        }

        .school-type {
            font-size: 0.9rem;
            color: #6b7280;
            margin-bottom: 0.75rem;
        }

        .school-rating {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.5rem;
        }

        .rating-value {
            font-weight: bold;
            color: #059669;
        }

        .rating-stars {
            color: #fbbf24;
        }

        .school-distance {
            font-size: 0.9rem;
            color: #6b7280;
        }

        .walkability-card {
            background: #f9fafb;
            padding: 1.5rem;
            border-radius: 0.5rem;
            border: 1px solid #e5e7eb;
            margin-bottom: 1.5rem;
        }

        .walkability-card h4 {
            font-size: 1rem;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 1rem;
        }

        .walkability-score {
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .score-value {
            font-size: 1.5rem;
            font-weight: bold;
            color: #059669;
            min-width: 80px;
        }

        .score-bar {
            flex: 1;
            height: 8px;
            background: #e5e7eb;
            border-radius: 4px;
            overflow: hidden;
        }

        .score-fill {
            height: 100%;
            background: linear-gradient(90deg, #ef4444 0%, #f59e0b 50%, #10b981 100%);
            transition: width 0.3s ease;
        }

        .amenities-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
            margin-bottom: 1.5rem;
        }

        .amenity-category h4 {
            font-size: 1rem;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 0.75rem;
        }

        .amenity-list {
            list-style: none;
        }

        .amenity-list li {
            padding: 0.25rem 0;
            font-size: 0.9rem;
            color: #6b7280;
            border-bottom: 1px solid #f3f4f6;
        }

        .amenity-list li:last-child {
            border-bottom: none;
        }

        .investment-content {
            font-size: 1rem;
            line-height: 1.7;
            color: #374151;
        }

        .highlights-list {
            list-style: none;
        }

        .highlights-list li {
            padding: 0.75rem 0;
            font-size: 1rem;
            color: #374151;
            border-bottom: 1px solid #f3f4f6;
            position: relative;
            padding-left: 1.5rem;
        }

        .highlights-list li:before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #10b981;
            font-weight: bold;
        }

        .highlights-list li:last-child {
            border-bottom: none;
        }

        .footer {
            background: #f9fafb;
            padding: 2rem;
            border-top: 1px solid #e5e7eb;
        }

        .disclaimer {
            margin-bottom: 1rem;
        }

        .disclaimer p {
            font-size: 0.9rem;
            color: #6b7280;
            line-height: 1.6;
        }

        .report-info {
            text-align: center;
        }

        .report-info p {
            font-size: 0.8rem;
            color: #9ca3af;
        }

        @media (max-width: 768px) {
            .container {
                margin: 0;
                box-shadow: none;
            }

            .profile-header {
                flex-direction: column;
                gap: 1rem;
                text-align: center;
            }

            .agent-branding {
                flex-direction: column;
                text-align: center;
            }

            .market-grid,
            .demographics-grid,
            .schools-grid,
            .amenities-grid {
                grid-template-columns: 1fr;
            }

            .walkability-score {
                flex-direction: column;
                align-items: stretch;
                gap: 0.5rem;
            }
        }

        @media print {
            .export-actions {
                display: none;
            }
            
            .container {
                box-shadow: none;
            }
            
            body {
                background: white;
            }
        }
    `;
}

// ==================== Export Upload Functions ====================

/**
 * Uploads a PDF export to S3 and returns the shareable URL
 */
export async function uploadPDFExport(
    userId: string,
    profileId: string,
    pdfBuffer: Buffer,
    location: string
): Promise<string> {
    const timestamp = Date.now();
    const sanitizedLocation = location.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const filename = `neighborhood-profile-${sanitizedLocation}-${timestamp}.pdf`;
    const key = `users/${userId}/exports/${filename}`;

    logger.info('Uploading PDF export to S3', { userId, profileId, key });

    try {
        const url = await uploadFile(key, pdfBuffer, 'application/pdf', {
            profileId,
            location,
            exportType: 'pdf',
            generatedAt: new Date().toISOString()
        });

        logger.info('PDF export uploaded successfully', { userId, profileId, url });
        return url;

    } catch (error) {
        logger.error('Failed to upload PDF export', { userId, profileId, error });
        throw new Error(`Failed to upload PDF export: ${error}`);
    }
}

/**
 * Uploads an HTML export to S3 and returns the shareable URL
 */
export async function uploadHTMLExport(
    userId: string,
    profileId: string,
    htmlContent: string,
    location: string
): Promise<string> {
    const timestamp = Date.now();
    const sanitizedLocation = location.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const filename = `neighborhood-profile-${sanitizedLocation}-${timestamp}.html`;
    const key = `users/${userId}/exports/${filename}`;

    logger.info('Uploading HTML export to S3', { userId, profileId, key });

    try {
        const htmlBuffer = Buffer.from(htmlContent, 'utf-8');
        const url = await uploadFile(key, htmlBuffer, 'text/html', {
            profileId,
            location,
            exportType: 'html',
            generatedAt: new Date().toISOString()
        });

        logger.info('HTML export uploaded successfully', { userId, profileId, url });
        return url;

    } catch (error) {
        logger.error('Failed to upload HTML export', { userId, profileId, error });
        throw new Error(`Failed to upload HTML export: ${error}`);
    }
}