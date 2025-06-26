const fs = require('fs');
const path = require('path');

console.log('🚀 Creating minimal working template using simple approach...');

// Create a basic Word document programmatically
// This avoids all the XML corruption issues
const createBasicWordDoc = () => {
  // Minimal Word document structure
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  // Simple document with placeholders - no complex formatting
  const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>ENGINEERING REPORT</w:t></w:r></w:p>
    <w:p><w:r><w:t>File Number: {{file_number}}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Insured Name: {{insured_name}}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Claim Number: {{claim_number}}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Date of Creation: {{date_of_creation}}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Insured Address: {{insured_address}}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Date of Loss: {{date_of_loss}}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Client Company: {{client_company}}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Engineer Name: {{engineer_name}}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Technical Reviewer: {{technical_reviewer}}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Received Date: {{received_date}}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Site Visit Date: {{site_visit_date}}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Interviewees Names: {{interviewees_names}}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Provided Documents: {{provided_documents_titles}}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Structure Built Date: {{structure_built_date}}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Structure Age: {{structure_age}}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Building System Description: {{building_system_description}}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Front Facing Direction: {{front_facing_direction}}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Exterior Observations: {{exterior_observations}}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Interior Observations: {{interior_observations}}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Other Site Observations: {{other_site_observations}}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Weather Data Summary: {{weather_data_summary}}</w:t></w:r></w:p>
    <w:p><w:r><w:t>CoreLogic Hail Summary: {{corelogic_hail_summary}}</w:t></w:r></w:p>
    <w:p><w:r><w:t>CoreLogic Wind Summary: {{corelogic_wind_summary}}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Site Discussion Analysis: {{site_discussion_analysis}}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Weather Discussion Analysis: {{weather_discussion_analysis}}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Weather Impact Analysis: {{weather_impact_analysis}}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Recommendations and Discussion: {{recommendations_and_discussion}}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Conclusions: {{conclusions}}</w:t></w:r></w:p>
  </w:body>
</w:document>`;

  return {
    '[Content_Types].xml': contentTypes,
    '_rels/.rels': rels,
    'word/document.xml': document
  };
};

try {
  const JSZip = require('jszip');
  
  const zip = new JSZip();
  const files = createBasicWordDoc();
  
  // Add files to ZIP
  Object.entries(files).forEach(([path, content]) => {
    zip.file(path, content);
  });
  
  // Generate buffer
  zip.generateAsync({ type: 'nodebuffer' }).then(buffer => {
    const templatePath = path.join(__dirname, 'server/templates/MJSolutionsTemplate.docx');
    fs.writeFileSync(templatePath, buffer);
    console.log('✅ Working template created successfully!');
    console.log(`📁 Saved to: ${templatePath}`);
    console.log('📏 Template size:', buffer.length, 'bytes');
  }).catch(error => {
    console.error('❌ Error generating ZIP:', error);
  });
  
} catch (error) {
  console.error('❌ JSZip not available, trying alternative approach...');
  
  // Fallback: Use child_process to create via Python zipfile
  const { execSync } = require('child_process');
  
  const pythonScript = `
import zipfile
import os

# Create working directory
os.makedirs('temp_template', exist_ok=True)
os.makedirs('temp_template/_rels', exist_ok=True)
os.makedirs('temp_template/word', exist_ok=True)

# Write files
with open('temp_template/[Content_Types].xml', 'w') as f:
    f.write('''${files['[Content_Types].xml']}''')

with open('temp_template/_rels/.rels', 'w') as f:
    f.write('''${files['_rels/.rels']}''')

with open('temp_template/word/document.xml', 'w') as f:
    f.write('''${files['word/document.xml']}''')

# Create ZIP
with zipfile.ZipFile('server/templates/MJSolutionsTemplate.docx', 'w', zipfile.ZIP_DEFLATED) as zipf:
    zipf.write('temp_template/[Content_Types].xml', '[Content_Types].xml')
    zipf.write('temp_template/_rels/.rels', '_rels/.rels')
    zipf.write('temp_template/word/document.xml', 'word/document.xml')

# Cleanup
import shutil
shutil.rmtree('temp_template')

print("✅ Working template created with Python!")
`;

  try {
    execSync(`python3 -c "${pythonScript}"`, { stdio: 'inherit' });
  } catch (pythonError) {
    console.error('❌ Python approach failed:', pythonError.message);
    console.log('💡 Please install jszip: npm install jszip');
  }
}