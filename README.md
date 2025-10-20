# MicroTech Recruiter Suite

A comprehensive recruiting platform that leverages AI to streamline the hiring process, generate job descriptions, and manage candidate assessments.

## Overview

MicroTech Recruiter Suite is a web-based application designed to help recruiters and hiring managers optimize their recruitment workflow. The platform integrates OpenAI's GPT models to automate job description creation and generate relevant interview questions.

## Features

### Role Builder
- AI-powered job description generation
- Customizable templates and formatting
- Built-in interview questionnaire generation
- Export functionality for job descriptions and interview kits
- Real-time editing capabilities

### Candidates Management
- Integration with iCIMS
- Candidate tracking and ranking
- Profile management and assessment
- Interview feedback collection

### Job Analytics
- Position comparison metrics
- Hiring funnel optimization
- Performance tracking
- Data-driven insights

## Technology Stack

- **Frontend:**
  - HTML5/CSS3
  - TailwindCSS for styling
  - JavaScript (Vanilla)
  - Feather Icons

- **Backend:**
  - Node.js
  - Express.js
  - OpenAI GPT API integration

- **Dependencies:**
  - dotenv for environment management
  - node-fetch for API calls
  - morgan for request logging

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd recruiter-mt-full-project
```

The application will be available at `http://localhost:5173`

## Project Structure

```
recruiter-mt-full-project/
├── server/
│   └── index.js         # Express server configuration
├── src/
│   ├── api.js          # API integration
│   ├── main.js         # Main application logic
│   └── util/
│       └── dom.js      # DOM utility functions
├── web/
│   ├── candidates.html
│   ├── index.html
│   ├── job-analytics.html
│   ├── role-builder.html
│   └── style.css
└── package.json
```

## Usage

1. **Dashboard Navigation**
   - Access different modules through the main dashboard
   - Each module is designed for specific recruitment tasks

2. **Role Builder**
   - Enter job details including title, seniority, and requirements
   - Generate AI-powered job descriptions
   - Review and edit generated content
   - Export job descriptions and interview questions

3. **Job Analytics**
   - View hiring metrics and statistics
   - Track recruitment pipeline performance
   - Generate reports and insights

## Performance Considerations

- Job description generation is optimized for parallel processing
- Interview question generation is role-specific
- Caching implemented for frequently accessed data
- Rate limiting for API calls

## Security

- Environment variables for sensitive data
- Input sanitization for user-generated content
- API key protection
- XSS prevention measures
