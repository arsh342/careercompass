
'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Loader2, SlidersHorizontal, Check } from "lucide-react";
import Link from "next/link";
import { useSavedOpportunities } from "@/context/SavedOpportunitiesContext";
import { cn } from "@/lib/utils";
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';


interface Opportunity {
  id: string;
  title: string;
  employerName: string;
  location: string;
  type: string;
  skills: string[] | string;
  match?: number;
  [key: string]: any;
}

function OpportunitiesContent() {
  const { saved, toggleSave } = useSavedOpportunities();
  const { userProfile } = useAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();

  const [allSkills, setAllSkills] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());
  const [locationFilter, setLocationFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

   useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        const q = query(collection(db, "opportunities"), where("status", "==", "Active"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const opportunitiesData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Opportunity));

        setOpportunities(opportunitiesData);
        
        // Extract all unique skills for filter
        const skillsSet = new Set<string>();
        opportunitiesData.forEach(opp => {
            const skillsArray = typeof opp.skills === 'string' ? opp.skills.split(',') : (opp.skills || []);
            skillsArray.forEach(skill => skillsSet.add(skill.trim()));
        });
        setAllSkills(Array.from(skillsSet).sort());

      } catch (error) {
        console.error("Error fetching opportunities:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOpportunities();
  }, []);
  
  const calculateMatch = (opportunity: Opportunity) => {
      if (!userProfile?.skills) return 0;
      const userSkills = new Set((userProfile.skills || '').split(',').map(s => s.trim().toLowerCase()));
      const requiredSkills = new Set(typeof opportunity.skills === 'string' ? opportunity.skills.split(',').map(s => s.trim().toLowerCase()) : (opportunity.skills || []).map(s => String(s).toLowerCase()));
      if (requiredSkills.size === 0) return 0;
      
      const commonSkills = [...userSkills].filter(skill => requiredSkills.has(skill));
      return Math.round((commonSkills.length / requiredSkills.size) * 100);
  }

  const filteredOpportunities = useMemo(() => {
    const searchQuery = searchParams.get('q')?.toLowerCase();

    let filtered = opportunities;

    if (searchQuery) {
        filtered = filtered.filter(opp => 
            opp.title.toLowerCase().includes(searchQuery) ||
            (opp.employerName && opp.employerName.toLowerCase().includes(searchQuery))
        );
    }
    
    if (locationFilter) {
        filtered = filtered.filter(opp => opp.location.toLowerCase().includes(locationFilter.toLowerCase()));
    }

    if (typeFilter) {
        filtered = filtered.filter(opp => opp.type === typeFilter);
    }
    
    if (selectedSkills.size > 0) {
        filtered = filtered.filter(opp => {
            const oppSkills = new Set(typeof opp.skills === 'string' ? opp.skills.split(',').map(s => s.trim()) : (opp.skills || []));
            return [...selectedSkills].every(s => oppSkills.has(s));
        })
    }
    
    return filtered;

  }, [searchParams, opportunities, locationFilter, typeFilter, selectedSkills]);
  
  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Browse Opportunities</h1>
        <p className="text-muted-foreground">Find your next great opportunity.</p>
      </div>

       <Card className="mb-6">
        <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5"/>
                Filter Opportunities
            </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Input 
                    placeholder="Filter by location..."
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                />
                 <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                        <SelectValue placeholder="Filter by type..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">All Types</SelectItem>
                        <SelectItem value="Internship">Internship</SelectItem>
                        <SelectItem value="Volunteer">Volunteer</SelectItem>
                        <SelectItem value="Full-time">Full-time</SelectItem>
                        <SelectItem value="Part-time">Part-time</SelectItem>
                        <SelectItem value="Contract">Contract</SelectItem>
                    </SelectContent>
                </Select>
                 <Popover>
                    <PopoverTrigger asChild>
                         <Button variant="outline" className="justify-start">
                            Filter by skills...
                            {selectedSkills.size > 0 && (
                                <Badge variant="secondary" className="ml-auto">{selectedSkills.size} selected</Badge>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-0" align="start">
                        <Command>
                            <CommandInput placeholder="Filter skills..." />
                            <CommandList>
                                <CommandEmpty>No results found.</CommandEmpty>
                                <CommandGroup>
                                     {allSkills.map(skill => {
                                        const isSelected = selectedSkills.has(skill);
                                        return (
                                            <CommandItem
                                                key={skill}
                                                onSelect={() => {
                                                    setSelectedSkills(prev => {
                                                        const newSet = new Set(prev);
                                                        if (isSelected) {
                                                            newSet.delete(skill);
                                                        } else {
                                                            newSet.add(skill);
                                                        }
                                                        return newSet;
                                                    })
                                                }}
                                            >
                                                <div className={cn("mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary", isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible")}>
                                                    <Check className={cn("h-4 w-4")} />
                                                </div>
                                                <span>{skill}</span>
                                            </CommandItem>
                                        )
                                     })}
                                </CommandGroup>
                                 {selectedSkills.size > 0 && (
                                    <>
                                        <CommandSeparator />
                                        <CommandGroup>
                                            <CommandItem
                                                onSelect={() => setSelectedSkills(new Set())}
                                                className="justify-center text-center"
                                            >
                                                Clear filters
                                            </CommandItem>
                                        </CommandGroup>
                                    </>
                                )}
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
                 <Button variant="outline" onClick={() => {setLocationFilter(''); setTypeFilter(''); setSelectedSkills(new Set());}}>
                    Clear All Filters
                </Button>
            </div>
        </CardContent>
       </Card>

       {loading ? (
         <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
       ) : filteredOpportunities.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground py-10">
              <p>No opportunities found. Please check back later or try a different search or filter.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredOpportunities.map((opp) => {
              const isSaved = saved.some(savedOpp => savedOpp.id === opp.id);
              const skillsArray = typeof opp.skills === 'string' ? opp.skills.split(',').map(s => s.trim()) : (opp.skills || []);
              const matchPercentage = calculateMatch(opp);
              
              return (
                <Card key={opp.id} className="flex flex-col">
                    <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <Badge variant={opp.type === 'Internship' ? 'default' : 'secondary'} className="mb-2">{opp.type}</Badge>
                            <CardTitle className="text-lg">{opp.title}</CardTitle>
                            <CardDescription>{opp.employerName} - {opp.location}</CardDescription>
                        </div>
                        <Button variant="ghost" size="icon" className="shrink-0" onClick={() => toggleSave(opp)}>
                            <Heart className={cn("w-5 h-5", isSaved && "fill-primary text-primary")} />
                            <span className="sr-only">Save opportunity</span>
                        </Button>
                    </div>
                    </CardHeader>
                    <CardContent className="flex-grow">
                    <p className="text-sm text-muted-foreground mb-4">Top skills:</p>
                        <div className="flex flex-wrap gap-2">
                            {skillsArray.slice(0, 5).map((skill, index) => (
                                <Badge key={`${skill}-${index}`} variant="outline">{skill}</Badge>
                            ))}
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between items-center">
                        <div className="text-sm font-semibold text-primary">{matchPercentage > 0 && `${matchPercentage}% Match`}</div>
                         <Button asChild><Link href={`/opportunities/${opp.id}`}>View Details</Link></Button>
                    </CardFooter>
                </Card>
              )
            })}
        </div>
      )}
    </div>
  );
}

export default function OpportunitiesPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <OpportunitiesContent />
    </Suspense>
  );
}

    