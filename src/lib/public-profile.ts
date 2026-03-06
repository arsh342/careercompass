export interface PublicProfileInput {
  uid: string;
  displayName?: string;
  role?: string;
  photoURL?: string | null;
  firstName?: string;
  lastName?: string;
  headline?: string;
  location?: string;
  companyName?: string;
  company?: string;
  companyOverview?: string;
  bio?: string;
  education?: string;
  skills?: string;
  interests?: string;
  careerGoals?: string;
  employmentHistory?: string;
  portfolioLink?: string;
  linkedinLink?: string;
  githubLink?: string;
  twitterLink?: string;
  websiteLink?: string;
  industry?: string;
  companySize?: string;
  founded?: string;
  benefits?: string[];
  culture?: string;
  supportEmail?: string;
  contactNumber?: string;
  followers?: string[];
  following?: string[];
  coverPhoto?: string;
  encryptionPublicKey?: string;
  portfolioProjects?: Array<{
    title: string;
    description: string;
    url: string;
    imageUrl?: string;
  }>;
}

export function toPublicProfile(input: PublicProfileInput): Record<string, any> {
  return {
    uid: input.uid,
    displayName: input.displayName || "",
    role: input.role || "employee",
    photoURL: input.photoURL || "",
    firstName: input.firstName || "",
    lastName: input.lastName || "",
    headline: input.headline || "",
    location: input.location || "",
    companyName: input.companyName || "",
    company: input.company || "",
    companyOverview: input.companyOverview || "",
    bio: input.bio || "",
    education: input.education || "",
    skills: input.skills || "",
    interests: input.interests || "",
    careerGoals: input.careerGoals || "",
    employmentHistory: input.employmentHistory || "",
    portfolioLink: input.portfolioLink || "",
    linkedinLink: input.linkedinLink || "",
    githubLink: input.githubLink || "",
    twitterLink: input.twitterLink || "",
    websiteLink: input.websiteLink || "",
    industry: input.industry || "",
    companySize: input.companySize || "",
    founded: input.founded || "",
    benefits: input.benefits || [],
    culture: input.culture || "",
    supportEmail: input.supportEmail || "",
    contactNumber: input.contactNumber || "",
    followers: input.followers || [],
    following: input.following || [],
    coverPhoto: input.coverPhoto || "",
    encryptionPublicKey: input.encryptionPublicKey || "",
    portfolioProjects: input.portfolioProjects || [],
    updatedAt: new Date().toISOString(),
  };
}
