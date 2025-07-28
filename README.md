# CareerCompass

<img src="docs/logo.png" alt="CareerCompass Logo" width="120" />

**Tagline:**
> Navigate your career journey with AI-powered job matching and analytics.

---

## Overview
CareerCompass is a modern, AI-driven job and talent matching platform built for **FusionHacks 2**. It helps employers find the best candidates for their job postings and empowers job seekers to discover opportunities that fit their skills and goals. The platform leverages advanced matching, ranking, and analytics to streamline the hiring process for both sides.

## 🚀 FusionHacks 2 Submission

### Inspiration
CareerCompass was inspired by the challenges faced by both job seekers and employers in finding the right fit. We wanted to create a platform that leverages AI to make the hiring process more efficient, transparent, and fair for everyone. Our goal was to reduce manual screening, surface the best candidates, and help job seekers discover opportunities that truly match their skills and aspirations.

### About the Project
This project was built for [FusionHacks 2 on Devpost](https://fusionhacks2.devpost.com/). We set out to solve the problem of inefficient job matching and candidate screening by combining modern web technologies with AI-driven flows. Along the way, we learned a lot about integrating AI with real-world data, handling edge cases in candidate ranking, and building a scalable, user-friendly platform.

**What we learned:**
- How to design and implement AI-powered flows for ranking and matching.
- Best practices for structuring a Next.js + Firebase project.
- Handling real-time data and user roles securely.
- The importance of clear UI/UX for both employers and job seekers.

**Challenges we faced:**
- Ensuring fair and unbiased candidate ranking.
- Handling edge cases where no candidates or postings exist.
- Integrating multiple APIs and cloud services smoothly.
- Building a robust, scalable backend for real-time data.

## 🛠️ Built With
- **Languages:** TypeScript, JavaScript
- **Frameworks:** Next.js 15, React
- **Styling:** Tailwind CSS
- **Cloud/Backend:** Firebase Firestore, Next.js API routes
- **AI/ML:** Genkit, Gemini API
- **Other:** Cloudinary, Brevo, Lucide Icons

## 🌐 Try it out
- [GitHub Repository](https://github.com/arsh342/careercompass)
- [Devpost Project Page](https://devpost.com/software/careercompass-8sa5kg)

---

## ✨ Core Features

- **User Profiling:** User profile creation and management to store education, skills, interests, and career goals.
- **Opportunity Aggregation:** Aggregation of internship and volunteer postings from various sources or allows organizations to post directly.
- **AI Matching Engine:** AI-powered tool for matching user profiles and listings based on skills, interests, and preferences.
- **Personalized Recommendations:** Personalized recommendations ranked with explanations and relevance indicators.
- **Application Management:** Ability to save, bookmark, and apply for opportunities.
- **Employer Dashboard:** Dashboard for employers to create job postings and manage applications.
- **Employee Dashboard:** Dashboard for employees to manage profile and track recommendations.
- **Firebase Authentication:** Firebase Authentication with Google Sign-In and Forgot Password functionality.
- **Comprehensive ATS Score Checker:** Advanced, case-insensitive, and robust ATS scoring for resumes, including education, skills, and preferred skills matching.

## 🤖 AI-Powered Features
- **AI-Powered Candidate Ranking:**
  - `findAndRankCandidates`: Finds and ranks employees for an employer's active job postings, using AI to score and justify matches based on skills, experience, and goals.
  - `findMatchingCandidates`: Finds employees whose skills match a specific opportunity, returning a list of suitable candidates.
- **Employer Dashboard:**
  - View top-ranked candidates for your postings.
  - Analytics on postings and applicants.
- **Employee Experience:**
  - Discover and apply to jobs that match your skills.
  - Track applications, save opportunities, and manage your profile.
- **Admin/Automation:**
  - Automated emails for application status and onboarding.
  - Secure authentication and role-based navigation.

## 🔄 Flow Explanation
### 1. `findAndRankCandidates`
- **Purpose:** For an employer, find all employees who have not already been actioned (approved/rejected) for their active postings, and rank them using AI.
- **How it works:**
  1. Fetch all active postings for the employer and extract required skills.
  2. Get all employees from the database.
  3. Filter out employees who have already been actioned for these postings.
  4. Use an AI prompt to rank the remaining employees by match percentage and provide a justification.
  5. Return the top candidates to the dashboard.

### 2. `findMatchingCandidates`
- **Purpose:** For a specific job opportunity, find all employees whose skills match the required skills for that opportunity.
- **How it works:**
  1. Fetch the opportunity and extract required skills.
  2. Get all employees from the database.
  3. Compare employee skills to required skills and return those with at least one match.

## 💡 What Problem Does It Solve?
- **For Employers:**
  - Saves time by surfacing the best-fit candidates automatically.
  - Reduces bias and manual effort in screening.
  - Provides actionable analytics on postings and applicants.
- **For Job Seekers:**
  - Surfaces relevant opportunities based on real skills and goals.
  - Makes the application process transparent and efficient.

## 🎨 Style Guidelines

- **Primary color:** Deep blue (#3F51B5) to evoke trust and professionalism.
- **Background color:** Light gray (#F0F2F5) to ensure readability and a clean interface.
- **Accent color:** Vibrant orange (#FF9800) for call-to-action buttons and highlighting important elements.
- **Body and headline font:** 'Inter' (sans-serif) for a modern, neutral, and readable interface.
- **Code font:** 'Source Code Pro' for displaying code snippets.
- Use consistent and professional icons to represent different categories, skills, and functionalities. Follow Material UI guidelines.
- Adhere to Material UI grid system for responsive layouts.
- Subtle transitions and animations to provide feedback and guide users through the application process, following Material UI guidelines.

## 📁 Project Structure

```
careercompass/
├── apphosting.yaml
├── components.json
├── firestore.rules
├── next-env.d.ts
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── README.md
├── tailwind.config.ts
├── tsconfig.json
├── docs/
│   └── blueprint.md
├── src/
│   ├── ai/
│   │   ├── dev.ts
│   │   ├── genkit.ts
│   │   └── flows/
│   │       ├── analyze-opportunity-description.ts
│   │       ├── enhance-text.ts
│   │       ├── find-and-rank-candidates.ts
│   │       ├── find-matching-candidates.ts
│   │       ├── generate-profile-summary.ts
│   │       ├── parse-resume.ts
│   │       ├── send-application-status-email.ts
│   │       ├── send-welcome-email.ts
│   │       └── types.ts
│   ├── app/
│   │   ├── (app)/ ... (main app pages and routes)
│   │   ├── (auth)/ ... (authentication pages)
│   │   └── api/ ... (API routes)
│   ├── components/
│   │   └── ui/ ... (UI components)
│   ├── context/
│   ├── hooks/
│   └── lib/
└── ...
```

---

For more details, see the code in `src/ai/flows/` and the main app in `src/app/`.
