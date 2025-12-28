#!/usr/bin/env node

/**
 * UI Components Export Validation Script
 * 
 * This script validates that all UI components are properly exported
 * in the barrel export file and identifies any missing exports.
 */

const fs = require('fs');
const path = require('path');

const UI_DIR = path.join(__dirname, '../src/components/ui');
const INDEX_FILE = path.join(UI_DIR, 'index.ts');

// Components that should be excluded from validation
const EXCLUDED_FILES = [
  'index.ts',
  'neumorphism.css',
  // Example files that shouldn't be exported
  'confirmation-modal-example.tsx',
  'contextual-tooltip-examples.tsx',
  'icon-animations-demo.tsx',
];

// File extensions to include
const INCLUDED_EXTENSIONS = ['.tsx', '.ts'];

function getUIComponentFiles() {
  try {
    const files = fs.readdirSync(UI_DIR);
    return files
      .filter(file => {
        // Include only TypeScript/React files
        const hasValidExtension = INCLUDED_EXTENSIONS.some(ext => file.endsWith(ext));
        // Exclude specific files
        const isNotExcluded = !EXCLUDED_FILES.includes(file);
        return hasValidExtension && isNotExcluded;
      })
      .map(file => file.replace(/\.(tsx?|ts)$/, ''))
      .sort();
  } catch (error) {
    console.error('Error reading UI components directory:', error);
    return [];
  }
}

function getExportedComponents() {
  try {
    const indexContent = fs.readFileSync(INDEX_FILE, 'utf8');
    const exportMatches = indexContent.match(/export.*from\s+['"]\.\/([\w-]+)['"]/g) || [];
    
    return exportMatches
      .map(match => {
        const componentMatch = match.match(/from\s+['"]\.\/([\w-]+)['"]/);
        return componentMatch ? componentMatch[1] : null;
      })
      .filter(Boolean)
      .sort();
  } catch (error) {
    console.error('Error reading index.ts file:', error);
    return [];
  }
}

function validateExports() {
  console.log('🔍 Validating UI component exports...\n');
  
  const componentFiles = getUIComponentFiles();
  const exportedComponents = getExportedComponents();
  
  console.log(`📁 Found ${componentFiles.length} component files`);
  console.log(`📤 Found ${exportedComponents.length} exported components\n`);
  
  // Find missing exports
  const missingExports = componentFiles.filter(file => !exportedComponents.includes(file));
  
  // Find extra exports (exports that don't have corresponding files)
  const extraExports = exportedComponents.filter(component => !componentFiles.includes(component));
  
  // Report results
  if (missingExports.length === 0 && extraExports.length === 0) {
    console.log('✅ All UI components are properly exported!');
    return true;
  }
  
  let hasErrors = false;
  
  if (missingExports.length > 0) {
    console.log('❌ Missing exports:');
    missingExports.forEach(file => {
      console.log(`   - ${file}`);
    });
    console.log(`\n   Add these to ${INDEX_FILE}:`);
    missingExports.forEach(file => {
      console.log(`   export * from './${file}';`);
    });
    console.log();
    hasErrors = true;
  }
  
  if (extraExports.length > 0) {
    console.log('⚠️  Extra exports (no corresponding files):');
    extraExports.forEach(component => {
      console.log(`   - ${component}`);
    });
    console.log(`\n   Remove these from ${INDEX_FILE} or create the missing files.\n`);
    hasErrors = true;
  }
  
  return !hasErrors;
}

function generateMissingExports() {
  const componentFiles = getUIComponentFiles();
  const exportedComponents = getExportedComponents();
  const missingExports = componentFiles.filter(file => !exportedComponents.includes(file));
  
  if (missingExports.length > 0) {
    console.log('\n📝 Generated export statements for missing components:');
    console.log('// Add these to your index.ts file:\n');
    
    missingExports.forEach(file => {
      console.log(`export * from './${file}';`);
    });
  }
}

function main() {
  const isValid = validateExports();
  
  if (!isValid) {
    generateMissingExports();
    process.exit(1);
  }
  
  console.log('\n🎉 UI component exports validation passed!');
}

// Run the validation
if (require.main === module) {
  main();
}

module.exports = {
  validateExports,
  getUIComponentFiles,
  getExportedComponents
};