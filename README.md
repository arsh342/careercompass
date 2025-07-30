# 🧽 CareerCompass

> *Navigate your career journey with AI-powered job matching and analytics.*

<p align="center">
  <img src="docs/logo.png" alt="CareerCompass Logo" width="150" />
</p>

---

## 🔗 Links

* 🌐 [Live Demo](https://careercompassai.vercel.app/)
* 🛆 [GitHub Repository](https://github.com/arsh342/careercompass)
* 🧠 [Devpost Submission](https://devpost.com/software/careercompass-8sa5kg)
* 📧 [Email](mailto:arsth134@gmail.com)
* 💼 [LinkedIn](https://www.linkedin.com/in/arshsingh342/)

---

## 🧠 What is CareerCompass?

CareerCompass is a modern, AI-driven job and talent matching platform built for **FusionHacks 2**. It bridges the gap between employers and job seekers using intelligent ranking, real-time analytics, and advanced matching flows powered by large language models.

Whether you're a **job seeker** exploring relevant roles or an **employer** seeking top-tier candidates, CareerCompass streamlines the process with transparency, personalization, and actionable insights.

---

## ✨ Key Features

### 🚀 For Job Seekers (Employees)

* Create rich user profiles with **skills**, **goals**, and **portfolio links**.
* AI-powered **job recommendations** tailored to your profile.
* Track applications, bookmark listings, and update your employability status.
* View relevance scores and match explanations powered by AI.

### 🧑‍💼 For Employers

* Post internships, jobs, and volunteer roles.
* Use the **AI Candidate Ranking Engine** to find top talent instantly.
* Access an **analytics dashboard** with insights on applications.
* View candidates' profiles, LinkedIn, and portfolio in one place.

### 🧠 AI-Powered Capabilities

* **Candidate Ranking**: Uses AI to find best-fit candidates for each job posting.
* **Resume Parsing & ATS Scoring**: Extracts structured info from resumes and scores them intelligently.
* **Skill Matching**: Matches opportunities and employees using Genkit + Gemini AI APIs.

---

## 🔄 AI Flows Breakdown

### 🔍 `findAndRankCandidates`

Finds and ranks employees for an employer’s active job postings.

1. Collect all active job postings and required skills.
2. Filter out already-reviewed applicants.
3. Prompt AI to score and rank candidates based on profile-to-job alignment.
4. Return top results with justifications.

### 🎯 `findMatchingCandidates`

Finds all employees who match a specific opportunity’s skill requirements.

1. Extract required skills from a specific job.
2. Filter employee profiles that match at least one skill.
3. Return a short list of candidates ready for action.

---

## 🏗️ Tech Stack

| Category     | Tech Used                              |
| ------------ | -------------------------------------- |
| **Frontend** | Next.js 15, React, Tailwind CSS        |
| **Backend**  | Next.js API Routes, Firebase Firestore |
| **Auth**     | Firebase Auth with Google Sign-In      |
| **AI/ML**    | Genkit, Gemini API                     |
| **Cloud**    | Firebase Hosting, Cloudinary (media)   |
| **Email**    | Brevo (Transactional Emails)           |
| **Icons**    | Lucide Icons                           |

---

## 📊 Analytics & Dashboards

* Employer dashboard displays:

  * Top candidates per job posting.
  * Job application trends via **Recharts**.
  * Role-aware navigation based on auth state.

---

## 🎨 UI/UX Highlights

* Styled components with consistent form, modal, and dialog designs.
* Responsive layout with Tailwind CSS + Material UI grid.
* Role-aware navigation and dashboards for employers/employees.
* Animated transitions for feedback and user interaction.

### 🖌️ Design System

| Element           | Style                              |
| ----------------- | ---------------------------------- |
| **Primary Color** | Deep Blue `#3F51B5`                |
| **Accent Color**  | Orange `#FF9800`                   |
| **Background**    | Light Gray `#F0F2F5`               |
| **Fonts**         | Inter (UI), Source Code Pro (Code) |
| **Icons**         | Material UI, Lucide                |

---

## 🛠️ Project Structure

```
careercompass/
├── src/
│   ├── ai/                        # AI-powered logic and prompt flows
│   ├── app/                       # Application routes and pages
│   ├── components/               # Reusable UI components
│   ├── context/                  # Auth, Theme, and Global State
│   ├── hooks/                    # Custom React hooks
│   └── lib/                      # Utilities and constants
├── docs/                         # Hackathon documentation
├── tailwind.config.ts           # Tailwind CSS config
├── firestore.rules              # Firebase security rules
├── .env.local                   # Environment secrets (excluded from repo)
├── next.config.ts               # Next.js configuration
└── README.md                    # You're here!
```

---

## 🧪 Recent Improvements

* ✅ AI flows improved with clearer justifications and scoring logic.
* ✅ Navigation is now role-based and dynamically routed.
* ✅ Email notifications now trigger **only on relevant actions**.
* ✅ LinkedIn and Portfolio links now visible on candidate cards.
* ✅ Firebase secrets moved to `.env.local` for security.
* ✅ Cleaned up dead/debug code and unused API triggers.

---

## ⚖️ License

This project is licensed under the **MIT License**.
See the [LICENSE](./LICENSE) file for details.

---

## 🤝 Contributors

* 👨‍💻 Arsh Singh – [LinkedIn](https://www.linkedin.com/in/arshsingh342/) | [Email](mailto:arsth134@gmail.com)

---

## 📣 Submission

This project was created for **[FusionHacks 2](https://fusionhacks2.devpost.com/)** and is proudly open-sourced for future development and collaboration.
