"use client";

import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileText, Wand2 } from 'lucide-react';
import { FIELD_LIMITS } from '@/types/resume-types';

interface SummarySectionProps {
  data: string;
  onChange: (data: string) => void;
  onAIEnhance?: () => void;
}

export function SummarySection({ data, onChange, onAIEnhance }: SummarySectionProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Professional Summary
            </CardTitle>
            <CardDescription>
              A brief 2-3 sentence overview of who you are and what you bring
            </CardDescription>
          </div>
          {onAIEnhance && (
            <Button variant="outline" size="sm" onClick={onAIEnhance}>
              <Wand2 className="h-4 w-4 mr-2" />
              AI Generate
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <Textarea
          value={data}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Results-driven software engineer with 5+ years of experience building scalable web applications. Passionate about clean code, user experience, and mentoring junior developers. Seeking to leverage my expertise in React and Node.js to drive innovation at a forward-thinking company."
          rows={4}
          maxLength={FIELD_LIMITS.summary}
          className="resize-none"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Keep it concise and impactful</span>
          <span>{data.length}/{FIELD_LIMITS.summary}</span>
        </div>
      </CardContent>
    </Card>
  );
}
