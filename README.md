# MicroTech Recruiter Suite

A comprehensive recruiting platform that leverages AI to streamline the hiring process, generate job descriptions, and manage candidate assessments. Built with Docker for easy deployment and CMMC Level 2 compliance.

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- OpenAI API key

### 1. Clone and Setup
```bash
git clone https://github.com/Coelho-MT/Recruiter-MT-Docker.git
cd Recruiter-MT-Docker
```

### 2. Configure Environment
Create a `.env` file in the project root:
```bash
echo "OPENAI_API_KEY=your_openai_api_key_here" > .env
echo "MODEL=gpt-4o-mini" >> .env
echo "PORT=5173" >> .env
echo "NODE_ENV=production" >> .env
```

### 3. Run with Docker
```bash
cd docker
docker compose up
```

### 4. Access Application
Open your browser and navigate to: `http://localhost:5173`

## 📋 Project Structure

```
Recruiter-MT-Docker/
├── docker/                          # Docker configuration
│   ├── Dockerfile                   # Multi-stage Docker build
│   ├── docker-compose.yml          # Development compose
│   ├── docker-compose.production.yml # Production compose
│   └── docker-entrypoint.sh        # Security entrypoint
├── server/                          # Backend services
│   ├── index.js                     # Express server
│   ├── services/
│   │   └── openai.js                # OpenAI API service
│   └── middleware/
│       └── validation.js             # Validation & rate limiting
├── src/                             # Frontend source
│   ├── api.js                       # API integration
│   ├── main.js                      # Main app logic
│   ├── pages/
│   │   └── roleBuilder.js           # Role builder functionality
│   └── util/                        # Utility modules
│       ├── dom.js                    # DOM utilities
│       ├── sanitizer.js              # XSS protection
│       ├── errorHandler.js           # Error handling
│       └── validators.js             # Input validation
├── public/                          # Static web files
│   ├── index.html                   # Dashboard
│   ├── role-builder.html            # Role builder page
│   ├── candidates.html              # Candidates page
│   ├── job-analytics.html           # Analytics page
│   └── style.css                    # Global styles
├── scripts/
│   └── build-docker.sh              # Build automation
├── .dockerignore                    # Docker ignore rules
├── .env                             # Environment variables
├── package.json                     # Dependencies
└── README.md                        # This file
```

## 🐳 Docker Deployment

### Development
```bash
cd docker
docker compose up
```

### Production
```bash
cd docker
docker compose -f docker-compose.production.yml up -d
```

### Build Custom Image
```bash
./scripts/build-docker.sh
```

## ⚙️ Configuration

### Environment Variables
- `OPENAI_API_KEY` (required): Your OpenAI API key
- `MODEL` (optional): GPT model to use (default: gpt-4o-mini)
- `PORT` (optional): Server port (default: 5173)
- `NODE_ENV` (optional): Environment mode (default: production)

### Docker Configuration
- **Base Image**: node:18-bullseye-slim
- **Security**: Non-root user, read-only filesystem
- **Resources**: CPU and memory limits configured
- **Health Checks**: Built-in health monitoring
- **Logging**: Structured logging with rotation

## 🎯 Features

### Role Builder
- ✅ AI-powered job description generation
- ✅ Interview questionnaire creation
- ✅ Copy to clipboard functionality
- ✅ Export to .txt files
- ✅ Read-only generated content
- ✅ Real-time form validation
- ✅ Responsive design

### Security Features
- ✅ XSS protection and HTML sanitization
- ✅ Input validation (client and server-side)
- ✅ Rate limiting (10 requests/minute)
- ✅ API key protection via environment variables
- ✅ Non-root Docker container execution
- ✅ Comprehensive error handling

### CMMC Level 2 Compliance
- ✅ Security hardening in Docker containers
- ✅ Audit logging and monitoring
- ✅ Resource limits and health checks
- ✅ Non-privileged user execution
- ✅ Read-only filesystem where possible
- ✅ Network security configurations

