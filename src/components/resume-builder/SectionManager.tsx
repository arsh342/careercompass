"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Settings2, 
  User, 
  FileText, 
  Code, 
  Briefcase, 
  FolderGit2, 
  GraduationCap,
  Award,
  Trophy,
  Building2,
  BookOpen,
  Heart,
  Globe,
  Sparkles,
  Plus,
  GripVertical,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { 
  SectionId, 
  SectionConfig, 
  SECTION_CONFIGS,
  DEFAULT_ENABLED_SECTIONS,
} from '@/types/resume-types';

const ICON_MAP: Record<string, React.ElementType> = {
  User,
  FileText,
  Code,
  Briefcase,
  FolderGit2,
  GraduationCap,
  Award,
  Trophy,
  Building2,
  BookOpen,
  Heart,
  Globe,
  Sparkles,
  Plus,
};

interface SectionManagerProps {
  sectionOrder: SectionId[];
  enabledSections: SectionId[];
  onOrderChange: (order: SectionId[]) => void;
  onEnabledChange: (enabled: SectionId[]) => void;
  experienceCount: number;
  projectsCount: number;
}

export function SectionManager({
  sectionOrder,
  enabledSections,
  onOrderChange,
  onEnabledChange,
  experienceCount,
  projectsCount,
}: SectionManagerProps) {
  const toggleSection = (sectionId: SectionId) => {
    const config = SECTION_CONFIGS[sectionId];
    
    // Cannot toggle mandatory sections
    if (!config.removable) return;
    
    // Conditional check for experience/projects
    if (sectionId === 'experience' || sectionId === 'projects') {
      const other = sectionId === 'experience' ? 'projects' : 'experience';
      const otherEnabled = enabledSections.includes(other);
      const otherHasEntries = sectionId === 'experience' ? projectsCount > 0 : experienceCount > 0;
      
      // Cannot disable if other section is also empty/disabled
      if (enabledSections.includes(sectionId) && !otherHasEntries && !otherEnabled) {
        return; // Prevent disabling
      }
    }
    
    if (enabledSections.includes(sectionId)) {
      onEnabledChange(enabledSections.filter(id => id !== sectionId));
    } else {
      onEnabledChange([...enabledSections, sectionId]);
    }
  };

  const moveSection = (sectionId: SectionId, direction: 'up' | 'down') => {
    const currentIndex = sectionOrder.indexOf(sectionId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= sectionOrder.length) return;
    
    // Cannot move header from position 0
    if (sectionId === 'header' || sectionOrder[newIndex] === 'header') return;
    
    const newOrder = [...sectionOrder];
    [newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]];
    onOrderChange(newOrder);
  };

  const getSectionStatus = (sectionId: SectionId): 'mandatory' | 'enabled' | 'disabled' => {
    const config = SECTION_CONFIGS[sectionId];
    if (!config.removable) return 'mandatory';
    return enabledSections.includes(sectionId) ? 'enabled' : 'disabled';
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Settings2 className="h-5 w-5" />
          Section Manager
        </CardTitle>
        <CardDescription>
          Enable/disable sections and reorder them
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {sectionOrder.map((sectionId, index) => {
          const config = SECTION_CONFIGS[sectionId];
          if (!config) return null;
          
          const Icon = ICON_MAP[config.icon] || FileText;
          const status = getSectionStatus(sectionId);
          const isEnabled = status === 'mandatory' || status === 'enabled';
          const isFirst = index === 0 || sectionOrder[index - 1] === 'header';
          const isLast = index === sectionOrder.length - 1;
          
          return (
            <div 
              key={sectionId}
              className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                isEnabled ? 'bg-muted/50' : 'opacity-50'
              }`}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-move shrink-0" />
              
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Icon className="h-4 w-4 shrink-0" />
                <span className="text-sm truncate">{config.label}</span>
                {status === 'mandatory' && (
                  <Badge variant="secondary" className="text-xs shrink-0">Required</Badge>
                )}
              </div>
              
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={isFirst || sectionId === 'header'}
                  onClick={() => moveSection(sectionId, 'up')}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={isLast}
                  onClick={() => moveSection(sectionId, 'down')}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Switch
                  checked={isEnabled}
                  onCheckedChange={() => toggleSection(sectionId)}
                  disabled={!config.removable}
                />
              </div>
            </div>
          );
        })}
        
        <p className="text-xs text-muted-foreground pt-2">
          At least one of Experience or Projects must be filled.
        </p>
      </CardContent>
    </Card>
  );
}
