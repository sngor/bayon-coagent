/**
 * SEO Components Usage Example
 * 
 * This file demonstrates how to use the SEO UI components together.
 * These components are designed to be used in the Studio Write feature
 * and other content creation areas.
 */

'use client';

import { useState } from 'react';
import { SEODashboard } from './seo-dashboard';
import { SEOAnalysisCard } from './seo-analysis-card';
import { SEORecommendationList } from './seo-recommendation-list';
import { KeywordSuggestionPanel } from './keyword-suggestion-panel';
import { MetaDescriptionEditor } from './meta-description-editor';
import type { SEOAnalysis, SavedKeyword, SEORecommendation } from '@/lib/types/common';

export function SEOComponentsExample() {
    const [metaDescription, setMetaDescription] = useState('');

    // Example data
    const exampleAnalyses: SEOAnalysis[] = [
        {
            id: 'analysis-1',
            userId: 'user-123',
            contentId: 'blog-post-1',
            contentType: 'blog-post',
            score: 85,
            recommendations: [
                {
                    priority: 'medium',
                    category: 'keywords',
                    message: 'Consider using your target keywords more frequently.',
                    currentValue: '0.8%',
                    suggestedValue: '1-2%',
                },
            ],
            analyzedAt: new Date().toISOString(),
            previousScore: 78,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
        {
            id: 'analysis-2',
            userId: 'user-123',
            contentId: 'blog-post-2',
            contentType: 'blog-post',
            score: 45,
            recommendations: [
                {
                    priority: 'high',
                    category: 'title',
                    message: 'Title is too short. Aim for 50-60 characters for better SEO.',
                    currentValue: '25 characters',
                    suggestedValue: '50-60 characters',
                },
                {
                    priority: 'high',
                    category: 'length',
                    message: 'Content is short. Expand to at least 1500 words for better SEO.',
                    currentValue: '450 words',
                    suggestedValue: '1500+ words',
                },
            ],
            analyzedAt: new Date().toISOString(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
    ];

    const exampleKeywords: SavedKeyword[] = [
        {
            id: 'keyword-1',
            userId: 'user-123',
            keyword: 'Seattle real estate market',
            searchVolume: 2400,
            competition: 'low',
            location: 'Seattle, WA',
            addedAt: new Date().toISOString(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
        {
            id: 'keyword-2',
            userId: 'user-123',
            keyword: 'homes for sale Seattle',
            searchVolume: 5600,
            competition: 'high',
            location: 'Seattle, WA',
            addedAt: new Date().toISOString(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
    ];

    const scoreHistory = [
        { analyzedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), score: 78 },
        { analyzedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), score: 82 },
        { analyzedAt: new Date().toISOString(), score: 85 },
    ];

    const handleApplyRecommendation = (recommendation: SEORecommendation) => {
        console.log('Applying recommendation:', recommendation);
        // In a real implementation, this would update the content
    };

    const handleSaveKeyword = (keyword: SavedKeyword) => {
        console.log('Saving keyword:', keyword);
        // In a real implementation, this would save to the database
    };

    return (
        <div className="container mx-auto py-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold mb-2">SEO Components Example</h1>
                <p className="text-muted-foreground">
                    Demonstration of all SEO UI components
                </p>
            </div>

            {/* SEO Dashboard */}
            <section>
                <h2 className="text-2xl font-semibold mb-4">SEO Dashboard</h2>
                <SEODashboard userId="user-123" analyses={exampleAnalyses} />
            </section>

            {/* SEO Analysis Card */}
            <section>
                <h2 className="text-2xl font-semibold mb-4">SEO Analysis Card</h2>
                <SEOAnalysisCard
                    analysis={exampleAnalyses[0]}
                    scoreHistory={scoreHistory}
                    showRecommendations={true}
                />
            </section>

            {/* SEO Recommendation List */}
            <section>
                <h2 className="text-2xl font-semibold mb-4">SEO Recommendation List</h2>
                <SEORecommendationList
                    recommendations={exampleAnalyses[1].recommendations}
                    onApply={handleApplyRecommendation}
                />
            </section>

            {/* Keyword Suggestion Panel */}
            <section>
                <h2 className="text-2xl font-semibold mb-4">Keyword Suggestion Panel</h2>
                <KeywordSuggestionPanel
                    keywords={exampleKeywords}
                    savedKeywordIds={new Set(['keyword-1'])}
                    onSave={handleSaveKeyword}
                />
            </section>

            {/* Meta Description Editor */}
            <section>
                <h2 className="text-2xl font-semibold mb-4">Meta Description Editor</h2>
                <MetaDescriptionEditor
                    value={metaDescription}
                    onChange={setMetaDescription}
                />
            </section>
        </div>
    );
}
