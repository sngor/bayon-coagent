/**
 * Test script for keyword rankings functionality
 */

import { getKeywordRankings } from './src/aws/bedrock/flows/get-keyword-rankings';

async function testKeywordRankings() {
    console.log('Testing Keyword Rankings Flow...\n');

    try {
        const result = await getKeywordRankings({
            keyword: 'best real estate agent',
            location: 'Seattle, WA',
        });

        console.log('✅ Success! Rankings retrieved:');
        console.log(JSON.stringify(result, null, 2));

        // Validate structure
        if (!result.rankings || !Array.isArray(result.rankings)) {
            throw new Error('Invalid response structure: missing rankings array');
        }

        if (result.rankings.length === 0) {
            console.log('\n⚠️  Warning: No rankings returned (this may be expected if search fails)');
        }

        // Validate each ranking
        result.rankings.forEach((ranking, index) => {
            if (typeof ranking.rank !== 'number') {
                throw new Error(`Ranking ${index}: rank must be a number`);
            }
            if (typeof ranking.agentName !== 'string') {
                throw new Error(`Ranking ${index}: agentName must be a string`);
            }
            if (typeof ranking.agencyName !== 'string') {
                throw new Error(`Ranking ${index}: agencyName must be a string`);
            }
            console.log(`\n#${ranking.rank}: ${ranking.agentName} - ${ranking.agencyName}`);
            if (ranking.url) {
                console.log(`   URL: ${ranking.url}`);
            }
        });

        console.log('\n✅ All validations passed!');
    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

testKeywordRankings();
