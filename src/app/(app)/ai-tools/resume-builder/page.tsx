"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  Sparkles,
  Download,
  Copy,
  Check,
  Wand2,
  Eye,
  Edit3,
  User,
  Briefcase,
  Code,
  FolderGit2,
  GraduationCap,
  Award,
  Trophy,
  Globe,
  Settings2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LumaSpin } from "@/components/ui/luma-spin";
import { AILoader } from "@/components/ui/ai-loader";
import Link from "next/link";

import {
  Resume,
  SectionId,
  createEmptyResume,
  validateResume,
  SECTION_CONFIGS,
  DEFAULT_SECTION_ORDER,
  DEFAULT_ENABLED_SECTIONS,
} from "@/types/resume-types";

import {
  HeaderSection,
  SummarySection,
  SkillsSection,
  ExperienceSection,
  ProjectSection,
  EducationSection,
  CertificationsSection,
  AchievementsSection,
  LanguagesSection,
  InternshipsSection,
  PublicationsSection,
  VolunteeringSection,
  InterestsSection,
  CustomSectionComponent,
  SectionManager,
  TemplateSelector,
  ResumePreview,
  type TemplateId,
} from "@/components/resume-builder";
import { createEmptyCustomSection } from "@/types/resume-types";

export default function ResumeBuilderPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [resume, setResume] = useState<Resume | null>(null);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const resumeRef = useRef<HTMLDivElement>(null);
  
  // Initialize resume when user loads
  useEffect(() => {
    if (user && !resume) {
      const newResume = createEmptyResume(user.uid);
      // Pre-fill from user profile if available
      if (userProfile) {
        newResume.header.fullName = user.displayName || '';
        newResume.header.email = user.email || '';
        newResume.header.linkedin = userProfile.linkedinLink || '';
        if (userProfile.skills) {
          newResume.skills.technical = userProfile.skills.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
      }
      setResume(newResume);
    }
  }, [user, userProfile, resume]);

  const updateResume = <K extends keyof Resume>(key: K, value: Resume[K]) => {
    if (!resume) return;
    setResume({ ...resume, [key]: value, updatedAt: new Date() });
  };

  const isSectionEnabled = (sectionId: SectionId) => {
    if (!resume) return false;
    const config = SECTION_CONFIGS[sectionId];
    if (!config.removable) return true; // Mandatory sections always enabled
    return resume.enabledSections.includes(sectionId);
  };

  const handleAIGenerate = async () => {
    if (!resume) return;
    
    const errors = validateResume(resume);
    if (errors.length > 0) {
      toast({
        title: "Please fill required fields",
        description: errors[0].message,
        variant: "destructive",
      });
      return;
    }
    
    setIsGenerating(true);
    try {
      // Import the AI flow dynamically
      const { generateFullResume } = await import("@/ai/flows/generate-resume");
      
      const result = await generateFullResume({
        userInfo: {
          name: resume.header.fullName,
          email: resume.header.email,
          phone: resume.header.phone,
          location: resume.header.location,
          linkedin: resume.header.linkedin,
          title: resume.header.jobTitle,
          experience: resume.experience.map(e => 
            `${e.jobTitle} at ${e.company} (${e.startDate} - ${e.current ? 'Present' : e.endDate}): ${e.bullets.map(b => b.text).join('; ')}`
          ).join('\n'),
          skills: [...resume.skills.technical, ...resume.skills.coreCompetencies].join(', '),
          education: resume.education.map(e => 
            `${e.degree} in ${e.fieldOfStudy} from ${e.institution}`
          ).join('\n'),
          projects: resume.projects.map(p => 
            `${p.name} (${p.techStack.join(', ')}): ${p.bullets.join('; ')}`
          ).join('\n'),
        },
        targetRole: resume.targetRole,
        targetCompany: resume.targetCompany,
        jobDescription: resume.jobDescription,
        format: resume.templateId,
      });
      
      // Update resume with AI-generated content
      updateResume('summary', result.summary);
      updateResume('atsScore', result.atsScore);
      
      toast({
        title: "Resume Enhanced!",
        description: `ATS Score: ${result.atsScore}%`,
      });
      
      setActiveTab('preview');
    } catch (error: any) {
      console.error("Resume generation error:", error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to enhance resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!resume) return;
    
    let text = `${resume.header.fullName}\n`;
    text += `${resume.header.jobTitle}\n`;
    text += `${resume.header.email} | ${resume.header.phone} | ${resume.header.location}\n\n`;
    
    if (resume.summary) {
      text += `PROFESSIONAL SUMMARY\n${resume.summary}\n\n`;
    }
    
    if (resume.skills.technical.length > 0) {
      text += `SKILLS\n`;
      text += `Technical: ${resume.skills.technical.join(', ')}\n`;
      if (resume.skills.coreCompetencies.length > 0) {
        text += `Core: ${resume.skills.coreCompetencies.join(', ')}\n`;
      }
      text += '\n';
    }
    
    if (resume.experience.length > 0) {
      text += `EXPERIENCE\n`;
      resume.experience.forEach(exp => {
        text += `${exp.jobTitle} | ${exp.company} | ${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}\n`;
        exp.bullets.forEach(b => {
          if (b.text) text += `• ${b.text}\n`;
        });
        text += '\n';
      });
    }
    
    if (resume.projects.length > 0) {
      text += `PROJECTS\n`;
      resume.projects.forEach(proj => {
        text += `${proj.name} | ${proj.techStack.join(', ')}\n`;
        proj.bullets.forEach(b => {
          if (b) text += `• ${b}\n`;
        });
        text += '\n';
      });
    }
    
    if (resume.education.length > 0) {
      text += `EDUCATION\n`;
      resume.education.forEach(edu => {
        text += `${edu.degree} in ${edu.fieldOfStudy} | ${edu.institution} | ${edu.endDate}\n`;
      });
    }
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied to clipboard!" });
  };

  const downloadAsPDF = async () => {
    const element = resumeRef.current;
    if (!element || !resume) return;

    toast({ title: "Generating PDF...", description: "Please wait..." });

    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(`${resume.header.fullName.replace(/\s+/g, "_") || "Resume"}.pdf`);

      toast({ title: "PDF Downloaded!" });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast({
        title: "Download Failed",
        description: "Failed to generate PDF.",
        variant: "destructive",
      });
    }
  };

  if (authLoading) {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-[60vh]">
        <LumaSpin />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Login Required</h1>
        <p className="text-muted-foreground mb-6">Please log in to access the Resume Builder.</p>
        <Button asChild>
          <Link href="/login">Login</Link>
        </Button>
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-[60vh]">
        <LumaSpin />
      </div>
    );
  }

  return (
    <div className="h-full relative">
      {/* Loading Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />
          <div className="relative z-10">
            <AILoader text="Enhancing" size={160} />
          </div>
        </div>
      )}

      {/* Header */}
      <div className=" bg-background/95 backdrop-blur sticky top-0 z-40 rounded-3xl">
        <div className="container mx-auto py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-full">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Resume Builder</h1>
                <p className="text-sm text-muted-foreground">
                  Professional, ATS-optimized resume
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {resume.atsScore && (
                <Badge variant="secondary" className="text-sm rounded-full">
                  ATS Score: {resume.atsScore}%
                </Badge>
              )}
              <Button variant="outline" size="lg" onClick={copyToClipboard} className="rounded-full">
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button variant="outline" size="lg" onClick={downloadAsPDF} className="rounded-full">
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button onClick={handleAIGenerate} disabled={isGenerating} className="rounded-full">
                <Wand2 className="h-4 w-4 mr-2" />
                AI Enhance
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto py-6 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Section Manager */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <SectionManager
                sectionOrder={resume.sectionOrder}
                enabledSections={resume.enabledSections}
                onOrderChange={(order) => updateResume('sectionOrder', order)}
                onEnabledChange={(enabled) => updateResume('enabledSections', enabled)}
                experienceCount={resume.experience.length}
                projectsCount={resume.projects.length}
              />
              
              {/* Quick Nav */}
              <Card className="rounded-3xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Quick Navigation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {resume.sectionOrder.filter(id => isSectionEnabled(id)).map((sectionId) => {
                    const config = SECTION_CONFIGS[sectionId];
                    return (
                      <Button
                        key={sectionId}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-sm"
                        onClick={() => {
                          document.getElementById(`section-${sectionId}`)?.scrollIntoView({ behavior: 'smooth' });
                        }}
                      >
                        {config.label}
                      </Button>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Template Selector */}
              <Card className="rounded-3xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Choose Template</CardTitle>
                </CardHeader>
                <CardContent>
                  <TemplateSelector
                    selectedTemplate={resume.templateId as TemplateId}
                    onSelect={(template) => updateResume('templateId', template)}
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'edit' | 'preview')}>
              <TabsList className="mb-6 rounded-3xl">
                <TabsTrigger value="edit" className="gap-2 rounded-3xl">
                  <Edit3 className="h-4 w-4" />
                  Edit
                </TabsTrigger>
                <TabsTrigger value="preview" className="gap-2 rounded-3xl">
                  <Eye className="h-4 w-4" />
                  Preview
                </TabsTrigger>
              </TabsList>

              <TabsContent value="edit" className="space-y-6">
                {/* Render sections based on order */}
                {resume.sectionOrder.map((sectionId) => {
                  if (!isSectionEnabled(sectionId)) return null;
                  
                  return (
                    <div key={sectionId} id={`section-${sectionId}`}>
                      {sectionId === 'header' && (
                        <HeaderSection
                          data={resume.header}
                          onChange={(data) => updateResume('header', data)}
                        />
                      )}
                      {sectionId === 'summary' && (
                        <SummarySection
                          data={resume.summary}
                          onChange={(data) => updateResume('summary', data)}
                        />
                      )}
                      {sectionId === 'skills' && (
                        <SkillsSection
                          data={resume.skills}
                          onChange={(data) => updateResume('skills', data)}
                        />
                      )}
                      {sectionId === 'experience' && (
                        <ExperienceSection
                          data={resume.experience}
                          onChange={(data) => updateResume('experience', data)}
                        />
                      )}
                      {sectionId === 'projects' && (
                        <ProjectSection
                          data={resume.projects}
                          onChange={(data) => updateResume('projects', data)}
                        />
                      )}
                      {sectionId === 'education' && (
                        <EducationSection
                          data={resume.education}
                          onChange={(data) => updateResume('education', data)}
                        />
                      )}
                      {sectionId === 'certifications' && (
                        <CertificationsSection
                          data={resume.certifications}
                          onChange={(data) => updateResume('certifications', data)}
                        />
                      )}
                      {sectionId === 'achievements' && (
                        <AchievementsSection
                          data={resume.achievements}
                          onChange={(data) => updateResume('achievements', data)}
                        />
                      )}
                      {sectionId === 'languages' && (
                        <LanguagesSection
                          data={resume.languages}
                          onChange={(data) => updateResume('languages', data)}
                        />
                      )}
                      {sectionId === 'internships' && (
                        <InternshipsSection
                          data={resume.internships}
                          onChange={(data) => updateResume('internships', data)}
                        />
                      )}
                      {sectionId === 'publications' && (
                        <PublicationsSection
                          data={resume.publications}
                          onChange={(data) => updateResume('publications', data)}
                        />
                      )}
                      {sectionId === 'volunteering' && (
                        <VolunteeringSection
                          data={resume.volunteering}
                          onChange={(data) => updateResume('volunteering', data)}
                        />
                      )}
                      {sectionId === 'interests' && (
                        <InterestsSection
                          data={resume.interests}
                          onChange={(data) => updateResume('interests', data)}
                        />
                      )}
                      {sectionId === 'custom' && (
                        <div className="space-y-6">
                           {resume.customSections.map((section, index) => (
                             <CustomSectionComponent
                               key={section.id}
                               section={section}
                               onChange={(updatedSection) => {
                                  const newSections = [...resume.customSections];
                                  newSections[index] = updatedSection;
                                  updateResume('customSections', newSections);
                               }}
                               onRemove={() => {
                                  const newSections = resume.customSections.filter(s => s.id !== section.id);
                                  updateResume('customSections', newSections);
                               }}
                             />
                           ))}
                           <Button 
                             variant="outline" 
                             className="w-full border-dashed rounded-3xl"
                             onClick={() => updateResume('customSections', [...resume.customSections, createEmptyCustomSection()])}
                           >
                             Add Custom Section
                           </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </TabsContent>

              <TabsContent value="preview">
                <Card>
                  <CardContent className="p-0" ref={resumeRef}>
                    <ResumePreview 
                      resume={resume} 
                      templateId={resume.templateId as TemplateId}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
