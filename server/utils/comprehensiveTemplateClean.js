#!/usr/bin/env node

/**
 * Comprehensive Word template cleaner to fix ALL split placeholders
 * This approach searches for any {{ pattern and rebuilds clean placeholders
 */

import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templatePath = path.join(__dirname, '../templates/MJSolutionsTemplate_to_clean.docx');
const outputPath = path.join(__dirname, '../templates/MJSolutionsTemplate_cleaned_new.docx');

console.log('🔧 Comprehensive template cleaning...');

try {
  // Read template
  const content = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(content);
  
  // Get document.xml
  const documentXml = zip.file('word/document.xml').asText();
  
  console.log('📄 Original document length:', documentXml.length);
  
  // Strategy: Find all {{ patterns and extract the complete variable names
  // Then replace the entire complex patterns with clean {{variable_name}}
  
  const placeholderMap = {
    'file_number': '{{file_number}}',
    'date_of_creation': '{{date_of_creation}}', 
    'insured_name': '{{insured_name}}',
    'insured_address': '{{insured_address}}',
    'date_of_loss': '{{date_of_loss}}',
    'claim_number': '{{claim_number}}',
    'client_company': '{{client_company}}',
    'engineer_name': '{{engineer_name}}',
    'technical_reviewer': '{{technical_reviewer}}',
    'received_date': '{{received_date}}',
    'site_visit_date': '{{site_visit_date}}',
    'interviewees_names': '{{interviewees_names}}',
    'provided_documents_titles': '{{provided_documents_titles}}',
    'structure_built_date': '{{structure_built_date}}',
    'structure_age': '{{structure_age}}',
    'building_system_description': '{{building_system_description}}',
    'front_facing_direction': '{{front_facing_direction}}',
    'exterior_observations': '{{exterior_observations}}',
    'interior_observations': '{{interior_observations}}',
    'other_site_observations': '{{other_site_observations}}',
    'weather_data_summary': '{{weather_data_summary}}',
    'corelogic_hail_summary': '{{corelogic_hail_summary}}',
    'corelogic_wind_summary': '{{corelogic_wind_summary}}',
    'site_discussion_analysis': '{{site_discussion_analysis}}',
    'weather_discussion_analysis': '{{weather_discussion_analysis}}',
    'weather_impact_analysis': '{{weather_impact_analysis}}',
    'recommendations_and_discussion': '{{recommendations_and_discussion}}',
    'conclusions': '{{conclusions}}'
  };
  
  let cleanedXml = documentXml;
  let totalReplacements = 0;
  
  // For each placeholder we expect, find and replace all broken instances
  Object.entries(placeholderMap).forEach(([varName, cleanPlaceholder]) => {
    console.log(`🔍 Cleaning ${varName}...`);
    
    // Create a very flexible regex that finds any split version of this variable
    // Match {{ followed by any XML, then the variable name split across runs, then }}
    const parts = varName.split('_');
    let pattern;
    
    if (parts.length > 1) {
      // Multi-part variable like file_number or insured_name
      const firstPart = parts[0];
      const lastPart = parts[parts.length - 1];
      
      // Match {{ + XML + first part + XML + underscore + XML + last part + XML + }}
      pattern = new RegExp(
        `\\{\\{[^}]*?${firstPart}[^}]*?_[^}]*?${lastPart}[^}]*?\\}\\}`, 
        'g'
      );
    } else {
      // Single word variable like conclusions
      pattern = new RegExp(
        `\\{\\{[^}]*?${varName}[^}]*?\\}\\}`,
        'g'
      );
    }
    
    const matches = cleanedXml.match(pattern) || [];
    if (matches.length > 0) {
      console.log(`  📝 Found ${matches.length} broken instances`);
      cleanedXml = cleanedXml.replace(pattern, cleanPlaceholder);
      totalReplacements += matches.length;
    }
  });
  
  // Additional cleanup for any remaining {{ patterns that contain XML tags
  const remainingBrokenPatterns = cleanedXml.match(/\{\{[^}]*<\/w:[^}]*\}\}/g) || [];
  console.log(`⚠️  Found ${remainingBrokenPatterns.length} remaining complex patterns`);
  
  if (remainingBrokenPatterns.length > 0) {
    console.log('🔧 Manual cleanup of remaining patterns...');
    
    // Generic cleanup for any {{ pattern that contains XML tags
    cleanedXml = cleanedXml.replace(/\{\{([^}]*)<\/w:[^}]*\}\}/g, (match) => {
      console.log(`🔧 Cleaning generic pattern: ${match.substring(0, 100)}...`);
      return '{{PLACEHOLDER_TO_FIX}}'; // Mark for manual review
    });
  }
  
  console.log(`✅ Total replacements made: ${totalReplacements}`);
  console.log('📄 Cleaned document length:', cleanedXml.length);
  
  // Save cleaned document
  zip.file('word/document.xml', cleanedXml);
  const outputBuffer = zip.generate({ type: 'nodebuffer' });
  fs.writeFileSync(outputPath, outputBuffer);
  
  console.log(`✅ Comprehensive cleaning complete!`);
  console.log(`📁 Saved to: ${outputPath}`);
  console.log('');
  console.log('📋 Next steps:');
  console.log('1. Verify the cleaned template in Word');
  console.log('2. Replace original template if satisfied');
  console.log('3. Test document generation');
  
} catch (error) {
  console.error('❌ Error during comprehensive cleaning:', error.message);
}