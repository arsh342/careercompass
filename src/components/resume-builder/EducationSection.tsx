"use client";

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GraduationCap, Plus, Trash2, GripVertical, X } from 'lucide-react';
import { EducationEntry, createEmptyEducation, FIELD_LIMITS } from '@/types/resume-types';

interface EducationSectionProps {
  data: EducationEntry[];
  onChange: (data: EducationEntry[]) => void;
}

export function EducationSection({ data, onChange }: EducationSectionProps) {
  const [courseworkInput, setCourseworkInput] = React.useState<Record<string, string>>({});

  const addEntry = () => {
    if (data.length >= FIELD_LIMITS.maxEducation) return;
    onChange([...data, createEmptyEducation()]);
  };

  const removeEntry = (id: string) => {
    onChange(data.filter(e => e.id !== id));
  };

  const updateEntry = (id: string, updates: Partial<EducationEntry>) => {
    onChange(data.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const addCoursework = (entryId: string, course: string) => {
    if (!course.trim()) return;
    const entry = data.find(e => e.id === entryId);
    if (!entry) return;
    
    const coursework = entry.coursework || [];
    if (!coursework.includes(course.trim())) {
      updateEntry(entryId, {
        coursework: [...coursework, course.trim()],
      });
    }
  };

  const removeCoursework = (entryId: string, course: string) => {
    const entry = data.find(e => e.id === entryId);
    if (!entry) return;
    
    updateEntry(entryId, {
      coursework: (entry.coursework || []).filter(c => c !== course),
    });
  };

  const handleCourseworkKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    entryId: string
  ) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const value = courseworkInput[entryId] || '';
      addCoursework(entryId, value);
      setCourseworkInput({ ...courseworkInput, [entryId]: '' });
    }
  };

  return (
    <Card className="rounded-3xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <GraduationCap className="h-5 w-5" />
              Education
            </CardTitle>
            <CardDescription>
              Add your educational background
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-full"
            onClick={addEntry}
            disabled={data.length >= FIELD_LIMITS.maxEducation}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Education
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No education added yet</p>
            <Button variant="outline" size="sm" onClick={addEntry} className="mt-4 rounded-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Education
            </Button>
          </div>
        ) : (
          data.map((entry, index) => (
            <div key={entry.id} className="border rounded-2xl p-4 space-y-4 bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                  <span className="font-medium text-sm text-muted-foreground">
                    Education #{index + 1}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeEntry(entry.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Degree *</Label>
                  <Input
                    value={entry.degree}
                    onChange={(e) => updateEntry(entry.id, { degree: e.target.value })}
                    placeholder="Bachelor of Science"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Field of Study *</Label>
                  <Input
                    value={entry.fieldOfStudy}
                    onChange={(e) => updateEntry(entry.id, { fieldOfStudy: e.target.value })}
                    placeholder="Computer Science"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Institution *</Label>
                  <Input
                    value={entry.institution}
                    onChange={(e) => updateEntry(entry.id, { institution: e.target.value })}
                    placeholder="Stanford University"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    value={entry.location}
                    onChange={(e) => updateEntry(entry.id, { location: e.target.value })}
                    placeholder="Stanford, CA"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    value={entry.startDate}
                    onChange={(e) => updateEntry(entry.id, { startDate: e.target.value })}
                    placeholder="Aug 2018"
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    value={entry.endDate}
                    onChange={(e) => updateEntry(entry.id, { endDate: e.target.value })}
                    placeholder="May 2022"
                  />
                </div>
                <div className="space-y-2">
                  <Label>GPA (Optional)</Label>
                  <Input
                    value={entry.gpa || ''}
                    onChange={(e) => updateEntry(entry.id, { gpa: e.target.value })}
                    placeholder="3.8/4.0"
                  />
                </div>
              </div>

              {/* Relevant Coursework */}
              <div className="space-y-2">
                <Label>Relevant Coursework (Optional)</Label>
                <div className="flex gap-2">
                  <Input
                    value={courseworkInput[entry.id] || ''}
                    onChange={(e) => setCourseworkInput({ ...courseworkInput, [entry.id]: e.target.value })}
                    onKeyDown={(e) => handleCourseworkKeyDown(e, entry.id)}
                    placeholder="Data Structures, Algorithms..."
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      addCoursework(entry.id, courseworkInput[entry.id] || '');
                      setCourseworkInput({ ...courseworkInput, [entry.id]: '' });
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(entry.coursework || []).map((course) => (
                    <Badge key={course} variant="outline" className="gap-1 pr-1">
                      {course}
                      <button
                        onClick={() => removeCoursework(entry.id, course)}
                        className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
