"use client";

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Award, 
  Plus, 
  Trash2, 
  GripVertical, 
  ExternalLink,
  Trophy,
  Globe,
} from 'lucide-react';
import { 
  CertificationEntry, 
  AchievementEntry,
  LanguageEntry,
  createEmptyCertification,
  createEmptyAchievement,
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
    <Card>
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
          <Button variant="outline" size="sm" onClick={addEntry}>
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
            <div key={entry.id} className="border rounded-lg p-4 space-y-3 bg-muted/30">
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
    <Card>
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
          <Button variant="outline" size="sm" onClick={addEntry}>
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
            <div key={entry.id} className="border rounded-lg p-4 space-y-3 bg-muted/30">
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
    <Card>
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
          <Button variant="outline" size="sm" onClick={addEntry}>
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
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="native">Native</SelectItem>
                  <SelectItem value="fluent">Fluent</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
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
