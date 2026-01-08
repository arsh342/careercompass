/**
 * Professional Resume Builder - Type Definitions
 * Industry-standard resume schema with section control
 */

// ============================================
// SECTION TYPES
// ============================================

export interface HeaderSection {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  website?: string;
}

export interface SkillEntry {
  name: string;
  category: 'technical' | 'soft' | 'tool' | 'language';
  proficiency?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface SkillsSection {
  technical: string[];
  coreCompetencies: string[];
  tools?: string[];
}

export interface ExperienceEntry {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: BulletPoint[];
}

export interface BulletPoint {
  id: string;
  text: string;
  actionVerb?: string;
  metric?: string;
}

export interface ProjectEntry {
  id: string;
  name: string;
  techStack: string[];
  description: string;
  bullets: string[];
  liveUrl?: string;
  githubUrl?: string;
}

export interface EducationEntry {
  id: string;
  degree: string;
  fieldOfStudy: string;
  institution: string;
  location: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  coursework?: string[];
  honors?: string[];
}

export interface CertificationEntry {
  id: string;
  name: string;
  issuingBody: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
}

export interface AchievementEntry {
  id: string;
  title: string;
  description: string;
  year: string;
}

export interface PublicationEntry {
  id: string;
  title: string;
  journal: string;
  year: string;
  url?: string;
  authors?: string;
}

export interface VolunteeringEntry {
  id: string;
  role: string;
  organization: string;
  description: string;
  startDate: string;
  endDate: string;
}

export interface LanguageEntry {
  id: string;
  language: string;
  proficiency: 'native' | 'fluent' | 'professional' | 'basic';
}

export interface CustomSection {
  id: string;
  title: string;
  entries: CustomSectionEntry[];
}

export interface CustomSectionEntry {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  date?: string;
  url?: string;
}

// ============================================
// SECTION CONFIGURATION
// ============================================

export type SectionId = 
  | 'header'
  | 'summary'
  | 'skills'
  | 'experience'
  | 'projects'
  | 'education'
  | 'certifications'
  | 'achievements'
  | 'internships'
  | 'publications'
  | 'volunteering'
  | 'languages'
  | 'interests'
  | 'custom';

export interface SectionConfig {
  id: SectionId;
  label: string;
  icon: string;
  defaultEnabled: boolean;
  removable: boolean;
  mandatory: boolean;
  conditionalWith?: SectionId; // For experience/projects conditional rule
}

export const SECTION_CONFIGS: Record<SectionId, SectionConfig> = {
  header: {
    id: 'header',
    label: 'Contact Information',
    icon: 'User',
    defaultEnabled: true,
    removable: false,
    mandatory: true,
  },
  summary: {
    id: 'summary',
    label: 'Professional Summary',
    icon: 'FileText',
    defaultEnabled: true,
    removable: true,
    mandatory: false,
  },
  skills: {
    id: 'skills',
    label: 'Skills',
    icon: 'Code',
    defaultEnabled: true,
    removable: false,
    mandatory: true,
  },
  experience: {
    id: 'experience',
    label: 'Work Experience',
    icon: 'Briefcase',
    defaultEnabled: true,
    removable: true,
    mandatory: false,
    conditionalWith: 'projects',
  },
  projects: {
    id: 'projects',
    label: 'Projects',
    icon: 'FolderGit2',
    defaultEnabled: true,
    removable: true,
    mandatory: false,
    conditionalWith: 'experience',
  },
  education: {
    id: 'education',
    label: 'Education',
    icon: 'GraduationCap',
    defaultEnabled: true,
    removable: true,
    mandatory: false,
  },
  certifications: {
    id: 'certifications',
    label: 'Certifications',
    icon: 'Award',
    defaultEnabled: false,
    removable: true,
    mandatory: false,
  },
  achievements: {
    id: 'achievements',
    label: 'Achievements & Awards',
    icon: 'Trophy',
    defaultEnabled: false,
    removable: true,
    mandatory: false,
  },
  internships: {
    id: 'internships',
    label: 'Internships',
    icon: 'Building2',
    defaultEnabled: false,
    removable: true,
    mandatory: false,
  },
  publications: {
    id: 'publications',
    label: 'Publications & Research',
    icon: 'BookOpen',
    defaultEnabled: false,
    removable: true,
    mandatory: false,
  },
  volunteering: {
    id: 'volunteering',
    label: 'Volunteering',
    icon: 'Heart',
    defaultEnabled: false,
    removable: true,
    mandatory: false,
  },
  languages: {
    id: 'languages',
    label: 'Languages',
    icon: 'Globe',
    defaultEnabled: false,
    removable: true,
    mandatory: false,
  },
  interests: {
    id: 'interests',
    label: 'Interests',
    icon: 'Sparkles',
    defaultEnabled: false,
    removable: true,
    mandatory: false,
  },
  custom: {
    id: 'custom',
    label: 'Custom Section',
    icon: 'Plus',
    defaultEnabled: false,
    removable: true,
    mandatory: false,
  },
};

// ============================================
// RESUME DOCUMENT
// ============================================

export interface Resume {
  id: string;
  userId: string;
  name: string; // Resume name for user reference
  templateId: 'modern' | 'classic' | 'creative' | 'minimal' | 'professional' | 'elegant' | 'tech' | 'executive';
  
