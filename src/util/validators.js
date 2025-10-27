/**
 * Client-side validation utilities
 */

/**
 * Validate job description form data
 */
export function validateJobDescription(data) {
  const errors = [];

  // Required fields
  if (!data.title || typeof data.title !== 'string' || !data.title.trim()) {
    errors.push('Job title is required');
  }

  // Length validations
  if (data.title && data.title.length > 200) {
    errors.push('Job title must be less than 200 characters');
  }

  if (data.team && data.team.length > 100) {
    errors.push('Team name must be less than 100 characters');
  }

  if (data.location && data.location.length > 100) {
    errors.push('Location must be less than 100 characters');
  }

  // Array validations
  if (data.mustHaveSkills && !Array.isArray(data.mustHaveSkills)) {
    errors.push('Must-have skills must be an array');
  }

  if (data.niceToHaveSkills && !Array.isArray(data.niceToHaveSkills)) {
    errors.push('Nice-to-have skills must be an array');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate interview kit request data
 */
export function validateInterviewKit(data) {
  const errors = [];

  // Required fields
  if (!data.roleTitle || typeof data.roleTitle !== 'string' || !data.roleTitle.trim()) {
    errors.push('Role title is required');
  }

  // Length validations
  if (data.roleTitle && data.roleTitle.length > 200) {
    errors.push('Role title must be less than 200 characters');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate email format
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function isValidURL(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitize and validate skill input
 */
export function validateSkill(skill, years) {
  const errors = [];

  if (!skill || typeof skill !== 'string' || !skill.trim()) {
    errors.push('Skill name is required');
  }

  if (skill && skill.length > 50) {
    errors.push('Skill name must be less than 50 characters');
  }

  if (years !== undefined && years !== null) {
    const yearsNum = parseInt(years, 10);
    if (isNaN(yearsNum) || yearsNum < 0 || yearsNum > 50) {
      errors.push('Years of experience must be between 0 and 50');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
