"use client";

import Link from "next/link";
import {
  Shield,
  Lock,
  Eye,
  Users,
  Share2,
  FileText,
  Mail,
  ChevronRight,
  Clock,
  ShieldCheck,
  RefreshCcw,
} from "lucide-react";
import { ScrollText } from "lucide-react";

const LAST_UPDATED = "March 6, 2026";

interface Section {
  id: string;
  icon: React.ReactNode;
  title: string;
  content: React.ReactNode;
}

const sections: Section[] = [
  {
    id: "introduction",
    icon: <Lock className="w-4 h-4" />,
    title: "Introduction",
    content: (
      <p className="text-muted-foreground">
        At CareerCompass, we value your privacy. This Privacy Policy document
        outlines the types of personal information we collect, how we use and
        protect it, and your rights regarding your data. By using our services,
        you agree to the collection and use of information in accordance with
        this policy.
      </p>
    ),
  },
  {
    id: "information-we-collect",
    icon: <FileText className="w-4 h-4" />,
    title: "Information We Collect",
    content: (
      <ul className="list-disc ml-5 space-y-2">
        <li>
          <strong>Personal Information:</strong> When you create an account, we
          collect personal details such as your name, email address, and
          password. This information is essential for authentication and account
          management.
        </li>
        <li>
          <strong>Profile Data:</strong> We collect information about your
          education, skills, interests, career goals, and company name to
          provide personalized services.
        </li>
        <li>
          <strong>Usage Data:</strong> We track your interactions with our
          platform, including saved opportunities, dashboard activity, and
          recommendations, to improve our services.
        </li>
        <li>
          <strong>Resume Data:</strong> If you upload your resume, we collect
          and parse data such as your skills, experience, certifications, and
          keywords to enhance your profile and job matching.
        </li>
        <li>
          <strong>Application Data:</strong> We collect information about your
          job applications, including status, messages, and chat history, to
          facilitate communication and track progress.
        </li>
        <li>
          <strong>Cookies:</strong> We use cookies to manage UI state and
          sessions. Cookies are small data files stored on your device that help
          us improve your experience.
        </li>
        <li>
          <strong>Email Interactions:</strong> We track interactions with our
          emails, including opens and clicks, to measure engagement and improve
          our communication.
        </li>
      </ul>
    ),
  },
  {
    id: "how-we-use-your-information",
    icon: <Eye className="w-4 h-4" />,
    title: "How We Use Your Information",
    content: (
      <div className="space-y-4">
        <ul className="list-disc ml-5 space-y-2">
          <li>
            <strong>Account Management:</strong> We use your information to
            create, manage, and secure your account.
          </li>
          <li>
            <strong>Personalization:</strong> Your data helps us tailor
            recommendations and content on your dashboard to match your profile.
          </li>
          <li>
            <strong>Opportunity Matching:</strong> We use your profile
            information to match you with relevant job opportunities and provide
            scoring to prioritize applications.
          </li>
          <li>
            <strong>Communication:</strong> We send you onboarding emails,
            status updates, and notifications about new opportunities or
            platform features.
          </li>
          <li>
            <strong>Application Tracking:</strong> We provide tools to track the
            status of your applications and enable messaging between you and
            potential employers.
          </li>
          <li>
            <strong>Analytics and Improvement:</strong> We analyze usage data to
            understand how our platform is used and identify areas for
            improvement.
          </li>
        </ul>
        <div className="grid sm:grid-cols-2 gap-3 mt-6">
          {[
            {
              title: "AI Processing",
              desc: "Your resume text, job descriptions, and submitted prompts are processed by Google Gemini 2.5 Flash via the Genkit framework to generate ATS scores, cover letters, skill gap analyses, interview questions, salary insights, LinkedIn suggestions, and candidate rankings. By using these features, you consent to this processing.",
            },
            {
              title: "File Security Validation",
              desc: "All uploaded files are validated server-side against magic byte signatures to confirm actual file type, regardless of declared extension. Files exceeding 5 MB or failing signature validation are rejected and not stored.",
            },
          ].map(({ title, desc }) => (
            <div
              key={title}
              className="p-4 rounded-lg border border-border bg-card"
            >
              <p className="font-medium text-foreground text-sm mb-1">
                {title}
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "encryption-security",
    icon: <Lock className="w-4 h-4" />,
    title: "Encryption & Security",
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground leading-relaxed">
          CareerCompass employs multiple security layers to protect your data in
          transit and at rest.
        </p>
        <div className="space-y-3">
          {[
            {
              label: "End-to-End Encrypted Messaging (AES-GCM 256-bit)",
              detail:
                "All chat messages are encrypted on your device using AES-GCM with a 256-bit key before transmission. Our servers relay only ciphertext — CareerCompass cannot read your messages.",
            },
            {
              label: "ECDH P-256 Key Exchange",
              detail:
                "Session encryption keys are derived via Elliptic Curve Diffie-Hellman (ECDH P-256) using the Web Crypto API. Your private keys are generated locally and stored in IndexedDB on your device. They are never transmitted to our servers.",
            },
            {
              label: "Infrastructure Encryption",
              detail:
                "All data at rest in Firebase Firestore and Cloud Storage is encrypted using Google-managed AES-256 keys. All data in transit is protected by TLS 1.2+.",
            },
            {
              label: "File Signature Validation",
              detail:
                "Every uploaded file undergoes magic byte signature validation server-side. Files that fail validation — regardless of declared extension — are rejected before storage.",
            },
            {
              label: "API Rate Limiting",
              detail:
                "AI processing endpoints, checkout sessions, and file upload routes are rate-limited to prevent abuse and denial-of-service attempts.",
            },
            {
              label: "Payment Security",
              detail:
                "No raw card data is processed by CareerCompass servers. All payment flows run through Stripe's PCI-DSS compliant infrastructure.",
            },
          ].map(({ label, detail }) => (
            <div
              key={label}
              className="flex gap-3 p-4 rounded-lg bg-muted/50 border border-border/50"
            >
              <Lock className="w-4 h-4 mt-0.5 text-green-500 shrink-0" />
              <div>
                <span className="font-medium text-foreground text-sm">
                  {label}
                </span>
                <p className="text-muted-foreground text-sm mt-0.5 leading-relaxed">
                  {detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "third-party-services",
    icon: <Users className="w-4 h-4" />,
    title: "Third-Party Providers",
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          We may employ third-party services for various purposes, such as
          analytics, payment processing, and email communication. These third
          parties may have access to your personal information as needed to
          perform their functions, but they are obligated not to disclose or use
          it for any other purpose.
        </p>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-foreground">
                  Provider
                </th>
                <th className="text-left px-4 py-3 font-medium text-foreground">
                  Purpose
                </th>
                <th className="text-left px-4 py-3 font-medium text-foreground">
                  Data Shared
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                {
                  provider: "Google Gemini (Genkit)",
                  purpose:
                    "AI resume parsing, ATS scoring, cover letter generation, candidate ranking, interview prep, skill gap analysis, salary insights, LinkedIn optimization",
                  data: "Resume text, job descriptions, user-submitted prompts",
                },
                {
                  provider: "Firebase (Google)",
                  purpose:
                    "Firestore database, user authentication (Google OAuth), file storage",
                  data: "Account data, professional profile data, application records, encrypted chat ciphertext",
                },
                {
                  provider: "Cloudinary",
                  purpose:
                    "Profile image hosting, transformation, and CDN delivery",
                  data: "Profile pictures and permitted media uploads",
                },
                {
                  provider: "Stripe",
                  purpose: "Subscription billing and payment processing",
                  data: "Plan selection and billing email. Raw card data is processed exclusively by Stripe — CareerCompass never stores card numbers.",
                },
                {
                  provider: "Brevo",
                  purpose: "Transactional email delivery via SMTP",
                  data: "Email address, name, application status content, welcome email content",
                },
              ].map(({ provider, purpose, data }) => (
                <tr
                  key={provider}
                  className="bg-card hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {provider}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{purpose}</td>
                  <td className="px-4 py-3 text-muted-foreground">{data}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    ),
  },
  {
    id: "data-protection",
    icon: <Shield className="w-4 h-4" />,
    title: "Data Protection",
    content: (
      <p className="text-muted-foreground">
        We take data protection seriously and implement industry-standard
        security measures to safeguard your information. Your password is stored
        securely using encryption, and we use secure connections (SSL/TLS) to
        protect data transmission. However, no method of transmission over the
        internet or electronic storage is 100% secure, so we cannot guarantee
        absolute security.
      </p>
    ),
  },
  {
    id: "data-retention",
    icon: <Clock className="w-4 h-4" />,
    title: "Data Retention & Deletion",
    content: (
      <p className="text-muted-foreground">
        We retain your personal data as long as your account is active or as
        needed to provide you with our services. You can request the deletion of
        your account and personal data at any time by contacting us. Upon
        deletion, your data will be removed from our active systems, but we may
        retain certain information as required by law or for legitimate business
        purposes.
      </p>
    ),
  },
  {
    id: "your-rights",
    icon: <ShieldCheck className="w-4 h-4" />,
    title: "Your Rights",
    content: (
      <p className="text-muted-foreground">
        You have certain rights regarding your personal data, including the
        right to access, correct, or delete your information. You can update
        your profile information at any time through your account settings. If
        you wish to exercise any other rights or have any concerns about your
        data, please contact us.
      </p>
    ),
  },
  {
    id: "changes-to-policy",
    icon: <RefreshCcw className="w-4 h-4" />,
    title: "Changes to Policy",
    content: (
      <p className="text-muted-foreground">
        We may update this Privacy Policy from time to time to reflect changes
        in our practices or for other operational, legal, or regulatory reasons.
        We will notify you of any significant changes by posting the new policy
        on our website and updating the "Last Updated" date above. We encourage
        you to review this policy periodically to stay informed about how we
        protect your information.
      </p>
    ),
  },
  {
    id: "contact",
    icon: <Mail className="w-4 h-4" />,
    title: "Contact",
    content: (
      <div className="space-y-3">
        <p className="text-muted-foreground">
          If you have any questions, concerns, or complaints about this Privacy
          Policy or our data practices:
        </p>
        <Link
          href="https://github.com/arsh342/careercompass"
          className="inline-block px-4 py-2 bg-primary text-white rounded-md font-medium hover:bg-primary/80 transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          Contact us via GitHub
        </Link>
      </div>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <div className="h-screen overflow-y-auto bg-background">
      {/* Hero */}
      <div className="border-b border-border bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <ScrollText className="w-6 h-6 text-primary" />
              </div>
              <div className="h-px flex-1 bg-border" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-3">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl">
              This Privacy Policy explains how CareerCompass collects, uses, and
              protects your information when you use our platform.
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-6 text-sm text-muted-foreground">
              <span>
                Last updated:{" "}
                <strong className="text-foreground">{LAST_UPDATED}</strong>
              </span>
              <span className="hidden sm:block">·</span>
              <span>
                Also see:{" "}
                <Link
                  href="/terms"
                  className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
                >
                  Terms of Service
                </Link>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="grid lg:grid-cols-[220px_1fr] gap-10">
          {/* Sidebar TOC */}
          <aside className="hidden lg:block">
            <nav className="sticky top-8 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                Contents
              </p>
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-1.5 px-2 rounded-md hover:bg-muted/50"
                >
                  <span className="text-primary/70">{s.icon}</span>
                  <span>{s.title}</span>
                </a>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <main className="space-y-12">
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} className="scroll-mt-8">
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-primary">{s.icon}</span>
                    <h2 className="text-xl font-semibold text-foreground">
                      {s.title}
                    </h2>
                  </div>
                </div>
                {s.content}
              </section>
            ))}

            <div className="pt-6 border-t border-border text-center text-sm text-muted-foreground">
              <p>
                By using CareerCompass, you acknowledge that you have read and
                understood this Privacy Policy.
              </p>
              <p className="mt-1">
                © {new Date().getFullYear()} CareerCompass. All rights reserved.
              </p>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