## 🔧 Usage

### Generate Job Description
1. Navigate to Role Builder
2. Fill in job details (title, seniority, team, location)
3. Add must-have and nice-to-have skills
4. Add responsibilities, requirements, and benefits
5. Click "Generate" button
6. Copy or export the generated content

### Generate Interview Kit
1. Complete job description generation
2. Interview questions are automatically generated
3. Use "Regenerate Questions" for new questions
4. Copy or export interview kit

## 🛠️ Development

### Local Development
```bash
npm install
npm start
```

### Testing
```bash
# Test Docker build
docker build -t recruiter-mt:test .

# Test Docker Compose
cd docker && docker compose up --build
```

### Building
```bash
# Build with custom version
VERSION=1.2.0 ./scripts/build-docker.sh
```

## 🔒 Security

### CMMC Level 2 Compliance Features
- **Access Control**: Non-root user execution
- **Audit Logging**: Comprehensive request logging
- **System Monitoring**: Health checks and resource limits
- **Data Protection**: Input sanitization and validation
- **Network Security**: DNS configuration and rate limiting

### Security Best Practices
- Environment variables for sensitive data
- Input validation and sanitization
- Rate limiting on API endpoints
- XSS protection for generated content
- Docker security hardening
- Non-privileged container execution

## 📊 API Endpoints

### POST /api/generate-job-description
Generates AI-powered job descriptions
```json
{
  "title": "Software Engineer",
  "seniority": "Senior",
  "team": "Engineering",
  "location": "Remote",
  "remotePolicy": "Fully Remote",
  "mustHaveSkills": ["JavaScript", "React"],
  "niceToHaveSkills": ["TypeScript", "Node.js"],
  "responsibilities": ["Develop features", "Code reviews"],
  "requirements": ["5+ years experience"],
  "benefits": ["Health insurance", "401k"]
}
```

### POST /api/generate-interview-kit-answers
Generates interview questions with answers
```json
{
  "roleTitle": "Software Engineer",
  "seniority": "Senior",
  "team": "Engineering"
}
```

## 🚨 Troubleshooting

### Common Issues

**Generate Button Not Working**
- Check OPENAI_API_KEY in .env file
- Verify Docker container is running
- Check browser console for errors

**Docker Build Fails**
- Ensure Docker is running
- Check internet connection for base image pull
- Verify .env file exists

**API Connection Errors**
- Verify OpenAI API key is valid
- Check network connectivity
- Review Docker logs: `docker compose logs`

### Debug Commands
```bash
# Check container status
docker compose ps

# View logs
docker compose logs -f

# Check environment variables
docker compose exec recruiter-mt env

# Test API connectivity
curl http://localhost:5173/api/generate-job-description
```

## 🏗️ Architecture

### Technology Stack
- **Frontend**: HTML5, CSS3, TailwindCSS, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **AI Integration**: OpenAI GPT API (gpt-4o-mini)
- **Containerization**: Docker, Docker Compose
- **Security**: CMMC Level 2 compliance

### Key Components
- **OpenAI Service**: Handles all AI generation requests
- **Validation Middleware**: Request validation and rate limiting
- **Error Handler**: Comprehensive error management
- **Sanitizer**: XSS protection and HTML sanitization
- **Docker Entrypoint**: Security validations and startup

## 📈 Performance

### Optimizations
- Parallel API calls for job description and interview kit
- Retry logic with exponential backoff
- Request caching and rate limiting
- Optimized Docker image layers
- Resource limits and health checks

### Monitoring
- Health check endpoints
- Request logging with Morgan
- Error tracking and reporting
- Resource usage monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is proprietary software owned by MicroTech. All rights reserved.

## 📞 Support

For technical support or questions:
- Create an issue in the GitHub repository
- Contact the MicroTech development team
- Review the troubleshooting section above

---

**MicroTech Recruiter Suite** - Streamlining recruitment with AI-powered automation and CMMC Level 2 compliance.