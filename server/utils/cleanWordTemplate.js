#!/usr/bin/env node

/**
 * Clean Word template placeholders to fix split tags
 * Usage: node cleanWordTemplate.js
 */

import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templatePath = path.join(__dirname, '../templates/MJSolutionsTemplate.docx');
const outputPath = path.join(__dirname, '../templates/MJSolutionsTemplate_cleaned.docx');

console.log('🧹 Cleaning Word template placeholders...');

try {
  // Read template
  const content = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(content);
  
  // Get document.xml
  const documentXml = zip.file('word/document.xml').asText();
  
  // Fix known broken placeholders
  const replacements = [
    // Fix split interviewees_names
    [/\{\{inter[^}]*ames\}\}/g, '{{interviewees_names}}'],
    // Fix split provided_documents_titles  
    [/\{\{prov[^}]*tles\}\}/g, '{{provided_documents_titles}}'],
    // Fix split client_company
    [/\{\{clie[^}]*pany\}\}/g, '{{client_company}}'],
    // Fix split structure_built_date
    [/\{\{stru[^}]*date\}\}/g, '{{structure_built_date}}'],
    // Fix split structure_age
    [/\{\{stru[^}]*_age\}\}/g, '{{structure_age}}'],
    // Fix split building_system_description
    [/\{\{buil[^}]*tion\}\}/g, '{{building_system_description}}'],
    // Fix split front_facing_direction
    [/\{\{fron[^}]*tion\}\}/g, '{{front_facing_direction}}'],
    // Fix split exterior_observations
    [/\{\{exte[^}]*ions\}\}/g, '{{exterior_observations}}'],
    // Fix split interior_observations
    [/\{\{inte[^}]*ions\}\}/g, '{{interior_observations}}'],
    // Fix split other_site_observations
    [/\{\{othe[^}]*ions\}\}/g, '{{other_site_observations}}'],
    // Fix split weather_data_summary
    [/\{\{weat[^}]*mary\}\}/g, '{{weather_data_summary}}'],
    // Fix split corelogic_hail_summary
    [/\{\{core[^}]*hail[^}]*mary\}\}/g, '{{corelogic_hail_summary}}'],
    // Fix split corelogic_wind_summary
    [/\{\{core[^}]*wind[^}]*mary\}\}/g, '{{corelogic_wind_summary}}'],
    // Fix split site_discussion_analysis
    [/\{\{site[^}]*ysis\}\}/g, '{{site_discussion_analysis}}'],
    // Fix split weather_discussion_analysis
    [/\{\{weat[^}]*disc[^}]*ysis\}\}/g, '{{weather_discussion_analysis}}'],
    // Fix split weather_impact_analysis
    [/\{\{weat[^}]*impact[^}]*ysis\}\}/g, '{{weather_impact_analysis}}'],
    // Fix split recommendations_and_discussion
    [/\{\{reco[^}]*sion\}\}/g, '{{recommendations_and_discussion}}'],
    // Fix split conclusions
    [/\{\{conc[^}]*ions\}\}/g, '{{conclusions}}']
  ];
  
  let cleanedXml = documentXml;
  replacements.forEach(([pattern, replacement]) => {
    const before = (cleanedXml.match(pattern) || []).length;
    cleanedXml = cleanedXml.replace(pattern, replacement);
    const after = (cleanedXml.match(new RegExp(replacement.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    if (before > 0) {
      console.log(`✅ Fixed ${before} instances of broken ${replacement}`);
    }
  });
  
  // Save cleaned document
  zip.file('word/document.xml', cleanedXml);
  const outputBuffer = zip.generate({ type: 'nodebuffer' });
  fs.writeFileSync(outputPath, outputBuffer);
  
  console.log(`✅ Template cleaned and saved to: ${outputPath}`);
  console.log('📋 Next steps:');
  console.log('1. Open the cleaned template in Word');
  console.log('2. Review that all placeholders look correct');
  console.log('3. Rename it to replace the original template');
  
} catch (error) {
  console.error('❌ Error cleaning template:', error.message);
}