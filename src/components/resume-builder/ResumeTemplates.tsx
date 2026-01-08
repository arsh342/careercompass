"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Resume } from "@/types/resume-types";
import { Separator } from "@/components/ui/separator";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Linkedin, 
  Github, 
  Globe,
  Calendar,
  ExternalLink,
} from "lucide-react";

// ============================================
// TEMPLATE TYPES
// ============================================

export type TemplateId = 
  | 'modern' 
  | 'classic' 
  | 'minimal' 
  | 'creative' 
  | 'professional' 
  | 'elegant'
  | 'tech'
  | 'executive';

export interface TemplateConfig {
  id: TemplateId;
  name: string;
  description: string;
  preview: string; // Gradient colors for preview
  bestFor: string[];
}

export const TEMPLATES: TemplateConfig[] = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean and contemporary design with accent colors',
    preview: 'from-blue-500 to-purple-500',
    bestFor: ['Tech', 'Startups', 'Creative'],
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional layout trusted by recruiters',
    preview: 'from-gray-600 to-gray-800',
    bestFor: ['Corporate', 'Finance', 'Legal'],
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Simple and elegant with focus on content',
    preview: 'from-neutral-400 to-neutral-600',
    bestFor: ['Design', 'Writing', 'Consulting'],
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Bold design with personality and flair',
    preview: 'from-pink-500 to-orange-500',
    bestFor: ['Design', 'Marketing', 'Media'],
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Polished look for senior positions',
    preview: 'from-slate-700 to-slate-900',
    bestFor: ['Management', 'Enterprise', 'Healthcare'],
  },
  {
    id: 'elegant',
    name: 'Elegant',
    description: 'Sophisticated design with subtle accents',
    preview: 'from-emerald-500 to-teal-600',
    bestFor: ['Luxury', 'Fashion', 'Architecture'],
  },
  {
    id: 'tech',
    name: 'Tech',
    description: 'Developer-focused with code aesthetics',
    preview: 'from-cyan-500 to-blue-600',
    bestFor: ['Engineering', 'DevOps', 'Data Science'],
  },
  {
    id: 'executive',
    name: 'Executive',
    description: 'Premium design for C-level executives',
    preview: 'from-amber-600 to-yellow-700',
    bestFor: ['C-Suite', 'Board', 'Directors'],
  },
];

// ============================================
// TEMPLATE SELECTOR
// ============================================

interface TemplateSelectorProps {
  selectedTemplate: TemplateId;
  onSelect: (template: TemplateId) => void;
}

export function TemplateSelector({ selectedTemplate, onSelect }: TemplateSelectorProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {TEMPLATES.map((template) => (
        <button
          key={template.id}
          onClick={() => onSelect(template.id)}
          className={cn(
            "relative rounded-lg border-2 p-3 text-left transition-all hover:shadow-md",
            selectedTemplate === template.id
              ? "border-primary bg-primary/5 shadow-md"
              : "border-muted hover:border-muted-foreground/30"
          )}
        >
          {/* Preview gradient */}
          <div 
            className={cn(
              "h-16 rounded-md bg-gradient-to-br mb-2",
              template.preview
            )}
          />
          <h4 className="font-medium text-sm">{template.name}</h4>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            {template.description}
          </p>
          {selectedTemplate === template.id && (
            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
          )}
        </button>
      ))}
    </div>
  );
}

// ============================================
// TEMPLATE STYLES
// ============================================

