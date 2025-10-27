/**
 * Client-side error handling and retry utilities
 */

export class ErrorHandler {
  /**
   * Show user-friendly error message
   */
  static showError(error, context = 'operation') {
    console.error(`Error in ${context}:`, error);
    
    let message = 'An unexpected error occurred. Please try again.';
    
    if (error.message) {
      if (error.message.includes('Failed to fetch')) {
        message = 'Unable to connect to the server. Please check your internet connection.';
      } else if (error.message.includes('timeout')) {
        message = 'The request timed out. Please try again.';
      } else if (error.message.includes('API key')) {
        message = 'API configuration error. Please contact support.';
      } else if (error.validationErrors) {
        message = error.validationErrors.join(', ');
      } else {
        message = error.message;
      }
    }
    
    // Show toast notification
    if (window.toast) {
      window.toast(message, 'error');
    } else {
      alert(message);
    }
  }

  /**
   * Retry operation with exponential backoff
   */
  static async retryOperation(operation, maxRetries = 3, baseDelay = 1000) {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Don't retry on validation errors
        if (error.validationErrors) {
          throw error;
        }
        
        // Calculate delay with exponential backoff
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`, error.message);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  /**
   * Setup global error handling
   */
  static setupGlobalHandlers() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      this.showError(event.reason, 'unhandled promise');
      event.preventDefault();
    });

    // Handle global errors
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      this.showError(event.error, 'global error');
    });
  }
}
