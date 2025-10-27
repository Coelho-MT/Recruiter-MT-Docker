import express from 'express';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import dns from 'dns';
import { OpenAIService } from './services/openai.js';
import { 
  validateJobDescription, 
  validateInterviewKit,
  RateLimiter,
  errorHandler 
} from './middleware/validation.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5173;
const WEB_DIR = path.resolve(process.env.WEB_DIR || path.join(__dirname, '..', 'public'));
const MODEL = process.env.MODEL || 'gpt-4o-mini'; // Changed to gpt-4o-mini
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

// Force reliable DNS inside container to avoid EAI_AGAIN (WSL/Docker DNS issues)
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
  console.log('DNS servers set to 8.8.8.8 and 8.8.4.4');
} catch (e) {
  console.warn('Could not set DNS servers:', e?.message || e);
}

// Note: we rely on Node's built-in fetch (Undici) and forced DNS servers above

const app = express();
app.use(morgan('dev'));
app.use(express.json({ limit: '2mb' }));

// Initialize services
let openAIService;
try {
  openAIService = new OpenAIService(OPENAI_API_KEY, MODEL);
} catch (error) {
  console.error('Failed to initialize OpenAI service:', error.message);
}

// Initialize rate limiter (10 requests per minute)
const rateLimiter = new RateLimiter(10, 60000);
setInterval(() => rateLimiter.cleanup(), 300000); // Cleanup every 5 minutes

// Apply rate limiting to API routes
app.use('/api', rateLimiter.middleware());

function injectScriptIntoHtml(html) {
  const injection = `\n<!-- injected by server: app bundle -->\n<script type="module" src="/app/main.js"></script>\n`;
  if (html.includes('</body>')) return html.replace('</body>', `${injection}</body>`);
  return html + injection;
}

// Serve HTML with script injection
app.get(['/*.html', '/'], (req, res, next) => {
  const filePath = req.path === '/' ? '/index.html' : req.path;
  const abs = path.join(WEB_DIR, filePath);
  fs.readFile(abs, 'utf8', (err, data) => {
    if (err) return next();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(injectScriptIntoHtml(data));
  });
});

// Serve static files
app.use(express.static(WEB_DIR, { fallthrough: true }));
app.use('/app', express.static(path.join(__dirname, '..', 'src')));

// API: Generate job description
app.post('/api/generate-job-description', validateJobDescription, async (req, res, next) => {
  try {
    if (!openAIService) {
      throw new Error('OpenAI service is not configured. Please add your API key to the .env file.');
    }
    const html = await openAIService.generateJobDescription(req.body);
    res.json({ ok: true, html });
  } catch (e) {
    next(e);
  }
});

// API: Generate interview kit
app.post('/api/generate-interview-kit-answers', validateInterviewKit, async (req, res, next) => {
  try {
    if (!openAIService) {
      throw new Error('OpenAI service is not configured. Please add your API key to the .env file.');
    }
    const kit = await openAIService.generateInterviewKit(req.body);
    console.log('Generated kit:', JSON.stringify(kit, null, 2)); // Added for debugging
    res.json({ kit });
  } catch (error) {
    next(error);
  }
});

// Error handling middleware (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Recruiter_MT server running on http://localhost:${PORT}`);
  console.log(`Serving web dir: ${WEB_DIR}`);
  if (!openAIService) {
    console.warn('⚠️  Warning: OpenAI service not configured. Set OPENAI_API_KEY in .env file.');
  } else {
    console.log('✓ OpenAI service initialized');
  }
});