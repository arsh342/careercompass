"use client";

import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Briefcase, Plus, Trash2, GripVertical, Wand2 } from 'lucide-react';
import { ExperienceEntry, createEmptyExperience, FIELD_LIMITS } from '@/types/resume-types';

interface ExperienceSectionProps {
  data: ExperienceEntry[];
  onChange: (data: ExperienceEntry[]) => void;
  onAIEnhance?: (index: number) => void;
}

export function ExperienceSection({ data, onChange, onAIEnhance }: ExperienceSectionProps) {
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
              Work Experience
            </CardTitle>
            <CardDescription>
              Add your work history, most recent first
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-full"
            onClick={addEntry}
            disabled={data.length >= FIELD_LIMITS.maxExperiences}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Experience
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No work experience added yet</p>
            <Button variant="outline" size="sm" onClick={addEntry} className="mt-4 rounded-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Experience
            </Button>
          </div>
        ) : (
          data.map((entry, index) => (
            <div key={entry.id} className="border rounded-2xl p-4 space-y-4 bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                  <span className="font-medium text-sm text-muted-foreground">
                    Experience #{index + 1}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {onAIEnhance && (
                    <Button variant="ghost" size="sm" onClick={() => onAIEnhance(index)}>
                      <Wand2 className="h-4 w-4 mr-1" />
                      Enhance
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeEntry(entry.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Job Title *</Label>
                  <Input
                    value={entry.jobTitle}
                    onChange={(e) => updateEntry(entry.id, { jobTitle: e.target.value })}
                    placeholder="Senior Software Engineer"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company *</Label>
                  <Input
                    value={entry.company}
                    onChange={(e) => updateEntry(entry.id, { company: e.target.value })}
                    placeholder="Google"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    value={entry.location}
                    onChange={(e) => updateEntry(entry.id, { location: e.target.value })}
                    placeholder="San Francisco, CA"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    value={entry.startDate}
                    onChange={(e) => updateEntry(entry.id, { startDate: e.target.value })}
                    placeholder="Jan 2020"
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={entry.current ? 'Present' : entry.endDate}
                      onChange={(e) => updateEntry(entry.id, { endDate: e.target.value })}
                      placeholder="Present"
                      disabled={entry.current}
                    />
                    <div className="flex items-center gap-1">
                      <Switch
                        checked={entry.current}
                        onCheckedChange={(checked) => updateEntry(entry.id, { current: checked, endDate: '' })}
                      />
                      <span className="text-xs text-muted-foreground">Current</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bullet Points */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Achievements & Responsibilities</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addBullet(entry.id)}
                    disabled={entry.bullets.length >= FIELD_LIMITS.maxBulletsPerExperience}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Bullet
                  </Button>
                </div>
                {entry.bullets.map((bullet, bulletIndex) => (
                  <div key={bullet.id} className="flex gap-2">
                    <span className="text-muted-foreground mt-2">•</span>
                    <Textarea
                      value={bullet.text}
                      onChange={(e) => updateBullet(entry.id, bullet.id, e.target.value)}
                      placeholder="Led development of... resulting in 30% improvement..."
                      rows={2}
                      maxLength={FIELD_LIMITS.bulletPoint}
                      className="flex-1"
                    />
                    {entry.bullets.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeBullet(entry.id, bullet.id)}
                        className="shrink-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">
                  Use action verbs and quantify achievements. Max {FIELD_LIMITS.bulletPoint} chars per bullet.
                </p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
