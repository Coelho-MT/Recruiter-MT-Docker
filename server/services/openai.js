/**
 * OpenAI Service - Handles all AI generation requests
 */

export class OpenAIService {
  constructor(apiKey, model = 'gpt-4o-mini') { // Changed default model
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }
    this.apiKey = apiKey;
    this.model = model;
    this.baseURL = 'https://api.openai.com/v1/chat/completions';
  }

  /**
   * Main API call method with error handling
   */
  async callAPI(system, user, expectJson = false) {
    console.log('Calling OpenAI API with model:', this.model);
    
    const maxAttempts = 3;
    let attempt = 0;
    let lastError;
    while (attempt < maxAttempts) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000); // Increased timeout
        const resp = await fetch(this.baseURL, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${this.apiKey}`, 
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify({
            model: this.model,
            messages: [
              { role: 'system', content: system }, 
              { role: 'user', content: user }
            ],
            temperature: 0.7
          }),
          signal: controller.signal
        });
        clearTimeout(timeout);
        
        if (!resp.ok) {
          const errorText = await resp.text();
          console.error('OpenAI API error:', errorText);
          throw new Error(`OpenAI error ${resp.status}: ${errorText}`);
        }
        
        const data = await resp.json();
        const content = data.choices?.[0]?.message?.content || '';
        
        if (!expectJson) {
          return { text: content, json: null };
        }
        
        const parsed = this.tryParseJson(content);
        return { text: content, json: parsed };
      } catch (error) {
        lastError = error;
        const isDns = /EAI_AGAIN|ENOTFOUND|dns/i.test(error?.message || '');
        const isAbort = error?.name === 'AbortError';
        attempt++;
        console.warn(`OpenAI call failed (attempt ${attempt}/${maxAttempts})`, error?.message || error);
        if (attempt >= maxAttempts || (!isDns && !isAbort)) {
          console.error('Failed to call OpenAI API:', error);
          throw error;
        }
        await new Promise(r => setTimeout(r, 1000 * attempt));
      }
    }
    throw lastError || new Error('OpenAI call failed');
  }

  /**
   * Generate job description
   */
  async generateJobDescription(payload) {
    const system = `You are an expert recruiter. Return clean HTML for a professionally formatted job posting with clear section hierarchy and spacing.

Format guidelines:
- Use <h2> tags with class="text-xl font-bold text-gray-900 mt-8 mb-4" for main sections
- Use <ul> tags with class="list-disc pl-6 space-y-2 mb-6" for bullet points
- Add margin bottom (class="mb-6") after each section
- Each section should have a bold title and well-spaced content
- Use proper paragraph spacing for readability

Required sections in order:
1. Title and Location (at top)
2. About the Role (overview paragraph)
3. Responsibilities (bulleted list)
4. Requirements
  - Must-have (bulleted list)
  - Nice-to-have (bulleted list)
5. Benefits (bulleted list)
6. Equal Opportunity & Legal (at bottom)

Make it aesthetically pleasing with consistent spacing and formatting.`;

    const user = `Create a well-formatted job posting with these details:

Job Details:
- Title: ${payload.title}
- Seniority: ${payload.seniority}
- Team: ${payload.team}
- Location: ${payload.location} (${payload.remotePolicy})

Skills Required:
- Must-have: ${payload.mustHaveSkills?.join(', ') || 'n/a'}
- Nice-to-have: ${payload.niceToHaveSkills?.join(', ') || 'n/a'}

Additional Information:
- Key Responsibilities: ${payload.responsibilities?.join('; ') || 'n/a'}
- Requirements: ${payload.requirements?.join('; ') || 'n/a'}
- Benefits: ${payload.benefits?.join('; ') || 'n/a'}

Format the response as a modern, well-spaced job posting with:
1. A clear header section with job title, location, and team
2. An "About the Role" section with an engaging overview paragraph
3. A "Responsibilities" section with well-formatted bullet points
4. A "Requirements" section with separate Must-have and Nice-to-have subsections
5. A "Benefits" section with attractive bullet points
6. End with MicroTech's equal opportunity statement and privacy notice

Use proper HTML tags with spacing classes as specified in the system message.
Make the layout clean and professional with consistent spacing between sections.`;

    const result = await this.callAPI(system, user, false);
    return result.text;
  }

  /**
   * Generate interview kit with answers
   */
  async generateInterviewKit(payload) {
    const technicalFocus = this.getTechnicalFocus(payload.roleTitle);
    const seniorityExpectations = payload.seniority?.toLowerCase().includes('senior') ? 
      'Include advanced system design and architecture questions.' : 
      'Focus on practical implementation and problem-solving questions.';

    const prompt = `As an expert technical interviewer, generate specific interview questions for a ${payload.roleTitle} position.
    
    Generate exactly 3 questions for each category, ensuring they are highly specific to the ${payload.roleTitle} role:

    Technical Questions:
    - ${technicalFocus}
    - ${seniorityExpectations}
    - Must directly test ${payload.roleTitle}-specific skills

    Behavioral Questions:
    - Real situations a ${payload.roleTitle} faces daily
    - Team collaboration scenarios
    - Project challenges specific to ${payload.roleTitle} work

    Scenario Questions:
    - Technical challenges specific to ${payload.roleTitle} work
    - System design/debugging scenarios
    - Architecture decisions a ${payload.roleTitle} makes

    Format as JSON:
    {
      "technical": [{"q": "question", "a": "detailed answer"}],
      "behavioral": [{"q": "question", "a": "detailed answer"}],
      "scenario": [{"q": "question", "a": "detailed answer"}]
    }`;

    const result = await this.callAPI(prompt, '', true);
    return result.json;
  }

  /**
   * Determine technical focus based on role
   */
  getTechnicalFocus(role) {
    // Let AI determine the technical focus based on the role title
    return `Focus on technical skills and knowledge specific to ${role} role.`;
  }

  /**
   * Try to parse JSON from response
   */
  tryParseJson(s) {
    try { 
      return JSON.parse(s); 
    } catch {
      const m = s.match(/\{[\s\S]*\}/);
      if (m) { 
        try { 
          return JSON.parse(m[0]); 
        } catch {} 
      }
      return null;
    }
  }
}
