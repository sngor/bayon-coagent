/**
 * Export Functionality Validation
 * 
 * Simple validation script for the multi-format export functionality
 */

import { 
  toJSONLD, 
  toRDFXML, 
  toTurtle, 
  toMicrodata,
  createExportPackage,
  generateImplementationInstructions,
  generatePlatformGuides,
} from './utils/export-formats';
import type { SchemaMarkup } from './types';

/**
 * Sample schema markup for testing
 */
const sampleSchemas: SchemaMarkup[] = [
  {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    '@id': '#agent1',
    name: 'John Doe',
    description: 'Experienced real estate agent specializing in residential properties',
    email: 'john.doe@example.com',
    telephone: '+1-555-0123',
    url: 'https://johndoe.realtor',
    knowsAbout: ['Residential Real Estate', 'First-Time Buyers', 'Investment Properties'],
    areaServed: [
      {
        '@type': 'Place',
        name: 'San Francisco, CA',
        geo: {
          '@type': 'GeoCoordinates',
          latitude: 37.7749,
          longitude: -122.4194,
        },
      },
    ],
    address: {
      '@type': 'PostalAddress',
      streetAddress: '123 Main Street',
      addressLocality: 'San Francisco',
      addressRegion: 'CA',
      postalCode: '94102',
      addressCountry: 'US',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: 4.8,
      reviewCount: 25,
      bestRating: 5,
      worstRating: 1,
    },
  },
];

/**
 * Validates export functionality
 */
export function validateExportFunctionality(): {
  success: boolean;
  results: Record<string, any>;
  errors: string[];
} {
  const results: Record<string, any> = {};
  const errors: string[] = [];

  try {
    console.log('🔍 Validating AI Visibility Export Functionality...\n');

    // Test 1: JSON-LD Export
    console.log('1. Testing JSON-LD export...');
    const jsonLD = toJSONLD(sampleSchemas);
    const parsedJSON = JSON.parse(jsonLD);
    
    if (parsedJSON['@type'] === 'RealEstateAgent') {
      console.log('   ✅ JSON-LD export successful');
      results.jsonLD = { success: true, size: jsonLD.length };
    } else {
      errors.push('JSON-LD export failed - incorrect schema type');
    }

    // Test 2: RDF/XML Export
    console.log('2. Testing RDF/XML export...');
    const rdfXML = toRDFXML(sampleSchemas);
    
    if (rdfXML.includes('<?xml version="1.0"') && rdfXML.includes('<rdf:RDF')) {
      console.log('   ✅ RDF/XML export successful');
      results.rdfXML = { success: true, size: rdfXML.length };
    } else {
      errors.push('RDF/XML export failed - missing XML declaration or RDF root');
    }

    // Test 3: Turtle Export
    console.log('3. Testing Turtle export...');
    const turtle = toTurtle(sampleSchemas);
    
    if (turtle.includes('@prefix') && turtle.includes('schema:RealEstateAgent')) {
      console.log('   ✅ Turtle export successful');
      results.turtle = { success: true, size: turtle.length };
    } else {
      errors.push('Turtle export failed - missing prefixes or schema type');
    }

    // Test 4: Microdata Export
    console.log('4. Testing Microdata export...');
    const microdata = toMicrodata(sampleSchemas);
    
    if (microdata.includes('itemscope') && microdata.includes('itemtype="https://schema.org/RealEstateAgent"')) {
      console.log('   ✅ Microdata export successful');
      results.microdata = { success: true, size: microdata.length };
    } else {
      errors.push('Microdata export failed - missing itemscope or itemtype');
    }

    // Test 5: Complete Export Package
    console.log('5. Testing complete export package...');
    const exportPackage = createExportPackage(sampleSchemas, ['json-ld', 'rdf-xml', 'turtle', 'microdata']);
    
    if (exportPackage.jsonLD && exportPackage.rdfXML && exportPackage.turtle && exportPackage.microdata) {
      console.log('   ✅ Complete export package successful');
      results.exportPackage = { 
        success: true, 
        formats: 4,
        totalSize: Object.values(exportPackage).reduce((sum, content) => 
          sum + (typeof content === 'string' ? content.length : 0), 0
        ),
      };
    } else {
      errors.push('Export package failed - missing formats');
    }

    // Test 6: Implementation Instructions
    console.log('6. Testing implementation instructions...');
    const instructions = generateImplementationInstructions(['json-ld', 'microdata']);
    
    if (instructions.includes('JSON-LD Implementation') && instructions.includes('Microdata Implementation')) {
      console.log('   ✅ Implementation instructions successful');
      results.instructions = { success: true, size: instructions.length };
    } else {
      errors.push('Implementation instructions failed - missing format sections');
    }

    // Test 7: Platform Guides
    console.log('7. Testing platform guides...');
    const platformGuides = generatePlatformGuides();
    
    if (platformGuides.wordpress && platformGuides.squarespace && platformGuides.shopify) {
      console.log('   ✅ Platform guides successful');
      results.platformGuides = { 
        success: true, 
        platforms: Object.keys(platformGuides).length,
      };
    } else {
      errors.push('Platform guides failed - missing platform guides');
    }

    // Summary
    console.log('\n📊 Validation Summary:');
    console.log(`   ✅ Successful tests: ${Object.keys(results).length}`);
    console.log(`   ❌ Failed tests: ${errors.length}`);
    
    if (errors.length === 0) {
      console.log('\n🎉 All export functionality tests passed!');
    } else {
      console.log('\n⚠️  Some tests failed:');
      errors.forEach(error => console.log(`   - ${error}`));
    }

    return {
      success: errors.length === 0,
      results,
      errors,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Validation failed with error: ${errorMessage}`);
    
    return {
      success: false,
      results,
      errors,
    };
  }
}

// Run validation if this file is executed directly
if (require.main === module) {
  validateExportFunctionality();
}