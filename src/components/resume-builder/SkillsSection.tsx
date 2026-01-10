"use client";

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Code, X, Plus, Wand2 } from 'lucide-react';
import { SkillsSection as SkillsSectionType } from '@/types/resume-types';

interface SkillsSectionProps {
  data: SkillsSectionType;
  onChange: (data: SkillsSectionType) => void;
  onAIEnhance?: () => void;
}

export function SkillsSection({ data, onChange, onAIEnhance }: SkillsSectionProps) {
  const [technicalInput, setTechnicalInput] = React.useState('');
  const [softInput, setSoftInput] = React.useState('');
  const [toolsInput, setToolsInput] = React.useState('');

  const addSkill = (category: 'technical' | 'coreCompetencies' | 'tools', skill: string) => {
    if (!skill.trim()) return;
    const currentSkills = data[category] || [];
    if (!currentSkills.includes(skill.trim())) {
      onChange({
        ...data,
        [category]: [...currentSkills, skill.trim()],
      });
    }
  };

  const removeSkill = (category: 'technical' | 'coreCompetencies' | 'tools', skill: string) => {
    const currentSkills = data[category] || [];
    onChange({
      ...data,
      [category]: currentSkills.filter(s => s !== skill),
    });
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    category: 'technical' | 'coreCompetencies' | 'tools',
    value: string,
    setValue: (v: string) => void
  ) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill(category, value);
      setValue('');
    }
  };

  return (
    <Card className="rounded-3xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Code className="h-5 w-5" />
              Skills
            </CardTitle>
            <CardDescription>Press Enter or comma to add skills</CardDescription>
          </div>
          {onAIEnhance && (
            <Button variant="outline" size="sm" onClick={onAIEnhance}>
              <Wand2 className="h-4 w-4 mr-2" />
              AI Suggest
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Technical Skills */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Technical Skills *</Label>
          <div className="flex gap-2">
            <Input
              value={technicalInput}
              onChange={(e) => setTechnicalInput(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'technical', technicalInput, setTechnicalInput)}
              placeholder="React, Python, AWS..."
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => {
                addSkill('technical', technicalInput);
                setTechnicalInput('');
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.technical.map((skill) => (
              <Badge key={skill} variant="secondary" className="gap-1 pr-1">
                {skill}
                <button
                  onClick={() => removeSkill('technical', skill)}
                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        {/* Core Competencies */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Core Competencies / Soft Skills</Label>
          <div className="flex gap-2">
            <Input
              value={softInput}
              onChange={(e) => setSoftInput(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'coreCompetencies', softInput, setSoftInput)}
              placeholder="Leadership, Problem Solving..."
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => {
                addSkill('coreCompetencies', softInput);
                setSoftInput('');
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.coreCompetencies.map((skill) => (
              <Badge key={skill} variant="outline" className="gap-1 pr-1">
                {skill}
                <button
                  onClick={() => removeSkill('coreCompetencies', skill)}
                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        {/* Tools */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Tools & Platforms</Label>
          <div className="flex gap-2">
            <Input
              value={toolsInput}
              onChange={(e) => setToolsInput(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'tools', toolsInput, setToolsInput)}
              placeholder="Git, Docker, VS Code..."
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => {
                addSkill('tools', toolsInput);
                setToolsInput('');
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {(data.tools || []).map((skill) => (
              <Badge key={skill} className="gap-1 pr-1 bg-primary/10 text-primary border-primary/20">
                {skill}
                <button
                  onClick={() => removeSkill('tools', skill)}
                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
