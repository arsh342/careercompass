"use client";

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, Phone, MapPin, Linkedin, Github, Globe } from 'lucide-react';
import { HeaderSection as HeaderSectionType } from '@/types/resume-types';

interface HeaderSectionProps {
  data: HeaderSectionType;
  onChange: (data: HeaderSectionType) => void;
}

export function HeaderSection({ data, onChange }: HeaderSectionProps) {
  const updateField = (field: keyof HeaderSectionType, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="h-5 w-5" />
          Contact Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="flex items-center gap-2">
              <User className="h-3 w-3" />
              Full Name *
            </Label>
            <Input
              id="fullName"
              value={data.fullName}
              onChange={(e) => updateField('fullName', e.target.value)}
              placeholder="John Doe"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="jobTitle">Professional Title *</Label>
            <Input
              id="jobTitle"
              value={data.jobTitle}
              onChange={(e) => updateField('jobTitle', e.target.value)}
              placeholder="Senior Software Engineer"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-3 w-3" />
              Email *
            </Label>
            <Input
              id="email"
              type="email"
              value={data.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="john@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-3 w-3" />
              Phone *
            </Label>
            <Input
              id="phone"
              value={data.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location" className="flex items-center gap-2">
            <MapPin className="h-3 w-3" />
            Location *
          </Label>
          <Input
            id="location"
            value={data.location}
            onChange={(e) => updateField('location', e.target.value)}
            placeholder="San Francisco, CA"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="linkedin" className="flex items-center gap-2">
              <Linkedin className="h-3 w-3" />
              LinkedIn
            </Label>
            <Input
              id="linkedin"
              value={data.linkedin || ''}
              onChange={(e) => updateField('linkedin', e.target.value)}
              placeholder="linkedin.com/in/johndoe"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="github" className="flex items-center gap-2">
              <Github className="h-3 w-3" />
              GitHub
            </Label>
            <Input
              id="github"
              value={data.github || ''}
              onChange={(e) => updateField('github', e.target.value)}
              placeholder="github.com/johndoe"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="portfolio" className="flex items-center gap-2">
              <Globe className="h-3 w-3" />
              Portfolio / Website
            </Label>
            <Input
              id="portfolio"
              value={data.portfolio || ''}
              onChange={(e) => updateField('portfolio', e.target.value)}
              placeholder="johndoe.dev"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
