"use client";

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Award, 
  Plus, 
  Trash2, 
  GripVertical, 
  ExternalLink,
  Trophy,
  Globe,
  Briefcase,
  BookOpen,
  Heart,
  Sparkles,
  Pencil,
  FileText,
} from 'lucide-react';
import { 
  CertificationEntry, 
  AchievementEntry,
  LanguageEntry,
  ExperienceEntry,
  PublicationEntry,
  VolunteeringEntry,
  CustomSection,
  createEmptyCertification,
  createEmptyAchievement,
  createEmptyExperience,
  createEmptyPublication,
  createEmptyVolunteering,
  createEmptyCustomSection,
  createEmptyCustomSectionEntry,
  FIELD_LIMITS,
} from '@/types/resume-types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ============================================
// CERTIFICATIONS SECTION
// ============================================

interface CertificationsSectionProps {
  data: CertificationEntry[];
  onChange: (data: CertificationEntry[]) => void;
}

export function CertificationsSection({ data, onChange }: CertificationsSectionProps) {
  const addEntry = () => {
    onChange([...data, createEmptyCertification()]);
  };

  const removeEntry = (id: string) => {
    onChange(data.filter(e => e.id !== id));
  };

  const updateEntry = (id: string, updates: Partial<CertificationEntry>) => {
    onChange(data.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  return (
    <Card className="rounded-3xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="h-5 w-5" />
              Certifications
            </CardTitle>
            <CardDescription>
              Professional certifications and credentials
            </CardDescription>
          </div>
          <Button className="rounded-full" variant="outline" size="sm" onClick={addEntry}>
            <Plus className="h-4 w-4 mr-2" />
            Add Certification
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Award className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No certifications added</p>
          </div>
        ) : (
          data.map((entry, index) => (
            <div key={entry.id} className="border rounded-2xl p-4 space-y-3 bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">#{index + 1}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeEntry(entry.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Certification Name *</Label>
                  <Input
                    value={entry.name}
                    onChange={(e) => updateEntry(entry.id, { name: e.target.value })}
                    placeholder="AWS Solutions Architect"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Issuing Organization *</Label>
                  <Input
                    value={entry.issuingBody}
                    onChange={(e) => updateEntry(entry.id, { issuingBody: e.target.value })}
                    placeholder="Amazon Web Services"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Issue Date</Label>
                  <Input
                    value={entry.issueDate}
                    onChange={(e) => updateEntry(entry.id, { issueDate: e.target.value })}
                    placeholder="Jan 2023"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Credential ID</Label>
                  <Input
                    value={entry.credentialId || ''}
                    onChange={(e) => updateEntry(entry.id, { credentialId: e.target.value })}
                    placeholder="ABC123XYZ"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" />
                    Credential URL
                  </Label>
                  <Input
                    value={entry.credentialUrl || ''}
                    onChange={(e) => updateEntry(entry.id, { credentialUrl: e.target.value })}
                    placeholder="verify.link/..."
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// ACHIEVEMENTS SECTION
// ============================================

interface AchievementsSectionProps {
  data: AchievementEntry[];
  onChange: (data: AchievementEntry[]) => void;
}

export function AchievementsSection({ data, onChange }: AchievementsSectionProps) {
  const addEntry = () => {
    onChange([...data, createEmptyAchievement()]);
  };

  const removeEntry = (id: string) => {
    onChange(data.filter(e => e.id !== id));
  };

  const updateEntry = (id: string, updates: Partial<AchievementEntry>) => {
    onChange(data.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  return (
    <Card className="rounded-3xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="h-5 w-5" />
              Achievements & Awards
            </CardTitle>
            <CardDescription>
              Notable recognitions and accomplishments
            </CardDescription>
          </div>
          <Button className="rounded-full" variant="outline" size="sm" onClick={addEntry}>
            <Plus className="h-4 w-4 mr-2" />
            Add Achievement
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Trophy className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No achievements added</p>
          </div>
        ) : (
          data.map((entry, index) => (
            <div key={entry.id} className="border rounded-2xl p-4 space-y-3 bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">#{index + 1}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeEntry(entry.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="space-y-1 md:col-span-2">
                  <Label className="text-xs">Title *</Label>
                  <Input
                    value={entry.title}
                    onChange={(e) => updateEntry(entry.id, { title: e.target.value })}
                    placeholder="First Place - Hackathon"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Year</Label>
                  <Input
                    value={entry.year}
                    onChange={(e) => updateEntry(entry.id, { year: e.target.value })}
                    placeholder="2023"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Description</Label>
                <Input
                  value={entry.description}
                  onChange={(e) => updateEntry(entry.id, { description: e.target.value })}
                  placeholder="Won first place among 200 teams..."
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// LANGUAGES SECTION
// ============================================

interface LanguagesSectionProps {
  data: LanguageEntry[];
  onChange: (data: LanguageEntry[]) => void;
}

export function LanguagesSection({ data, onChange }: LanguagesSectionProps) {
  const addEntry = () => {
    onChange([...data, { id: crypto.randomUUID(), language: '', proficiency: 'professional' }]);
  };

  const removeEntry = (id: string) => {
    onChange(data.filter(e => e.id !== id));
  };

  const updateEntry = (id: string, updates: Partial<LanguageEntry>) => {
    onChange(data.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  return (
    <Card className="rounded-3xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe className="h-5 w-5" />
              Languages
            </CardTitle>
            <CardDescription>
              Languages you speak
            </CardDescription>
          </div>
          <Button className="rounded-full" variant="outline" size="sm" onClick={addEntry}>
            <Plus className="h-4 w-4 mr-2" />
            Add Language
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Globe className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No languages added</p>
          </div>
        ) : (
          data.map((entry) => (
            <div key={entry.id} className="flex items-center gap-3">
              <Input
                value={entry.language}
                onChange={(e) => updateEntry(entry.id, { language: e.target.value })}
                placeholder="English"
                className="flex-1"
              />
              <Select
                value={entry.proficiency}
                onValueChange={(value: LanguageEntry['proficiency']) => updateEntry(entry.id, { proficiency: value })}
              >
                <SelectTrigger className="w-[160px] rounded-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-3xl">
                  <SelectItem className="rounded-3xl" value="native">Native</SelectItem>
                  <SelectItem className="rounded-3xl" value="fluent">Fluent</SelectItem>
                  <SelectItem className="rounded-3xl" value="professional">Professional</SelectItem>
                  <SelectItem className="rounded-3xl" value="basic">Basic</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeEntry(entry.id)}
                className="text-destructive shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// INTERNSHIPS SECTION
// ============================================

interface InternshipsSectionProps {
  data: ExperienceEntry[];
  onChange: (data: ExperienceEntry[]) => void;
}

export function InternshipsSection({ data, onChange }: InternshipsSectionProps) {
  const addEntry = () => {
    if (data.length >= FIELD_LIMITS.maxExperiences) return;
    onChange([...data, createEmptyExperience()]);
  };

  const removeEntry = (id: string) => {
    onChange(data.filter(e => e.id !== id));
  };

  const updateEntry = (id: string, updates: Partial<ExperienceEntry>) => {
    onChange(data.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const addBullet = (entryId: string) => {
    const entry = data.find(e => e.id === entryId);
    if (!entry || entry.bullets.length >= FIELD_LIMITS.maxBulletsPerExperience) return;
    
    updateEntry(entryId, {
      bullets: [...entry.bullets, { id: crypto.randomUUID(), text: '' }],
    });
  };

  const updateBullet = (entryId: string, bulletId: string, text: string) => {
    const entry = data.find(e => e.id === entryId);
    if (!entry) return;
    
    updateEntry(entryId, {
      bullets: entry.bullets.map(b => b.id === bulletId ? { ...b, text } : b),
    });
  };

  const removeBullet = (entryId: string, bulletId: string) => {
    const entry = data.find(e => e.id === entryId);
    if (!entry || entry.bullets.length <= 1) return;
    
    updateEntry(entryId, {
      bullets: entry.bullets.filter(b => b.id !== bulletId),
    });
  };

  return (
    <Card className="rounded-3xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Briefcase className="h-5 w-5" />
              Internships
            </CardTitle>
            <CardDescription>
              Relevant internship experience
            </CardDescription>
          </div>
          <Button className="rounded-full" variant="outline" size="sm" onClick={addEntry}>
            <Plus className="h-4 w-4 mr-2" />
            Add Internship
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Briefcase className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No internships added</p>
          </div>
        ) : (
          data.map((entry, index) => (
            <div key={entry.id} className="border rounded-2xl p-4 space-y-3 bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">#{index + 1}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeEntry(entry.id)} className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Role / Title *</Label>
                  <Input
                    value={entry.jobTitle}
                    onChange={(e) => updateEntry(entry.id, { jobTitle: e.target.value })}
                    placeholder="Software Engineering Intern"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Organization *</Label>
                  <Input
                    value={entry.company}
                    onChange={(e) => updateEntry(entry.id, { company: e.target.value })}
                    placeholder="Tech Corp"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Location</Label>
                  <Input
                    value={entry.location}
                    onChange={(e) => updateEntry(entry.id, { location: e.target.value })}
                    placeholder="Remote"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Start Date</Label>
                  <Input
                    value={entry.startDate}
                    onChange={(e) => updateEntry(entry.id, { startDate: e.target.value })}
                    placeholder="Jun 2023"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">End Date</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={entry.current ? 'Present' : entry.endDate}
                      onChange={(e) => updateEntry(entry.id, { endDate: e.target.value })}
                      placeholder="Aug 2023"
                      disabled={entry.current}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Initial Responsibilities & Achievements</Label>
                  <Button variant="ghost" size="sm" onClick={() => addBullet(entry.id)}>
                    <Plus className="h-3 w-3 mr-1" /> Add Bullet
                  </Button>
                </div>
                {entry.bullets.map((bullet) => (
                  <div key={bullet.id} className="flex gap-2">
                    <span className="text-muted-foreground mt-2">•</span>
                    <Textarea
                      value={bullet.text}
                      onChange={(e) => updateBullet(entry.id, bullet.id, e.target.value)}
                      placeholder="Developed internal tool for..."
                      rows={1}
                      className="flex-1"
                    />
                    {entry.bullets.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeBullet(entry.id, bullet.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// PUBLICATIONS SECTION
// ============================================

interface PublicationsSectionProps {
  data: PublicationEntry[];
  onChange: (data: PublicationEntry[]) => void;
}

export function PublicationsSection({ data, onChange }: PublicationsSectionProps) {
  const addEntry = () => {
    onChange([...data, createEmptyPublication()]);
  };

  const removeEntry = (id: string) => {
    onChange(data.filter(e => e.id !== id));
  };

  const updateEntry = (id: string, updates: Partial<PublicationEntry>) => {
    onChange(data.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  return (
    <Card className="rounded-3xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5" />
              Publications & Research
            </CardTitle>
            <CardDescription>
              Academic papers, articles, or research
            </CardDescription>
          </div>
          <Button className="rounded-full" variant="outline" size="sm" onClick={addEntry}>
            <Plus className="h-4 w-4 mr-2" />
            Add Publication
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No publications added</p>
          </div>
        ) : (
          data.map((entry, index) => (
            <div key={entry.id} className="border rounded-2xl p-4 space-y-3 bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">#{index + 1}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeEntry(entry.id)} className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Title *</Label>
                <Input
                  value={entry.title}
                  onChange={(e) => updateEntry(entry.id, { title: e.target.value })}
                  placeholder="Paper Title"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Journal / Conference</Label>
                  <Input
                    value={entry.journal}
                    onChange={(e) => updateEntry(entry.id, { journal: e.target.value })}
                    placeholder="IEEE Access"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Date / Year</Label>
                  <Input
                    value={entry.year}
                    onChange={(e) => updateEntry(entry.id, { year: e.target.value })}
                    placeholder="2024"
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs">Link (URL)</Label>
                <Input
                  value={entry.url || ''}
                  onChange={(e) => updateEntry(entry.id, { url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// VOLUNTEERING SECTION
// ============================================

interface VolunteeringSectionProps {
  data: VolunteeringEntry[];
  onChange: (data: VolunteeringEntry[]) => void;
}

export function VolunteeringSection({ data, onChange }: VolunteeringSectionProps) {
  const addEntry = () => {
    onChange([...data, createEmptyVolunteering()]);
  };

  const removeEntry = (id: string) => {
    onChange(data.filter(e => e.id !== id));
  };

  const updateEntry = (id: string, updates: Partial<VolunteeringEntry>) => {
    onChange(data.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  return (
    <Card className="rounded-3xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Heart className="h-5 w-5" />
              Volunteering
            </CardTitle>
            <CardDescription>
              Community service and volunteer work
            </CardDescription>
          </div>
          <Button className="rounded-full" variant="outline" size="sm" onClick={addEntry}>
            <Plus className="h-4 w-4 mr-2" />
            Add Entry
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Heart className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No volunteering added</p>
          </div>
        ) : (
          data.map((entry, index) => (
            <div key={entry.id} className="border rounded-2xl p-4 space-y-3 bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">#{index + 1}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeEntry(entry.id)} className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Role</Label>
                  <Input
                    value={entry.role}
                    onChange={(e) => updateEntry(entry.id, { role: e.target.value })}
                    placeholder="Volunteer"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Organization</Label>
                  <Input
                    value={entry.organization}
                    onChange={(e) => updateEntry(entry.id, { organization: e.target.value })}
                    placeholder="Red Cross"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                 <div className="space-y-1">
                  <Label className="text-xs">Start Date</Label>
                  <Input
                    value={entry.startDate}
                    onChange={(e) => updateEntry(entry.id, { startDate: e.target.value })}
                    placeholder="Jan 2022"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">End Date</Label>
                  <Input
                    value={entry.endDate}
                    onChange={(e) => updateEntry(entry.id, { endDate: e.target.value })}
                    placeholder="Present"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Description</Label>
                <Textarea
                  value={entry.description}
                  onChange={(e) => updateEntry(entry.id, { description: e.target.value })}
                  placeholder="Describe your contribution..."
                  rows={2}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// INTERESTS SECTION
// ============================================

interface InterestsSectionProps {
  data: string[];
  onChange: (data: string[]) => void;
}

export function InterestsSection({ data, onChange }: InterestsSectionProps) {
  const [newValue, setNewValue] = React.useState('');

  const addInterest = () => {
    if (!newValue.trim()) return;
    onChange([...data, newValue.trim()]);
    setNewValue('');
  };

  const removeInterest = (index: number) => {
    onChange(data.filter((_, i) => i !== index));
  };

  return (
    <Card className="rounded-3xl">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5" />
          Interests & Hobbies
        </CardTitle>
        <CardDescription>
          Personal interests that show your personality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input 
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="e.g. Photography, Hiking, Chess"
            onKeyDown={(e) => e.key === 'Enter' && addInterest()}
          />
          <Button onClick={addInterest} className="rounded-full">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {data.map((interest, index) => (
            <div key={index} className="flex items-center gap-1 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm">
              {interest}
              <button onClick={() => removeInterest(index)} className="ml-1 hover:text-destructive">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
          {data.length === 0 && (
             <p className="text-sm text-muted-foreground italic">No interests added yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// CUSTOM SECTION
// ============================================

interface CustomSectionProps {
  section: CustomSection;
  onChange: (section: CustomSection) => void;
  onRemove: () => void;
}

export function CustomSectionComponent({ section, onChange, onRemove }: CustomSectionProps) {
  const addEntry = () => {
    onChange({
      ...section,
      entries: [...section.entries, createEmptyCustomSectionEntry()]
    });
  };

  const removeEntry = (id: string) => {
    onChange({
      ...section,
      entries: section.entries.filter(e => e.id !== id)
    });
  };

  const updateEntry = (id: string, updates: Partial<any>) => {
    onChange({
      ...section,
      entries: section.entries.map(e => e.id === id ? { ...e, ...updates } : e)
    });
  };

  return (
    <Card className="rounded-3xl border-dashed">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 mr-4">
             <Pencil className="h-4 w-4 text-muted-foreground" />
             <Input 
                value={section.title}
                onChange={(e) => onChange({ ...section, title: e.target.value })}
                className="font-semibold text-lg h-auto py-1 px-2 border-transparent hover:border-input focus:border-input focus:ring-1 transition-colors"
                placeholder="Section Title"
             />
          </div>
          <div className="flex gap-2">
             <Button variant="ghost" size="sm" onClick={onRemove} className="text-destructive">
               <Trash2 className="h-4 w-4 mr-2" />
               Delete Section
             </Button>
             <Button className="rounded-full" variant="outline" size="sm" onClick={addEntry}>
               <Plus className="h-4 w-4 mr-2" />
               Add Entry
             </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {section.entries.map((entry, index) => (
          <div key={entry.id} className="border rounded-2xl p-4 space-y-3 bg-muted/30">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Item #{index + 1}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeEntry(entry.id)} className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
               <Input 
                 value={entry.title} 
                 onChange={(e) => updateEntry(entry.id, { title: e.target.value })}
                 placeholder="Main Title (e.g. Project Name)"
               />
               <Input 
                 value={entry.subtitle || ''} 
                 onChange={(e) => updateEntry(entry.id, { subtitle: e.target.value })}
                 placeholder="Subtitle (e.g. Role)"
               />
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
               <Input 
                 value={entry.date || ''} 
                 onChange={(e) => updateEntry(entry.id, { date: e.target.value })}
                 placeholder="Date / Duration"
               />
               <Input 
                 value={entry.url || ''} 
                 onChange={(e) => updateEntry(entry.id, { url: e.target.value })}
                 placeholder="URL (optional)"
               />
             </div>
             <Textarea 
               value={entry.description || ''}
               onChange={(e) => updateEntry(entry.id, { description: e.target.value })}
               placeholder="Description..."
               rows={2}
             />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
