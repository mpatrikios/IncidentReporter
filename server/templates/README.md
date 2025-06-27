# Word Document Templates

This directory contains Word (.docx) templates for document generation using docxtemplater.

## How to Create Templates

1. **Create a Word document** with your desired layout, formatting, and structure
2. **Add placeholders** using curly braces: `{field_name}`
3. **Save as .docx** in this directory with a descriptive name
4. **Configure placeholders** in the template config to map form data

## Available Placeholders

Based on the current template configuration (`server/config/efi-report-template.json`), you can use these placeholders:

### Project Information
- `{file_number}` - File/case number
- `{insured_name}` - Insured person/company name
- `{insured_address}` - Insured address
- `{date_of_creation}` - Report creation date
- `{date_of_loss}` - Date of loss/incident
- `{claim_number}` - Insurance claim number
- `{client_company}` - Client company name
- `{client_contact}` - Client contact person
- `{client_address}` - Client address
- `{client_email}` - Client email
- `{engineer_name}` - Engineer name
- `{technical_reviewer}` - Technical reviewer name
- `{site_visit_date}` - Site visit date

### Assignment Scope
- `{interviewees_names}` - People interviewed
- `{provided_documents_titles}` - Documents reviewed

### Building Observations
- `{building_system_description}` - Building system description
- `{exterior_observations}` - Exterior observations
- `{interior_observations}` - Interior observations
- `{other_site_observations}` - Other site observations

### Research
- `{weather_data_summary}` - Weather data summary
- `{corelogic_hail_summary}` - CoreLogic hail summary
- `{corelogic_wind_summary}` - CoreLogic wind summary

### Discussion & Analysis
- `{site_discussion_analysis}` - Site analysis
- `{weather_discussion_analysis}` - Weather analysis
- `{weather_impact_analysis}` - Weather impact analysis
- `{recommendations_and_discussion}` - Recommendations

### Conclusions
- `{conclusions}` - Final conclusions

### Company Information
- `{company_name}` - Company name
- `{company_address}` - Company address
- `{company_file_prefix}` - Company file prefix

### Images (when includePhotosInline is true)
- `{photo_1}` - First image
- `{photo_1_caption}` - Caption for first image
- `{photo_1_description}` - Description for first image
- `{photo_2}`, `{photo_3}`, etc. - Additional images

## Example Template Structure

```
Engineering Report

File Number: {file_number}
Date: {date_of_creation}
Insured: {insured_name}
Address: {insured_address}

BUILDING DESCRIPTION
{building_system_description}

CONCLUSIONS
{conclusions}

Images:
{photo_1}
Caption: {photo_1_caption}
```

## Using Templates

Templates are automatically loaded based on the `templateId` parameter:
- `default.docx` - Default template (auto-generated if missing)
- `engineering-report.docx` - Custom engineering report template
- `inspection-report.docx` - Custom inspection report template

## API Usage

```javascript
// Generate document with specific template
POST /api/reports/generate-word
{
  "templateId": "engineering-report",
  "title": "My Report",
  "reportData": { ... },
  "images": [ ... ],
  "includePhotosInline": true,
  "aiEnhanceText": true
}

// List available templates
GET /api/reports/word-templates
```

## AI Text Enhancement

When `aiEnhanceText` is enabled, bullet points in form fields are automatically converted to professional paragraphs before being inserted into the template.

## Image Handling

When `includePhotosInline` is true, images are embedded directly in the document using placeholders like `{photo_1}`, `{photo_2}`, etc.