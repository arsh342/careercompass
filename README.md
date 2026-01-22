# CareerCompass

> Navigate your career journey with AI-powered job matching, intelligent tools, and comprehensive analytics.

<p align="center">
  <img src="docs/logo.png" alt="CareerCompass Logo" width="150" style="background-color: white; padding: 20px; border-radius: 10px;" />
</p>

<p align="center">
  <strong>AI-Powered Career Platform for Job Seekers & Employers</strong>
</p>

<p align="center">
  <a href="https://careercompassai.vercel.app/">Live Demo</a> •
  <a href="https://github.com/arsh342/careercompass">Repository</a> •
  <a href="mailto:arsth134@gmail.com">Contact</a>
</p>

---

## Overview

CareerCompass is a dual-sided AI platform that transforms how employers and job seekers connect. Powered by **Google Gemini AI** and the **Genkit framework**, it provides intelligent matching, comprehensive analytics, and automated workflows for the entire hiring journey.

### Key Highlights

- **17 AI Flows** - Comprehensive AI-powered features covering the entire career journey
- **67 UI Components** - Rich, modern component library with animations
- **Dual-Sided Platform** - Seamless experience for both job seekers and employers
- **Real-Time Analytics** - Live dashboards with actionable insights
- **ATS Optimization** - Help candidates beat Applicant Tracking Systems
- **Email Automation** - Automated notifications and status updates

---

## Features

### For Job Seekers

| Feature | Description |
|---------|-------------|
| **AI Job Matching** | Personalized recommendations based on skills and preferences |
| **Resume Builder** | AI-powered resume creation and enhancement |
| **ATS Score Analysis** | Optimize resumes for Applicant Tracking Systems |
| **Cover Letter Generator** | Generate tailored cover letters for each application |
| **Interview Prep** | AI-generated practice questions based on job requirements |
| **LinkedIn Optimizer** | Suggestions to improve your LinkedIn profile |
| **Skill Gap Analysis** | Identify missing skills for target roles |
| **Salary Negotiation** | Market insights and negotiation strategies |
| **Application Tracking** | Monitor status of all applications in one place |
| **AI Chat Assistant** | Interactive career guidance and support |

### For Employers

| Feature | Description |
|---------|-------------|
| **AI Candidate Ranking** | Automatically score applicants by job fit |
| **Smart Job Posting** | AI-enhanced job descriptions |
| **Candidate Discovery** | Find qualified candidates proactively |
| **Recruitment Analytics** | Dashboards with hiring metrics and insights |
| **Kanban Board** | Visual candidate pipeline management |
| **Bulk Outreach** | Invite multiple candidates to apply |
| **Email Automation** | Automated status updates and communications |
| **Team Collaboration** | Multi-user candidate evaluation |

---

## AI Flows

CareerCompass includes 17 specialized AI flows powered by Google Gemini:

| Flow | Purpose |
|------|---------|
| `findAndRankCandidates` | Intelligent candidate scoring and ranking |
| `findMatchingCandidates` | Discover candidates matching job requirements |
| `parseResume` | Extract structured data from resumes |
| `enhanceText` | Improve resumes and job descriptions |
| `generateResume` | AI-powered resume creation |
| `generateCoverLetter` | Tailored cover letter generation |
| `generateProfileSummary` | Create compelling profile summaries |
| `interviewPrep` | Generate role-specific interview questions |
| `jobMatch` | Semantic job-candidate matching |
| `skillGap` | Identify skills needed for target roles |
| `salaryNegotiation` | Salary insights and strategies |
| `linkedinOptimizer` | LinkedIn profile improvement suggestions |
| `analyzeOpportunityDescription` | Enhanced job posting analysis |
| `sendApplicationStatusEmail` | Automated application updates |
| `sendWelcomeEmail` | Onboarding email automation |
| `emailTemplates` | Dynamic email template generation |

---

## Tech Stack

### Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.3.6 | React framework with App Router |
| **React** | 18.x | UI component library |
| **TypeScript** | 5.x | Type-safe development |
| **Tailwind CSS** | 3.4.1 | Utility-first styling |

### AI & Backend

