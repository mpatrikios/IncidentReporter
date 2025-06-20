import OpenAI from 'openai';

interface AITextGenerationOptions {
  bulletPoints: string;
  fieldType: string;
  context?: string;
}

class AITextService {
  private openai: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey: apiKey,
      });
    } else {
      console.warn('OpenAI API key not found. AI text generation will be disabled.');
    }
  }

  public async generateParagraph(options: AITextGenerationOptions): Promise<string> {
    console.log('DEBUG AI: generateParagraph called with:', { fieldType: options.fieldType, hasOpenAI: !!this.openai });
    
    if (!this.openai) {
      console.log('DEBUG AI: OpenAI not configured - missing API key');
      throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.');
    }

    const { bulletPoints, fieldType, context } = options;

    if (!bulletPoints || bulletPoints.trim().length === 0) {
      throw new Error('Bullet points are required for text generation');
    }

    const prompt = this.buildPrompt(bulletPoints, fieldType, context);

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini', // Cost-effective model for text generation
        messages: [
          {
            role: 'system',
            content: 'You are a professional technical writer specializing in civil engineering and property inspection reports. Generate clear, professional, and technically accurate paragraphs based on bullet point notes.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.3, // Lower temperature for more consistent, professional output
      });

      const generatedText = completion.choices[0]?.message?.content;
      
      if (!generatedText) {
        throw new Error('No text generated from OpenAI API');
      }

      return generatedText.trim();
    } catch (error) {
      console.error('Error generating text with OpenAI:', error);
      throw new Error('Failed to generate paragraph. Please try again.');
    }
  }

  private buildPrompt(bulletPoints: string, fieldType: string, context?: string): string {
    const fieldPrompts: Record<string, string> = {
      // Assignment Scope
      'intervieweesNames': 'Convert these bullet points into a professional paragraph describing the individuals interviewed during the investigation:',
      'providedDocumentsTitles': 'Convert these bullet points into a professional paragraph describing the documents reviewed during the investigation:',
      'additionalMethodologyNotes': 'Convert these bullet points into a professional paragraph describing additional methodology and procedures used:',
      
      // Building & Site Observations  
      'buildingSystemDescription': 'Convert these bullet points into a comprehensive professional paragraph describing the building system, construction type, and materials:',
      'exteriorObservations': 'Convert these bullet points into a detailed professional paragraph describing exterior observations of the property:',
      'interiorObservations': 'Convert these bullet points into a detailed professional paragraph describing interior observations of the property:',
      'otherSiteObservations': 'Convert these bullet points into a professional paragraph describing additional site observations:',
      
      // Research
      'weatherDataSummary': 'Convert these bullet points into a professional paragraph summarizing weather data and storm events from NOAA records:',
      'corelogicHailSummary': 'Convert these bullet points into a professional paragraph summarizing CoreLogic hail verification data:',
      'corelogicWindSummary': 'Convert these bullet points into a professional paragraph summarizing CoreLogic wind verification data:',
      
      // Discussion & Analysis
      'siteDiscussionAnalysis': 'Convert these bullet points into a comprehensive professional paragraph providing technical analysis of site observations:',
      'weatherDiscussionAnalysis': 'Convert these bullet points into a professional paragraph analyzing weather conditions and their impact:',
      'weatherImpactAnalysis': 'Convert these bullet points into a professional paragraph analyzing weather impact patterns and damage:',
      'recommendationsAndDiscussion': 'Convert these bullet points into a professional paragraph providing recommendations and additional discussion:',
      
      // Conclusions
      'conclusions': 'Convert these bullet points into a professional paragraph stating final engineering conclusions and determinations:',
    };

    const fieldPrompt = fieldPrompts[fieldType] || 'Convert these bullet points into a professional paragraph:';
    
    let prompt = `${fieldPrompt}

Bullet Points:
${bulletPoints}

Requirements:
- Write in professional, technical language appropriate for an engineering report
- Use proper technical terminology
- Maintain logical flow and coherence
- Include all key information from the bullet points
- Format as complete sentences in paragraph form
- Do not include bullet points or numbered lists in the output`;

    if (context) {
      prompt += `\n\nAdditional context: ${context}`;
    }

    return prompt;
  }

  public isConfigured(): boolean {
    return this.openai !== null;
  }
}

export const aiTextService = new AITextService();