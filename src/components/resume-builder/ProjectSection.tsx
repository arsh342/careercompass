"use client";

import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FolderGit2, Plus, Trash2, GripVertical, Wand2, ExternalLink, Github, X } from 'lucide-react';
import { ProjectEntry, createEmptyProject, FIELD_LIMITS } from '@/types/resume-types';

interface ProjectSectionProps {
  data: ProjectEntry[];
  onChange: (data: ProjectEntry[]) => void;
  onAIEnhance?: (index: number) => void;
}

export function ProjectSection({ data, onChange, onAIEnhance }: ProjectSectionProps) {
  const [techInput, setTechInput] = React.useState<Record<string, string>>({});

  const addEntry = () => {
    if (data.length >= FIELD_LIMITS.maxProjects) return;
    onChange([...data, createEmptyProject()]);
  };

  const removeEntry = (id: string) => {
    onChange(data.filter(e => e.id !== id));
  };

  const updateEntry = (id: string, updates: Partial<ProjectEntry>) => {
    onChange(data.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const addTech = (entryId: string, tech: string) => {
    if (!tech.trim()) return;
    const entry = data.find(e => e.id === entryId);
    if (!entry || entry.techStack.includes(tech.trim())) return;
    
    updateEntry(entryId, {
      techStack: [...entry.techStack, tech.trim()],
    });
  };

  const removeTech = (entryId: string, tech: string) => {
    const entry = data.find(e => e.id === entryId);
    if (!entry) return;
    
    updateEntry(entryId, {
      techStack: entry.techStack.filter(t => t !== tech),
    });
  };

  const handleTechKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    entryId: string
  ) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const value = techInput[entryId] || '';
      addTech(entryId, value);
      setTechInput({ ...techInput, [entryId]: '' });
    }
  };

  const addBullet = (entryId: string) => {
    const entry = data.find(e => e.id === entryId);
    if (!entry || entry.bullets.length >= 4) return;
    
    updateEntry(entryId, {
      bullets: [...entry.bullets, ''],
    });
  };

  const updateBullet = (entryId: string, index: number, text: string) => {
    const entry = data.find(e => e.id === entryId);
    if (!entry) return;
    
    const newBullets = [...entry.bullets];
    newBullets[index] = text;
    updateEntry(entryId, { bullets: newBullets });
  };

  const removeBullet = (entryId: string, index: number) => {
    const entry = data.find(e => e.id === entryId);
    if (!entry || entry.bullets.length <= 1) return;
    
    updateEntry(entryId, {
      bullets: entry.bullets.filter((_, i) => i !== index),
    });
  };

  return (
    <Card className="rounded-3xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FolderGit2 className="h-5 w-5" />
              Projects
            </CardTitle>
            <CardDescription>
              Showcase your personal and professional projects
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-full"
            onClick={addEntry}
            disabled={data.length >= FIELD_LIMITS.maxProjects}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Project
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FolderGit2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No projects added yet</p>
            <Button variant="outline" size="sm" onClick={addEntry} className="mt-4 rounded-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Project
            </Button>
          </div>
        ) : (
          data.map((entry, index) => (
            <div key={entry.id} className="border rounded-2xl p-4 space-y-4 bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                  <span className="font-medium text-sm text-muted-foreground">
                    Project #{index + 1}
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

              <div className="space-y-2">
                <Label>Project Name *</Label>
                <Input
                  value={entry.name}
                  onChange={(e) => updateEntry(entry.id, { name: e.target.value })}
                  placeholder="E-commerce Platform"
                />
              </div>

              {/* Tech Stack */}
              <div className="space-y-2">
                <Label>Tech Stack</Label>
                <div className="flex gap-2">
                  <Input
                    value={techInput[entry.id] || ''}
                    onChange={(e) => setTechInput({ ...techInput, [entry.id]: e.target.value })}
                    onKeyDown={(e) => handleTechKeyDown(e, entry.id)}
                    placeholder="React, Node.js, MongoDB..."
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      addTech(entry.id, techInput[entry.id] || '');
                      setTechInput({ ...techInput, [entry.id]: '' });
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {entry.techStack.map((tech) => (
                    <Badge key={tech} variant="secondary" className="gap-1 pr-1">
                      {tech}
                      <button
                        onClick={() => removeTech(entry.id, tech)}
                        className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Description / Bullets */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Description (2-4 points)</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addBullet(entry.id)}
                    disabled={entry.bullets.length >= 4}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Point
                  </Button>
                </div>
                {entry.bullets.map((bullet, bulletIndex) => (
                  <div key={bulletIndex} className="flex gap-2">
                    <span className="text-muted-foreground mt-2">•</span>
                    <Textarea
                      value={bullet}
                      onChange={(e) => updateBullet(entry.id, bulletIndex, e.target.value)}
                      placeholder="Describe a feature, achievement, or impact..."
                      rows={2}
                      className="flex-1"
                    />
                    {entry.bullets.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeBullet(entry.id, bulletIndex)}
                        className="shrink-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Links */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Github className="h-3 w-3" />
                    GitHub Link
                  </Label>
                  <Input
                    value={entry.githubUrl || ''}
                    onChange={(e) => updateEntry(entry.id, { githubUrl: e.target.value })}
                    placeholder="github.com/user/project"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <ExternalLink className="h-3 w-3" />
                    Live Demo
                  </Label>
                  <Input
                    value={entry.liveUrl || ''}
                    onChange={(e) => updateEntry(entry.id, { liveUrl: e.target.value })}
                    placeholder="myproject.com"
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