| Technology | Purpose |
|------------|---------|
| **Genkit** | AI flow orchestration framework |
| **Gemini Pro/Flash** | Google's language models |
| **Firebase Firestore** | Real-time NoSQL database |
| **Firebase Auth** | Authentication with Google OAuth |
| **Cloudinary** | Image storage and optimization |
| **Brevo** | Transactional email service |
| **Stripe** | Payment processing |

### UI Libraries

| Library | Purpose |
|---------|---------|
| **Radix UI** | Accessible component primitives |
| **Framer Motion** | Animations and transitions |
| **GSAP** | Advanced animations |
| **Recharts** | Data visualization |
| **Lucide React** | Icon library |

---

## Project Structure

```
careercompass/
├── src/
│   ├── ai/                          # AI Engine
│   │   ├── genkit.ts                # Genkit configuration
│   │   ├── dev.ts                   # Development server
│   │   └── flows/                   # 17 AI flow implementations
│   │       ├── find-and-rank-candidates.ts
│   │       ├── generate-resume.ts
│   │       ├── interview-prep.ts
│   │       └── ...
│   │
│   ├── app/                         # Next.js App Router
│   │   ├── (app)/                   # Authenticated routes
│   │   │   ├── ai-tools/            # AI Tools Suite
│   │   │   │   ├── cover-letter/
│   │   │   │   ├── interview-prep/
│   │   │   │   ├── linkedin/
│   │   │   │   ├── resume-builder/
│   │   │   │   ├── salary/
│   │   │   │   └── skill-gap/
│   │   │   ├── analytics/           # Analytics dashboard
│   │   │   ├── applications/        # Application management
│   │   │   ├── chat/                # AI chat assistant
│   │   │   ├── dashboard/           # User dashboard
│   │   │   ├── employer/            # Employer routes
│   │   │   ├── inbox/               # Messages
│   │   │   ├── opportunities/       # Job listings
│   │   │   ├── profile/             # User profile
│   │   │   └── saved/               # Saved opportunities
│   │   ├── (auth)/                  # Auth routes
│   │   └── api/                     # API endpoints
│   │
│   ├── components/                  # React Components
│   │   └── ui/                      # 67 UI components
│   │       ├── chat-interface.tsx
│   │       ├── kanban.tsx
│   │       ├── opportunity-card.tsx
│   │       └── ...
│   │
│   ├── context/                     # React Context
│   ├── hooks/                       # Custom hooks
│   └── lib/                         # Utilities
│
├── docs/                            # Documentation
│   ├── blueprint.md
│   └── logo.png
│
└── Configuration files
```

---

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Git

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/arsh342/careercompass.git
   cd careercompass
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:9002
   ```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run genkit:dev` | Start Genkit AI development server |
| `npm run genkit:watch` | Start Genkit with hot reload |

### Environment Variables

Create a `.env.local` file:

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Google AI
GOOGLE_GENAI_API_KEY=

# Brevo Email
BREVO_API_KEY=
BREVO_SMTP_HOST=
BREVO_SMTP_PORT=
BREVO_SMTP_USER=
BREVO_SMTP_PASS=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

---

## Deployment

CareerCompass is deployed on **Vercel** with the following configuration:

- **Framework**: Next.js
- **Node Version**: 18.x
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

### Firebase App Hosting

Configuration in `apphosting.yaml`:
```yaml
runConfig:
  cpu: 1
  memoryMiB: 512
  concurrency: 80
```

---

## Performance

- **Lighthouse Score**: 95+
- **Core Web Vitals**: Optimized
- **Bundle Size**: Minimized with tree-shaking
- **Images**: Optimized via Cloudinary

---

## License

This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for details.

---

## Author

**Arsh Singh**

- [LinkedIn](https://www.linkedin.com/in/arshsingh342/)
- [Email](mailto:arsth134@gmail.com)
- [GitHub](https://github.com/arsh342)

---

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- AI powered by [Google Gemini](https://ai.google.dev/)
- AI orchestration by [Genkit](https://firebase.google.com/docs/genkit)
- Deployed on [Vercel](https://vercel.com/)