  // Section ordering (array of section IDs)
  sectionOrder: SectionId[];
  
  // Enabled sections
  enabledSections: SectionId[];
  
  // Mandatory sections
  header: HeaderSection;
  skills: SkillsSection;
  
  // Conditional sections (at least one required)
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  
  // Recommended sections
  summary: string;
  education: EducationEntry[];
  
  // Optional sections
  certifications: CertificationEntry[];
  achievements: AchievementEntry[];
  internships: ExperienceEntry[];
  publications: PublicationEntry[];
  volunteering: VolunteeringEntry[];
  languages: LanguageEntry[];
  interests: string[];
  customSections: CustomSection[];
  
  // Target job (for AI optimization)
  targetRole?: string;
  targetCompany?: string;
  jobDescription?: string;
  
  // Metadata
  atsScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// DEFAULT VALUES
// ============================================

export const DEFAULT_SECTION_ORDER: SectionId[] = [
  'header',
  'summary',
  'skills',
  'experience',
  'projects',
  'education',
  'certifications',
  'achievements',
  'internships',
  'publications',
  'volunteering',
  'languages',
  'interests',
  'custom',
];

export const DEFAULT_ENABLED_SECTIONS: SectionId[] = [
  'header',
  'summary',
  'skills',
  'experience',
  'projects',
  'education',
];

export function createEmptyResume(userId: string): Resume {
  return {
    id: crypto.randomUUID(),
    userId,
    name: 'Untitled Resume',
    templateId: 'modern',
    sectionOrder: [...DEFAULT_SECTION_ORDER],
    enabledSections: [...DEFAULT_ENABLED_SECTIONS],
    
    header: {
      fullName: '',
      jobTitle: '',
      email: '',
      phone: '',
      location: '',
    },
    
    skills: {
      technical: [],
      coreCompetencies: [],
      tools: [],
    },
    
    experience: [],
    projects: [],
    summary: '',
    education: [],
    certifications: [],
    achievements: [],
    internships: [],
    publications: [],
    volunteering: [],
    languages: [],
    interests: [],
    customSections: [],
    
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function createEmptyExperience(): ExperienceEntry {
  return {
    id: crypto.randomUUID(),
    jobTitle: '',
    company: '',
    location: '',
    startDate: '',
    endDate: '',
    current: false,
    bullets: [{ id: crypto.randomUUID(), text: '' }],
  };
}

export function createEmptyProject(): ProjectEntry {
  return {
    id: crypto.randomUUID(),
    name: '',
    techStack: [],
    description: '',
    bullets: [''],
  };
}

export function createEmptyEducation(): EducationEntry {
  return {
    id: crypto.randomUUID(),
    degree: '',
    fieldOfStudy: '',
    institution: '',
    location: '',
    startDate: '',
    endDate: '',
  };
}

export function createEmptyCertification(): CertificationEntry {
  return {
    id: crypto.randomUUID(),
    name: '',
    issuingBody: '',
    issueDate: '',
  };
}

export function createEmptyAchievement(): AchievementEntry {
  return {
    id: crypto.randomUUID(),
    title: '',
    description: '',
    year: '',
  };
}

// ============================================
// VALIDATION
// ============================================

export interface ValidationError {
  section: SectionId;
  field: string;
  message: string;
}

export function validateResume(resume: Resume): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Header validation
  if (!resume.header.fullName.trim()) {
    errors.push({ section: 'header', field: 'fullName', message: 'Full name is required' });
  }
  if (!resume.header.email.trim()) {
    errors.push({ section: 'header', field: 'email', message: 'Email is required' });
  }
  if (!resume.header.phone.trim()) {
    errors.push({ section: 'header', field: 'phone', message: 'Phone is required' });
  }
  
  // Skills validation
  if (resume.skills.technical.length === 0 && resume.skills.coreCompetencies.length === 0) {
    errors.push({ section: 'skills', field: 'technical', message: 'At least one skill is required' });
  }
  
  // Conditional: Experience OR Projects must have entries
  const hasExperience = resume.experience.length > 0 && resume.experience.some(e => e.jobTitle.trim());
  const hasProjects = resume.projects.length > 0 && resume.projects.some(p => p.name.trim());
  
  if (!hasExperience && !hasProjects) {
    errors.push({ 
      section: 'experience', 
      field: 'entries', 
      message: 'At least one work experience or project is required' 
    });
  }
  
  return errors;
}

// ============================================
// FIELD LIMITS
// ============================================

export const FIELD_LIMITS = {
  summary: 500,
  bulletPoint: 200,
  projectDescription: 300,
  achievementDescription: 200,
  skillsPerCategory: 20,
  maxExperiences: 10,
  maxProjects: 10,
  maxEducation: 5,
  maxBulletsPerExperience: 6,
} as const;
