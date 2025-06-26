#!/usr/bin/env node

/**
 * Create a clean, minimal Word template from scratch
 * This will generate a fresh .docx file with clean placeholder structure
 */

import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔨 Creating a clean Word template from scratch...');

// Create a minimal Word document structure
const createMinimalDocx = () => {
  // Basic Word document XML structure
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r><w:t>ENGINEERING REPORT</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>File Number: {{file_number}}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Date: {{date_of_creation}}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Insured: {{insured_name}}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Property Address: {{insured_address}}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Date of Loss: {{date_of_loss}}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Claim Number: {{claim_number}}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Client Company: {{client_company}}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Engineer: {{engineer_name}}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Technical Reviewer: {{technical_reviewer}}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Date Received: {{received_date}}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Site Visit Date: {{site_visit_date}}</w:t></w:r>
    </w:p>
    
    <w:p>
      <w:r><w:t>ASSIGNMENT SCOPE</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Interviewees: {{interviewees_names}}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Documents Reviewed: {{provided_documents_titles}}</w:t></w:r>
    </w:p>
    
    <w:p>
      <w:r><w:t>BUILDING & SITE OBSERVATIONS</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Structure Built Date: {{structure_built_date}}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Structure Age: {{structure_age}}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Building System Description: {{building_system_description}}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Front Facing Direction: {{front_facing_direction}}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Exterior Observations: {{exterior_observations}}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Interior Observations: {{interior_observations}}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Other Site Observations: {{other_site_observations}}</w:t></w:r>
    </w:p>
    
    <w:p>
      <w:r><w:t>RESEARCH</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Weather Data Summary: {{weather_data_summary}}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>CoreLogic Hail Summary: {{corelogic_hail_summary}}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>CoreLogic Wind Summary: {{corelogic_wind_summary}}</w:t></w:r>
    </w:p>
    
    <w:p>
      <w:r><w:t>DISCUSSION & ANALYSIS</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Site Discussion Analysis: {{site_discussion_analysis}}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Weather Discussion Analysis: {{weather_discussion_analysis}}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Weather Impact Analysis: {{weather_impact_analysis}}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>Recommendations and Discussion: {{recommendations_and_discussion}}</w:t></w:r>
    </w:p>
    
    <w:p>
      <w:r><w:t>CONCLUSIONS</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>{{conclusions}}</w:t></w:r>
    </w:p>
    
    <w:p>
      <w:r><w:t>Current Date: {{current_date}}</w:t></w:r>
    </w:p>
  </w:body>
</w:document>`;

  // Content Types
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  // App properties
  const appProps = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Clean Template Generator</Application>
</Properties>`;

  // Main relationships
  const mainRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;

  // Word relationships (empty)
  const wordRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`;

  // Core properties
  const coreProps = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>Engineering Report Template</dc:title>
  <dc:creator>Template Generator</dc:creator>
  <dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:modified>
</cp:coreProperties>`;

  // Create ZIP structure
  const zip = new PizZip();
  
  // Add files to ZIP
  zip.file('[Content_Types].xml', contentTypes);
  zip.file('_rels/.rels', mainRels);
  zip.file('word/document.xml', documentXml);
  zip.file('word/_rels/document.xml.rels', wordRels);
  zip.file('docProps/app.xml', appProps);
  zip.file('docProps/core.xml', coreProps);
  
  return zip;
};

try {
  // Create the clean template
  const zip = createMinimalDocx();
  
  // Generate the DOCX file
  const buffer = Buffer.from(zip.generate({ type: 'nodebuffer' }));
  
  // Save to templates directory
  const outputPath = path.join(__dirname, '../templates/MJSolutionsTemplate_clean.docx');
  fs.writeFileSync(outputPath, buffer);
  
  console.log(`✅ Clean template created: ${outputPath}`);
  console.log(`📏 Size: ${buffer.length} bytes`);
  
  // Test the template with Docxtemplater
  console.log('🧪 Testing template with docxtemplater...');
  
  const testZip = new PizZip(buffer);
  const doc = new Docxtemplater(testZip, {
    paragraphLoop: true,
    linebreaks: true
  });
  
  // Test with sample data
  const testData = {
    file_number: 'TEST-001',
    date_of_creation: new Date().toLocaleDateString(),
    insured_name: 'Test User',
    insured_address: '123 Test Street',
    date_of_loss: '2024-01-01',
    claim_number: 'CLAIM-123',
    client_company: 'Test Insurance Co.',
    engineer_name: 'Test Engineer',
    technical_reviewer: 'Test Reviewer',
    received_date: '2024-01-01',
    site_visit_date: '2024-01-02',
    interviewees_names: 'Test Interview',
    provided_documents_titles: 'Test Documents',
    structure_built_date: '2000',
    structure_age: '24 years',
    building_system_description: 'Test building description',
    front_facing_direction: 'North',
    exterior_observations: 'Test exterior observations',
    interior_observations: 'Test interior observations',
    other_site_observations: 'Test site observations',
    weather_data_summary: 'Test weather data',
    corelogic_hail_summary: 'Test hail summary',
    corelogic_wind_summary: 'Test wind summary',
    site_discussion_analysis: 'Test site analysis',
    weather_discussion_analysis: 'Test weather analysis',
    weather_impact_analysis: 'Test impact analysis',
    recommendations_and_discussion: 'Test recommendations',
    conclusions: 'Test conclusions',
    current_date: new Date().toLocaleDateString()
  };
  
  doc.setData(testData);
  doc.render();
  
  // Generate test output
  const testOutput = Buffer.from(doc.getZip().generate({ type: 'nodebuffer' }));
  
  console.log('✅ Template test successful!');
  console.log(`📊 Test output size: ${testOutput.length} bytes`);
  console.log('🎉 Clean template is ready to use!');
  
} catch (error) {
  console.error('❌ Error creating clean template:', error.message);
  console.error(error.stack);
}