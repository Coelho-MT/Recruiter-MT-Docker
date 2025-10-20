import express from 'express';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5173;
const WEB_DIR = path.resolve(process.env.WEB_DIR || path.join(__dirname, '..', 'web'));
const MODEL = process.env.MODEL || 'gpt-4-0125-preview';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

const app = express();
app.use(morgan('dev'));
app.use(express.json({ limit: '2mb' }));

function injectScriptIntoHtml(html) {
  const injection = `\n<!-- injected by server: app bundle -->\n<script type="module" src="/app/main.js"></script>\n`;
  if (html.includes('</body>')) return html.replace('</body>', `${injection}</body>`);
  return html + injection;
}

// Serve HTML with injection
app.get(['/*.html','/'], (req, res, next) => {
  let filePath = req.path === '/' ? '/index.html' : req.path;
  const abs = path.join(WEB_DIR, filePath);
  fs.readFile(abs, 'utf8', (err, data) => {
    if (err) return next();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(injectScriptIntoHtml(data));
  });
});

// Other static
app.use(express.static(WEB_DIR, { fallthrough: true }));
// Serve /src as /app
app.use('/app', express.static(path.join(__dirname, '..', 'src')));

async function callOpenAI(system, user, expectJson = false) {
  if (!OPENAI_API_KEY) {
    console.error('OpenAI API key is missing');
    throw new Error('OpenAI API key is not configured. Please add your API key to the .env file.');
  }
  console.log('Calling OpenAI API with model:', MODEL);
  
  try {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
        temperature: 0.7
      })
    });
    
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
    
    const parsed = tryParseJson(content);
    return { text: content, json: parsed };
  } catch (error) {
    console.error('Failed to call OpenAI API:', error);
    throw error;
  }
}

function tryParseJson(s) {
  try { return JSON.parse(s); }
  catch {
    const m = s.match(/\{[\s\S]*\}/);
    if (m) { try { return JSON.parse(m[0]); } catch {} }
    return null;
  }
}

// ---- LLM: Job Description (HTML, no code fences) ----
app.post('/api/generate-job-description', async (req, res) => {
  try {
    const {
      title, seniority, team, location, remotePolicy,
      mustHaveSkills = [], niceToHaveSkills = [],
      responsibilities = [], requirements = [], benefits = []
    } = req.body || {};

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
- Title: ${title}
- Seniority: ${seniority}
- Team: ${team}
- Location: ${location} (${remotePolicy})

Skills Required:
- Must-have: ${mustHaveSkills.join(', ') || 'n/a'}
- Nice-to-have: ${niceToHaveSkills.join(', ') || 'n/a'}

Additional Information:
- Key Responsibilities: ${responsibilities.join('; ') || 'n/a'}
- Requirements: ${requirements.join('; ') || 'n/a'}
- Benefits: ${benefits.join('; ') || 'n/a'}

Format the response as a modern, well-spaced job posting with:
1. A clear header section with job title, location, and team
2. An "About the Role" section with an engaging overview paragraph
3. A "Responsibilities" section with well-formatted bullet points
4. A "Requirements" section with separate Must-have and Nice-to-have subsections
5. A "Benefits" section with attractive bullet points
6. End with MicroTech's equal opportunity statement and privacy notice

Use proper HTML tags with spacing classes as specified in the system message.
Make the layout clean and professional with consistent spacing between sections.`;

    const out = await callOpenAI(system, user, false);
    res.json({ ok: true, html: out.text });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

// ---- LLM: Interview Kit with model answers ----
// Technical interview generation
function getTechnicalFocus(role) {
  const r = role.toLowerCase();
  if (r.includes('ml') || r.includes('machine learning')) {
    return 'Focus on machine learning algorithms, model optimization, and data processing pipelines.';
  } else if (r.includes('frontend') || r.includes('ui')) {
    return 'Focus on JavaScript frameworks, responsive design, and modern web technologies.';
  } else if (r.includes('backend')) {
    return 'Focus on API design, database optimization, and system architecture.';
  } else if (r.includes('devops')) {
    return 'Focus on CI/CD, containerization, and cloud infrastructure.';
  } else if (r.includes('data')) {
    return 'Focus on data structures, algorithms, and database technologies.';
  }
  return 'Focus on core programming concepts and system design.';
}

app.post('/api/generate-interview-kit-answers', async (req, res) => {
  try {
    const { roleTitle, seniority } = req.body;
    
    const technicalFocus = getTechnicalFocus(roleTitle);
    const seniorityExpectations = seniority?.toLowerCase().includes('senior') ? 
      'Include advanced system design and architecture questions.' : 
      'Focus on practical implementation and problem-solving questions.';

    const prompt = `As an expert technical interviewer, generate specific interview questions for a ${roleTitle} position.
    
    Generate exactly 3 questions for each category, ensuring they are highly specific to the ${roleTitle} role:

    Technical Questions:
    - ${technicalFocus}
    - ${seniorityExpectations}
    - Must directly test ${roleTitle}-specific skills

    Behavioral Questions:
    - Real situations a ${roleTitle} faces daily
    - Team collaboration scenarios
    - Project challenges specific to ${roleTitle} work

    Scenario Questions:
    - Technical challenges specific to ${roleTitle} work
    - System design/debugging scenarios
    - Architecture decisions a ${roleTitle} makes

    Format as JSON:
    {
      "technical": [{"q": "question", "a": "detailed answer"}],
      "behavioral": [{"q": "question", "a": "detailed answer"}],
      "scenario": [{"q": "question", "a": "detailed answer"}]
    }`;

    const { json } = await callOpenAI(prompt, '', true);
    res.json({ kit: json });
  } catch (error) {
    console.error('Failed to generate interview kit:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Recruiter_MT server running on http://localhost:${PORT}`);
  console.log(`Serving web dir: ${WEB_DIR}`);
});