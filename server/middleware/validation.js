/**
 * Server-side validation middleware
 */

/**
 * Validate job description request
 */
export function validateJobDescription(req, res, next) {
  const errors = [];

  // Required fields
  if (!req.body.title || typeof req.body.title !== 'string' || !req.body.title.trim()) {
    errors.push('Job title is required');
  }

  // Length validations
  if (req.body.title && req.body.title.length > 200) {
    errors.push('Job title must be less than 200 characters');
  }

  if (req.body.team && req.body.team.length > 100) {
    errors.push('Team name must be less than 100 characters');
  }

  if (req.body.location && req.body.location.length > 100) {
    errors.push('Location must be less than 100 characters');
  }

  // Array validations
  if (req.body.mustHaveSkills && !Array.isArray(req.body.mustHaveSkills)) {
    errors.push('Must-have skills must be an array');
  }

  if (req.body.niceToHaveSkills && !Array.isArray(req.body.niceToHaveSkills)) {
    errors.push('Nice-to-have skills must be an array');
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors 
    });
  }

  next();
}

/**
 * Validate interview kit request
 */
export function validateInterviewKit(req, res, next) {
  const errors = [];

  // Required fields
  if (!req.body.roleTitle || typeof req.body.roleTitle !== 'string' || !req.body.roleTitle.trim()) {
    errors.push('Role title is required');
  }

  // Length validations
  if (req.body.roleTitle && req.body.roleTitle.length > 200) {
    errors.push('Role title must be less than 200 characters');
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors 
    });
  }

  next();
}

/**
 * Rate limiter middleware
 */
export class RateLimiter {
  constructor(maxRequests, windowMs) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map();
  }

  middleware() {
    return (req, res, next) => {
      const clientId = req.ip || req.connection.remoteAddress;
      const now = Date.now();
      
      // Clean old entries
      if (!this.requests.has(clientId)) {
        this.requests.set(clientId, []);
      }
      
      const clientRequests = this.requests.get(clientId);
      
      // Remove requests outside the window
      const windowStart = now - this.windowMs;
      const validRequests = clientRequests.filter(timestamp => timestamp > windowStart);
      
      if (validRequests.length >= this.maxRequests) {
        return res.status(429).json({
          error: 'Too many requests',
          message: `Rate limit exceeded. Maximum ${this.maxRequests} requests per ${this.windowMs / 1000} seconds.`
        });
      }
      
      // Add current request
      validRequests.push(now);
      this.requests.set(clientId, validRequests);
      
      next();
    };
  }

  cleanup() {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    for (const [clientId, requests] of this.requests.entries()) {
      const validRequests = requests.filter(timestamp => timestamp > windowStart);
      if (validRequests.length === 0) {
        this.requests.delete(clientId);
      } else {
        this.requests.set(clientId, validRequests);
      }
    }
  }
}

/**
 * Global error handler middleware
 */
export function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message
    });
  }

  if (err.name === 'AbortError') {
    return res.status(408).json({
      error: 'Request Timeout',
      message: 'The request took too long to process. Please try again.'
    });
  }

  if (err.message && err.message.includes('EAI_AGAIN')) {
    return res.status(503).json({
      error: 'Service Unavailable',
      message: 'Unable to connect to external services. Please try again later.'
    });
  }

  if (err.message && err.message.includes('OpenAI error')) {
    return res.status(502).json({
      error: 'AI Service Error',
      message: 'The AI service is currently unavailable. Please try again later.'
    });
  }

  // Default error response
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message
  });
}
