import { ErrorHandler } from './util/errorHandler.js';
import { validateJobDescription, validateInterviewKit } from './util/validators.js';

/**
 * Make POST request with JSON body
 */
export async function postJson(url, body) {
  console.log(`Making API request to ${url}`, body);
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body || {})
    });
    
    const text = await resp.text();
    console.log(`API response (${resp.status}):`, text);
    
    if (!resp.ok) {
      const error = new Error(`Request failed ${resp.status}: ${text}`);
      error.status = resp.status;
      throw error;
    }
    
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse JSON response:', e);
      throw new Error('Invalid JSON response from server');
    }
  } catch (e) {
    console.error('API request failed:', e);
    throw e;
  }
}

/**
 * Generate job description with validation
 */
export async function generateJD(payload) {
  console.log('Generating job description:', payload);
  
  // Client-side validation
  const validation = validateJobDescription(payload);
  if (!validation.isValid) {
    const error = new Error(validation.errors.join(', '));
    error.validationErrors = validation.errors;
    throw error;
  }
  
  try {
    const response = await ErrorHandler.retryOperation(
      () => postJson('/api/generate-job-description', payload),
      2,  // max 2 retries
      2000 // 2 second delay
    );
    console.log('Job description response:', response);
    return response.html || '';
  } catch (e) {
    console.error('Failed to generate job description:', e);
    throw new Error('Failed to generate job description: ' + e.message);
  }
}

/**
 * Generate interview kit with answers and validation
 */
export async function generateInterviewKitWithAnswers(payload) {
  console.log('Generating interview kit:', payload);
  
  // Client-side validation
  const validation = validateInterviewKit(payload);
  if (!validation.isValid) {
    const error = new Error(validation.errors.join(', '));
    error.validationErrors = validation.errors;
    throw error;
  }
  
  try {
    const response = await ErrorHandler.retryOperation(
      () => postJson('/api/generate-interview-kit-answers', payload),
      2,  // max 2 retries
      2000 // 2 second delay
    );
    console.log('Interview kit response:', response);
    return response.kit || { technical: [], behavioral: [], scenario: [] };
  } catch (e) {
    console.error('Failed to generate interview kit:', e);
    throw new Error('Failed to generate interview kit: ' + e.message);
  }
}