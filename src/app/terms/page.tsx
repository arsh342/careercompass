"use client";

import Link from "next/link";
import {
  ScrollText,
  UserCheck,
  Bot,
  CreditCard,
  MessageSquare,
  ShieldAlert,
  Scale,
  Mail,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";

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
    icon: <ScrollText className="w-5 h-5" />,
    title: "Introduction",
    content: (
      <div className="space-y-4">
        <p>
          Welcome to CareerCompass! These Terms of Service govern your use of
          our platform, including all AI-powered tools, communication features,
          and subscription services. By accessing or using CareerCompass, you
          agree to comply with these terms.
        </p>
        <p>
          If you do not agree with any part of these terms, you must not use our
          platform. We may update these terms from time to time, and your
          continued use of the platform constitutes acceptance of the updated
          terms.
        </p>
      </div>
    ),
  },
  {
    id: "user-responsibilities",
    icon: <UserCheck className="w-5 h-5" />,
    title: "User Responsibilities",
    content: (
      <div className="space-y-4">
        <p>
          As a user of CareerCompass, you are responsible for maintaining the
          confidentiality of your account information, including your password.
          You agree to provide accurate and complete information during the
          registration and profile completion processes.
        </p>
        <p>
          You are solely responsible for all activities that occur under your
          account. If you suspect any unauthorized use of your account, you must
          notify us immediately. We are not liable for any loss or damage
          arising from your failure to comply with these responsibilities.
        </p>
      </div>
    ),
  },
  {
    id: "acceptable-use",
    icon: <ShieldAlert className="w-5 h-5" />,
    title: "Acceptable Use",
    content: (
      <div className="space-y-4">
        <p>
          You agree to use CareerCompass for lawful purposes only and in a
          manner that does not infringe the rights of or restrict the use of the
          platform by any third party.
        </p>
        <p>Prohibited activities include, but are not limited to:</p>
        <ul className="list-disc ml-6">
          <li>
            Uploading or sharing unlawful, offensive, or infringing content
          </li>
          <li>
            Attempting to gain unauthorized access to the platform or its
            related systems or networks
          </li>
          <li>Interfering with the security or integrity of the platform</li>
          <li>
            Using the platform to transmit any viruses, worms, or other harmful
            code
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: "account-termination",
    icon: <CreditCard className="w-5 h-5" />,
    title: "Account Termination",
    content: (
      <div className="space-y-4">
        <p>
          We may suspend or terminate your account at any time, without prior
          notice or liability, for conduct that we believe violates these Terms
          of Service or is harmful to other users of the platform, us, or third
          parties, or for any other reason.
        </p>
        <p>
          Upon termination, your right to use the platform will immediately
          cease. If you wish to terminate your account, you may simply
          discontinue using the platform.
        </p>
      </div>
    ),
  },
  {
    id: "platform-description",
    icon: <ScrollText className="w-5 h-5" />,
    title: "Platform Description",
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground leading-relaxed">
          CareerCompass is a dual-sided, AI-powered career management platform
          that connects job seekers and employers. The platform includes:
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            {
              category: "For Job Seekers",
              items: [
                "AI job matching and personalized recommendations",
                "Resume builder and ATS compatibility scoring",
                "AI-generated cover letters and profile summaries",
                "Interview preparation with role-specific questions",
                "Skill gap analysis and salary negotiation insights",
                "LinkedIn profile optimization",
                "Application tracking dashboard",
                "End-to-end encrypted chat with employers",
              ],
            },
            {
              category: "For Employers",
              items: [
                "AI-powered candidate ranking and discovery",
                "Smart job posting with AI-enhanced descriptions",
                "Kanban-style applicant pipeline management",
                "Bulk candidate outreach",
                "Recruitment analytics and hiring metrics",
                "End-to-end encrypted communication with candidates",
                "Automated application status emails",
                "Multi-user team collaboration tools",
              ],
            },
          ].map(({ category, items }) => (
            <div
              key={category}
              className="p-4 rounded-lg border border-border bg-card"
            >
              <p className="font-semibold text-foreground text-sm mb-3">
                {category}
              </p>
              <ul className="space-y-1.5">
                {items.map((item) => (
                  <li
                    key={item}
                    className="flex gap-2 text-sm text-muted-foreground"
                  >
                    <ChevronRight className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground p-4 rounded-lg bg-muted/50 border border-border/50">
          <strong className="text-foreground">Role isolation:</strong> Job
          Seeker accounts cannot access employer-side candidate pipelines,
          rankings, or evaluation data. Employer accounts cannot access other
          employers' candidate data or job seeker private profile information
          beyond what the job seeker has explicitly submitted in an application.
        </p>
        <p className="text-sm text-muted-foreground">
          We reserve the right to modify, add, or remove features at any time.
          Material changes that significantly affect your use of the platform
          will be communicated via email or in-app notice.
        </p>
      </div>
    ),
  },
  {
    id: "ai-disclaimer",
    icon: <Bot className="w-5 h-5" />,
    title: "AI Tools — Disclaimer & Limitations",
    content: (
      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-foreground leading-relaxed">
            CareerCompass integrates <strong>Google Gemini 2.5 Flash</strong>{" "}
            via the Genkit framework across 17 AI flows. All outputs are{" "}
            <strong>advisory tools only</strong> and do not constitute
            professional career, legal, financial, or hiring advice.
          </p>
        </div>
        {[
          {
            label: "No Employment Guarantee",
            detail:
              "ATS scores, job match rankings, cover letters, interview question sets, salary estimates, and all other AI-generated outputs are guidance only. CareerCompass makes no representation or warranty regarding interview outcomes, job placement success, or hiring decisions.",
          },
          {
            label: "Content Accuracy",
            detail:
              "AI-generated content may contain factual errors, hallucinations, or inappropriate suggestions. You are solely responsible for reviewing, editing, and verifying all AI-generated content before submitting it to any employer or third party.",
          },
          {
            label: "Employer Responsibility",
            detail:
              "AI candidate ranking is a decision-support tool only. Employers are solely and exclusively responsible for their final hiring decisions. You may not delegate hiring responsibility to any algorithmic output produced by this platform.",
          },
          {
            label: "Non-Discriminatory Use",
            detail:
              "Employers must not use AI ranking, scoring, or candidate discovery features to discriminate on the basis of race, gender, age, religion, national origin, disability, sexual orientation, or any other characteristic protected under applicable law.",
          },
          {
            label: "Data Sent to AI",
            detail:
              "By using AI features, you consent to relevant text (resume content, job descriptions, prompts) being processed by Google Gemini. Do not submit sensitive personal data beyond what the specific feature requires. Google's data handling is governed by their own terms and privacy policy.",
          },
        ].map(({ label, detail }) => (
          <div
            key={label}
            className="flex gap-3 p-4 rounded-lg bg-muted/50 border border-border/50"
          >
            <Bot className="w-4 h-4 mt-0.5 text-primary shrink-0" />
            <div>
              <span className="font-medium text-foreground text-sm">
                {label}:{" "}
              </span>
              <span className="text-muted-foreground text-sm leading-relaxed">
                {detail}
              </span>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "subscriptions-payments",
    icon: <CreditCard className="w-5 h-5" />,
    title: "Subscriptions & Payments",
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground leading-relaxed">
          Certain platform features require an active paid subscription.
          Subscriptions are billed and managed through Stripe.
        </p>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-foreground">
                  Topic
                </th>
                <th className="text-left px-4 py-3 font-medium text-foreground">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                {
                  topic: "Available Plans",
                  detail:
                    "Starter, Pro, Business, and Premium — available on monthly or yearly billing cycles. Plan features differ by role (Job Seeker vs. Employer).",
                },
                {
                  topic: "Billing Authorization",
                  detail:
                    "By subscribing, you authorize CareerCompass to charge your payment method on a recurring basis at the interval selected. Charges are processed via Stripe.",
                },
                {
                  topic: "Rate Limiting",
                  detail:
                    "Checkout sessions and payment-related API endpoints are rate-limited to prevent abuse.",
                },
                {
                  topic: "Cancellation",
                  detail:
                    "Cancel any time via Settings → Billing. Cancellation takes effect at the end of the current billing period; access continues until then.",
                },
                {
                  topic: "Refunds",
                  detail:
                    "No refunds are issued for partial billing periods unless mandated by applicable law. Contact arsth134@gmail.com for exceptional circumstances.",
                },
                {
                  topic: "Price Changes",
                  detail:
                    "Pricing may be modified with at least 30 days' notice via email or in-app notification. Continued use after the effective date constitutes acceptance.",
                },
                {
                  topic: "Failed Payments",
                  detail:
                    "Failed payments will result in suspension of premium features until the outstanding balance is resolved.",
                },
              ].map(({ topic, detail }) => (
                <tr
                  key={topic}
                  className="bg-card hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-foreground align-top w-40">
                    {topic}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground leading-relaxed">
                    {detail}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    ),
  },
  {
    id: "liability",
    icon: <Scale className="w-5 h-5" />,
    title: "Limitation of Liability & Disclaimers",
    content: (
      <div className="space-y-4">
        <div className="p-4 rounded-lg border border-border bg-muted/50">
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong className="text-foreground">
              Disclaimer of Warranties:
            </strong>{" "}
            The Platform is provided "AS IS" and "AS AVAILABLE" without warranty
            of any kind. To the maximum extent permitted by applicable law,
            CareerCompass expressly disclaims all warranties, express or
            implied, including but not limited to implied warranties of
            merchantability, fitness for a particular purpose, and
            non-infringement.
          </p>
        </div>
        <div className="p-4 rounded-lg border border-border bg-muted/50">
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong className="text-foreground">
              Limitation of Liability:
            </strong>{" "}
            To the maximum extent permitted by applicable law, CareerCompass and
            its affiliates shall not be liable for any indirect, incidental,
            special, consequential, or punitive damages, or any loss of profits,
            revenue, data, goodwill, or other intangible losses, resulting from:
            (a) your access to or use of or inability to access or use the
            Platform; (b) any conduct or content of any third party on the
            Platform; (c) AI-generated content used in job applications or
            hiring decisions; (d) unauthorized access, use, or alteration of
            your transmissions or content; or (e) any interruption or cessation
            of the service.
          </p>
        </div>
        <div className="p-4 rounded-lg border border-border bg-muted/50">
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Third-Party Services:</strong>{" "}
            CareerCompass integrates third-party services including Google
            Gemini, Firebase, Stripe, Cloudinary, and Brevo. We are not
            responsible for the availability, accuracy, or conduct of these
            third-party services. Your use of third-party services is subject to
            their respective terms and privacy policies.
          </p>
        </div>
        <div className="p-4 rounded-lg border border-border bg-muted/50">
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong className="text-foreground">
              Aggregate Liability Cap:
            </strong>{" "}
            CareerCompass's total aggregate liability to you for all claims
            arising out of or relating to these Terms or your use of the
            Platform shall not exceed the greater of (a) the total amount you
            paid to us in the 12 months preceding the claim, or (b) USD $100.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "indemnification",
    icon: <ShieldAlert className="w-5 h-5" />,
    title: "Indemnification",
    content: (
      <p className="text-muted-foreground leading-relaxed">
        You agree to defend, indemnify, and hold harmless CareerCompass, its
        affiliates, and their respective officers, directors, employees, and
        agents from and against any claims, liabilities, damages, losses, costs,
        or expenses (including reasonable legal fees) arising out of or relating
        to: (a) your violation of these Terms; (b) your use of the Platform in a
        manner not expressly authorized; (c) content you upload or submit,
        including resumes, job postings, or messages; or (d) your violation of
        any applicable law or third-party right.
      </p>
    ),
  },
  {
    id: "changes",
    icon: <ChevronRight className="w-5 h-5" />,
    title: "Changes to Terms",
    content: (
      <div className="space-y-4">
        <p>
          We may update these Terms of Service from time to time. All changes
          will be posted on this page with an updated effective date. You are
          advised to review these terms periodically for any changes. Changes to
          these terms are effective when they are posted on this page.
        </p>
        <p>
          Your continued use of the platform after any changes to these terms
          constitutes your acceptance of the new terms.
        </p>
      </div>
    ),
  },
  {
    id: "contact",
    icon: <AlertTriangle className="w-5 h-5" />,
    title: "Contact Us",
    content: (
      <div className="space-y-3">
        <p className="text-muted-foreground">
          If you have any questions about these Terms of Service:
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

export default function TermsPage() {
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
              Terms of Service
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl">
              These Terms govern your access to and use of the CareerCompass
              platform, including all AI-powered tools, communication features,
              and subscription services.
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
                  href="/privacy-policy"
                  className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
                >
                  Privacy Policy
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
                By using CareerCompass, you acknowledge that you have read,
                understood, and agreed to these Terms of Service.
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
