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
      throw new Error(`Request failed ${resp.status}: ${text}`);
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

export async function generateJD(payload) {
  console.log('Generating job description:', payload);
  try {
    const { html } = await postJson('/api/generate-job-description', payload);
    return html || '';
  } catch (e) {
    console.error('Failed to generate job description:', e);
    throw new Error('Failed to generate job description: ' + e.message);
  }
}

export async function generateInterviewKitWithAnswers(payload) {
  console.log('Generating interview kit:', payload);
  try {
    const { kit } = await postJson('/api/generate-interview-kit-answers', payload);
    return kit || { technical: [], behavioral: [], scenario: [], rubric: [] };
  } catch (e) {
    console.error('Failed to generate interview kit:', e);
    throw new Error('Failed to generate interview kit: ' + e.message);
  }
}