const templateStyles: Record<TemplateId, {
  container: string;
  header: string;
  headerName: string;
  headerTitle: string;
  headerContact: string;
  sectionTitle: string;
  sectionContent: string;
  separator: string;
  bullet: string;
  skillBadge: string;
  accentColor: string;
}> = {
  modern: {
    container: "bg-white text-gray-900",
    header: "text-center pb-4 border-b-2 border-blue-500",
    headerName: "text-3xl font-bold text-gray-900",
    headerTitle: "text-lg text-blue-600 font-medium mt-1",
    headerContact: "text-sm text-gray-600 mt-2 flex flex-wrap justify-center gap-4",
    sectionTitle: "text-lg font-bold text-blue-600 uppercase tracking-wide border-b border-blue-200 pb-1 mb-3",
    sectionContent: "text-gray-700",
    separator: "my-4",
    bullet: "text-blue-500",
    skillBadge: "bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-sm",
    accentColor: "blue",
  },
  classic: {
    container: "bg-white text-gray-900",
    header: "text-center pb-4 border-b border-gray-300",
    headerName: "text-2xl font-serif font-bold text-gray-900 uppercase tracking-wider",
    headerTitle: "text-base text-gray-700 mt-1",
    headerContact: "text-sm text-gray-600 mt-2 flex flex-wrap justify-center gap-4",
    sectionTitle: "text-base font-bold text-gray-900 uppercase tracking-wide border-b-2 border-gray-800 pb-1 mb-3",
    sectionContent: "text-gray-700",
    separator: "my-4",
    bullet: "text-gray-800",
    skillBadge: "bg-gray-100 text-gray-800 px-2 py-0.5 rounded text-sm",
    accentColor: "gray",
  },
  minimal: {
    container: "bg-white text-gray-800",
    header: "pb-4",
    headerName: "text-2xl font-light text-gray-900",
    headerTitle: "text-base text-gray-500 mt-1",
    headerContact: "text-sm text-gray-500 mt-2 flex flex-wrap gap-4",
    sectionTitle: "text-sm font-medium text-gray-400 uppercase tracking-widest mb-3",
    sectionContent: "text-gray-600",
    separator: "my-6 border-gray-100",
    bullet: "text-gray-400",
    skillBadge: "text-gray-600 text-sm",
    accentColor: "gray",
  },
  creative: {
    container: "bg-gradient-to-br from-white to-pink-50 text-gray-900",
    header: "text-center pb-4 border-b-4 border-gradient-to-r from-pink-500 to-orange-500",
    headerName: "text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-orange-500",
    headerTitle: "text-lg text-gray-700 font-medium mt-1",
    headerContact: "text-sm text-gray-600 mt-2 flex flex-wrap justify-center gap-4",
    sectionTitle: "text-lg font-bold text-pink-600 mb-3",
    sectionContent: "text-gray-700",
    separator: "my-4 border-pink-200",
    bullet: "text-pink-500",
    skillBadge: "bg-gradient-to-r from-pink-100 to-orange-100 text-pink-800 px-2 py-0.5 rounded-full text-sm",
    accentColor: "pink",
  },
  professional: {
    container: "bg-white text-gray-900",
    header: "pb-4 border-b-2 border-slate-800",
    headerName: "text-2xl font-bold text-slate-900",
    headerTitle: "text-base text-slate-600 font-medium mt-1",
    headerContact: "text-sm text-slate-500 mt-2 flex flex-wrap gap-4",
    sectionTitle: "text-base font-semibold text-slate-800 uppercase tracking-wide border-l-4 border-slate-800 pl-3 mb-3",
    sectionContent: "text-slate-700",
    separator: "my-4",
    bullet: "text-slate-700",
    skillBadge: "bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-sm",
    accentColor: "slate",
  },
  elegant: {
    container: "bg-white text-gray-900",
    header: "text-center pb-6 border-b border-emerald-300",
    headerName: "text-3xl font-light text-gray-900 tracking-wide",
    headerTitle: "text-lg text-emerald-600 font-light mt-2 italic",
    headerContact: "text-sm text-gray-500 mt-3 flex flex-wrap justify-center gap-4",
    sectionTitle: "text-base text-emerald-700 font-medium tracking-widest uppercase mb-3",
    sectionContent: "text-gray-600 leading-relaxed",
    separator: "my-5 border-emerald-100",
    bullet: "text-emerald-600",
    skillBadge: "border border-emerald-300 text-emerald-700 px-2 py-0.5 rounded text-sm",
    accentColor: "emerald",
  },
  tech: {
    container: "bg-slate-900 text-gray-100",
    header: "pb-4 border-b border-cyan-500/50",
    headerName: "text-2xl font-mono font-bold text-cyan-400",
    headerTitle: "text-base text-gray-400 font-mono mt-1",
    headerContact: "text-sm text-gray-500 mt-2 flex flex-wrap gap-4 font-mono",
    sectionTitle: "text-base font-mono font-bold text-cyan-400 mb-3 flex items-center gap-2 before:content-['//'] before:text-cyan-600",
    sectionContent: "text-gray-300",
    separator: "my-4 border-slate-700",
    bullet: "text-cyan-500",
    skillBadge: "bg-cyan-900/50 text-cyan-300 px-2 py-0.5 rounded font-mono text-sm border border-cyan-700/50",
    accentColor: "cyan",
  },
  executive: {
    container: "bg-white text-gray-900",
    header: "text-center pb-6 border-b-4 border-amber-500",
    headerName: "text-3xl font-serif font-bold text-gray-900",
    headerTitle: "text-lg text-amber-700 font-medium mt-2",
    headerContact: "text-sm text-gray-600 mt-3 flex flex-wrap justify-center gap-4",
    sectionTitle: "text-base font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2 after:flex-1 after:h-px after:bg-amber-300",
    sectionContent: "text-gray-700",
    separator: "my-5",
    bullet: "text-amber-600",
    skillBadge: "bg-amber-50 text-amber-800 px-2 py-0.5 rounded text-sm border border-amber-200",
    accentColor: "amber",
  },
};

