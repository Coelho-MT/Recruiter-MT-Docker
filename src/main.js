import { initRoleBuilder } from './pages/roleBuilder.js';
import { ErrorHandler } from './util/errorHandler.js';

// Initialize global error handling
ErrorHandler.setupGlobalHandlers();

// Initialize page-specific functionality
document.addEventListener('DOMContentLoaded', () => {
  // Initialize role builder if on role builder page
  if (document.getElementById('job-title')) {
    initRoleBuilder();
  }
});