#!/usr/bin/env node

/**
 * Final template cleaning pass to handle edge cases and remaining issues
 */

import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templatePath = path.join(__dirname, '../templates/MJSolutionsTemplate_cleaned_new.docx');
const outputPath = path.join(__dirname, '../templates/MJSolutionsTemplate_final_new.docx');

console.log('🎯 Final template cleaning pass...');

try {
  // Read template
  const content = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(content);
  
  // Get document.xml
  const documentXml = zip.file('word/document.xml').asText();
  
  let cleanedXml = documentXml;
  
  // 1. Fix the PLACEHOLDER_TO_FIX (likely "like_this" based on earlier output)
  cleanedXml = cleanedXml.replace(/\{\{PLACEHOLDER_TO_FIX\}\}/g, '{{current_date}}');
  console.log('✅ Fixed PLACEHOLDER_TO_FIX -> {{current_date}}');
  
  // 2. Fix placeholders that span across paragraph boundaries
  // These appear as }placeholder} instead of {{placeholder}}
  const spanningPatterns = [
    [/{file_number}}/g, '{{file_number}}'],
    [/{insured_name}}/g, '{{insured_name}}'],
    [/{insured_address}}/g, '{{insured_address}}'],
    [/{date_of_loss}}/g, '{{date_of_loss}}'],
    [/{claim_number}}/g, '{{claim_number}}'],
    [/{date_of_creation}}/g, '{{date_of_creation}}']
  ];
  
  spanningPatterns.forEach(([pattern, replacement]) => {
    const matches = cleanedXml.match(pattern) || [];
    if (matches.length > 0) {
      console.log(`✅ Fixed ${matches.length} spanning instances of ${replacement}`);
      cleanedXml = cleanedXml.replace(pattern, replacement);
    }
  });
  
  // 3. Clean up any orphaned { or } characters near placeholders
  cleanedXml = cleanedXml.replace(/}\s*\{\{/g, '{{');
  cleanedXml = cleanedXml.replace(/\}\}\s*{/g, '}}');
  
  // 4. Ensure we have all required placeholders for the service
  const requiredPlaceholders = [
    'file_number', 'date_of_creation', 'insured_name', 'insured_address', 
    'date_of_loss', 'claim_number', 'client_company', 'engineer_name',
    'technical_reviewer', 'received_date', 'site_visit_date',
    'interviewees_names', 'provided_documents_titles', 'structure_built_date',
    'structure_age', 'building_system_description', 'front_facing_direction',
    'exterior_observations', 'interior_observations', 'other_site_observations',
    'weather_data_summary', 'corelogic_hail_summary', 'corelogic_wind_summary',
    'site_discussion_analysis', 'weather_discussion_analysis', 
    'weather_impact_analysis', 'recommendations_and_discussion', 'conclusions'
  ];
  
  console.log('📋 Validating required placeholders...');
  const finalPlaceholders = cleanedXml.match(/\{\{([^}]+)\}\}/g) || [];
  const placeholderNames = finalPlaceholders.map(p => p.replace(/[{}]/g, ''));
  
  const missing = requiredPlaceholders.filter(req => !placeholderNames.includes(req));
  if (missing.length > 0) {
    console.log('⚠️  Missing required placeholders:', missing);
  } else {
    console.log('✅ All required placeholders present');
  }
  
  console.log(`✅ Final template has ${finalPlaceholders.length} clean placeholders`);
  
  // Save final cleaned document
  zip.file('word/document.xml', cleanedXml);
  const outputBuffer = zip.generate({ type: 'nodebuffer' });
  fs.writeFileSync(outputPath, outputBuffer);
  
  console.log(`✅ Final cleaning complete!`);
  console.log(`📁 Saved to: ${outputPath}`);
  
} catch (error) {
  console.error('❌ Error during final cleaning:', error.message);
}