// ============================================
// RESUME PREVIEW COMPONENT
// ============================================

interface ResumePreviewProps {
  resume: Resume;
  templateId: TemplateId;
  className?: string;
}

export function ResumePreview({ resume, templateId, className }: ResumePreviewProps) {
  const styles = templateStyles[templateId] || templateStyles.modern;

  return (
    <div className={cn("p-8 space-y-6", styles.container, className)}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.headerName}>
          {resume.header.fullName || "Your Name"}
        </h2>
        <p className={styles.headerTitle}>
          {resume.header.jobTitle || "Professional Title"}
        </p>
        <div className={styles.headerContact}>
          {resume.header.email && (
            <span className="flex items-center gap-1">
              <Mail className="w-3 h-3" />
              {resume.header.email}
            </span>
          )}
          {resume.header.phone && (
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3" />
              {resume.header.phone}
            </span>
          )}
          {resume.header.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {resume.header.location}
            </span>
          )}
          {resume.header.linkedin && (
            <span className="flex items-center gap-1">
              <Linkedin className="w-3 h-3" />
              {resume.header.linkedin.replace('https://linkedin.com/in/', '')}
            </span>
          )}
          {resume.header.github && (
            <span className="flex items-center gap-1">
              <Github className="w-3 h-3" />
              {resume.header.github.replace('https://github.com/', '')}
            </span>
          )}
          {resume.header.portfolio && (
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3" />
              Portfolio
            </span>
          )}
        </div>
      </div>

      {/* Summary */}
      {resume.summary && resume.enabledSections.includes('summary') && (
        <>
          <div>
            <h3 className={styles.sectionTitle}>Professional Summary</h3>
            <p className={styles.sectionContent}>{resume.summary}</p>
          </div>
          <Separator className={styles.separator} />
        </>
      )}

      {/* Skills */}
      {resume.enabledSections.includes('skills') && 
       (resume.skills.technical.length > 0 || resume.skills.coreCompetencies.length > 0) && (
        <>
          <div>
            <h3 className={styles.sectionTitle}>Skills</h3>
            <div className="space-y-2">
              {resume.skills.technical.length > 0 && (
                <div>
                  <span className="font-medium text-sm">Technical: </span>
                  <span className="flex flex-wrap gap-1 mt-1">
                    {resume.skills.technical.map((skill, i) => (
                      <span key={i} className={styles.skillBadge}>{skill}</span>
                    ))}
                  </span>
                </div>
              )}
              {resume.skills.coreCompetencies.length > 0 && (
                <div>
                  <span className="font-medium text-sm">Core Competencies: </span>
                  <span className="flex flex-wrap gap-1 mt-1">
                    {resume.skills.coreCompetencies.map((skill, i) => (
                      <span key={i} className={styles.skillBadge}>{skill}</span>
                    ))}
                  </span>
                </div>
              )}
              {resume.skills.tools && resume.skills.tools.length > 0 && (
                <div>
                  <span className="font-medium text-sm">Tools: </span>
                  <span className="flex flex-wrap gap-1 mt-1">
                    {resume.skills.tools.map((skill, i) => (
                      <span key={i} className={styles.skillBadge}>{skill}</span>
                    ))}
                  </span>
                </div>
              )}
            </div>
          </div>
          <Separator className={styles.separator} />
        </>
      )}

      {/* Experience */}
      {resume.enabledSections.includes('experience') && resume.experience.length > 0 && (
        <>
          <div>
            <h3 className={styles.sectionTitle}>Work Experience</h3>
            <div className="space-y-4">
              {resume.experience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{exp.jobTitle}</h4>
                      <p className={cn("text-sm", styles.sectionContent)}>
                        {exp.company} | {exp.location}
                      </p>
                    </div>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                    </span>
                  </div>
                  {exp.bullets.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {exp.bullets.map((bullet) => (
                        <li key={bullet.id} className={cn("flex gap-2 text-sm", styles.sectionContent)}>
                          <span className={styles.bullet}>•</span>
                          {bullet.text}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
          <Separator className={styles.separator} />
        </>
      )}

      {/* Projects */}
      {resume.enabledSections.includes('projects') && resume.projects.length > 0 && (
        <>
          <div>
            <h3 className={styles.sectionTitle}>Projects</h3>
            <div className="space-y-4">
              {resume.projects.map((project) => (
                <div key={project.id}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold flex items-center gap-2">
                        {project.name}
                        {project.liveUrl && (
                          <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </h4>
                      {project.techStack.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {project.techStack.map((tech, i) => (
                            <span key={i} className={styles.skillBadge}>{tech}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {project.description && (
                    <p className={cn("text-sm mt-1", styles.sectionContent)}>{project.description}</p>
                  )}
                  {project.bullets.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {project.bullets.map((bullet, i) => (
                        <li key={i} className={cn("flex gap-2 text-sm", styles.sectionContent)}>
                          <span className={styles.bullet}>•</span>
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
          <Separator className={styles.separator} />
        </>
      )}

      {/* Education */}
      {resume.enabledSections.includes('education') && resume.education.length > 0 && (
        <>
          <div>
            <h3 className={styles.sectionTitle}>Education</h3>
            <div className="space-y-3">
              {resume.education.map((edu) => (
                <div key={edu.id} className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{edu.degree} in {edu.fieldOfStudy}</h4>
                    <p className={cn("text-sm", styles.sectionContent)}>
                      {edu.institution} | {edu.location}
                    </p>
                    {edu.gpa && <p className="text-sm text-muted-foreground">GPA: {edu.gpa}</p>}
                  </div>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {edu.startDate} - {edu.endDate}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <Separator className={styles.separator} />
        </>
      )}

      {/* Certifications */}
      {resume.enabledSections.includes('certifications') && resume.certifications.length > 0 && (
        <div>
          <h3 className={styles.sectionTitle}>Certifications</h3>
          <div className="space-y-2">
            {resume.certifications.map((cert) => (
              <div key={cert.id} className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{cert.name}</h4>
                  <p className={cn("text-sm", styles.sectionContent)}>{cert.issuingBody}</p>
                </div>
                <span className="text-sm text-muted-foreground">{cert.issueDate}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Languages */}
      {resume.enabledSections.includes('languages') && resume.languages.length > 0 && (
        <div>
          <h3 className={styles.sectionTitle}>Languages</h3>
          <div className="flex flex-wrap gap-2">
            {resume.languages.map((lang) => (
              <span key={lang.id} className={styles.skillBadge}>
                {lang.language} ({lang.proficiency})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ResumePreview;
