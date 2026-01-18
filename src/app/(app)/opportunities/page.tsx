"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  Loader2,
  SlidersHorizontal,
  Check,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useSavedOpportunities } from "@/context/SavedOpportunitiesContext";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { LumaSpin } from "@/components/ui/luma-spin";

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
  const [allLocations, setAllLocations] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());
  const [locationFilter, setLocationFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        const q = query(
          collection(db, "opportunities"),
          where("status", "==", "Active"),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const opportunitiesData = querySnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as Opportunity)
        );

        setOpportunities(opportunitiesData);

        // Extract all unique skills for filter and count their frequency
        const skillsMap = new Map<string, number>();
        const locationsMap = new Map<string, number>();

        opportunitiesData.forEach((opp) => {
          // Process skills
          const skillsArray =
            typeof opp.skills === "string"
              ? opp.skills.split(",")
              : opp.skills || [];
          skillsArray.forEach((skill) => {
            const trimmedSkill = skill.trim();
            if (trimmedSkill) {
              skillsMap.set(
                trimmedSkill,
                (skillsMap.get(trimmedSkill) || 0) + 1
              );
            }
          });

          // Process locations
          if (opp.location) {
            const trimmedLocation = opp.location.trim();
            if (trimmedLocation) {
              locationsMap.set(
                trimmedLocation,
                (locationsMap.get(trimmedLocation) || 0) + 1
              );
            }
          }
        });

        // Sort skills by frequency (most popular first) and then alphabetically
        const sortedSkills = Array.from(skillsMap.entries())
          .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
          .map(([skill]) => skill);
        setAllSkills(sortedSkills);

        // Sort locations by frequency (most popular first) and then alphabetically
        const sortedLocations = Array.from(locationsMap.entries())
          .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
          .map(([location]) => location);
        setAllLocations(sortedLocations);
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
    const userSkills: Set<string> = new Set(
      (userProfile.skills || "")
        .split(",")
        .map((s: string) => s.trim().toLowerCase())
    );
    const requiredSkills: Set<string> = new Set(
      typeof opportunity.skills === "string"
        ? opportunity.skills
            .split(",")
            .map((s: string) => s.trim().toLowerCase())
        : (opportunity.skills || []).map(
            (s: unknown) => String(s).toLowerCase() as string
          )
    );
    if (requiredSkills.size === 0) return 0;

    const commonSkills = [...userSkills].filter((skill) =>
      requiredSkills.has(skill)
    );
    return Math.round((commonSkills.length / requiredSkills.size) * 100);
  };

  // Helper function to check if a skill matches the search query
  const isSkillMatchingSearch = (skill: string, searchQuery: string) => {
    if (!searchQuery) return false;
    return skill.toLowerCase().includes(searchQuery.toLowerCase());
  };

  // Helper function to check if location matches the search query
  const isLocationMatchingSearch = (location: string, searchQuery: string) => {
    if (!searchQuery) return false;
    return location.toLowerCase().includes(searchQuery.toLowerCase());
  };

  const filteredOpportunities = useMemo(() => {
    const searchQuery = searchParams.get("q")?.toLowerCase();

    let filtered = opportunities;

    if (searchQuery) {
      filtered = filtered.filter((opp) => {
        // Search in title and employer name
        const titleMatch = opp.title.toLowerCase().includes(searchQuery);
        const employerMatch =
          opp.employerName &&
          opp.employerName.toLowerCase().includes(searchQuery);

        // Search in skills
        const oppSkills =
          typeof opp.skills === "string"
            ? opp.skills.split(",").map((s) => s.trim().toLowerCase())
            : (opp.skills || []).map((s) => String(s).toLowerCase());
        const skillMatch = oppSkills.some((skill) =>
          skill.includes(searchQuery)
        );

        // Search in location
        const locationMatch =
          opp.location && opp.location.toLowerCase().includes(searchQuery);

        // Search in job description if available
        const descriptionMatch =
          opp.description &&
          opp.description.toLowerCase().includes(searchQuery);

        return (
          titleMatch ||
          employerMatch ||
          skillMatch ||
          locationMatch ||
          descriptionMatch
        );
      });
    }

    if (locationFilter) {
      filtered = filtered.filter((opp) =>
        opp.location.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    if (typeFilter) {
      filtered = filtered.filter((opp) => opp.type === typeFilter);
    }

    if (selectedSkills.size > 0) {
      filtered = filtered.filter((opp) => {
        const oppSkills = new Set(
          typeof opp.skills === "string"
            ? opp.skills.split(",").map((s) => s.trim())
            : opp.skills || []
        );
        return [...selectedSkills].every((s) => oppSkills.has(s));
      });
    }

    return filtered;
  }, [searchParams, opportunities, locationFilter, typeFilter, selectedSkills]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredOpportunities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOpportunities = filteredOpportunities.slice(
    startIndex,
    endIndex
  );

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchParams, locationFilter, typeFilter, selectedSkills]);

  // Scroll to top when page changes
  useEffect(() => {
    if (currentPage > 1) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentPage]);

  // Keyboard navigation for pagination
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "ArrowLeft" && currentPage > 1) {
          e.preventDefault();
          setCurrentPage((prev) => prev - 1);
        } else if (e.key === "ArrowRight" && currentPage < totalPages) {
          e.preventDefault();
          setCurrentPage((prev) => prev + 1);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPage, totalPages]);

  // Show loading spinner while data is being fetched
  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center min-h-[60vh]">
        <LumaSpin />
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Browse Opportunities
        </h1>
        <p className="text-muted-foreground">
          Find your next great opportunity.
        </p>

        {!searchParams.get("q") &&
          (allSkills.length > 0 || allLocations.length > 0) && (
            <div className="mt-4 space-y-3">
              {allSkills.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Popular skills (click to search):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {allSkills.slice(0, 8).map((skill) => {
                      const jobCount = opportunities.filter((opp) => {
                        const skillsArray =
                          typeof opp.skills === "string"
                            ? opp.skills.split(",").map((s) => s.trim())
                            : opp.skills || [];
                        return skillsArray.includes(skill);
                      }).length;

                      return (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                          title={`${jobCount} job${
                            jobCount !== 1 ? "s" : ""
                          } require this skill`}
                          onClick={() => {
                            const url = new URL(window.location.href);
                            url.searchParams.set("q", skill);
                            window.history.pushState({}, "", url.toString());
                            window.location.reload();
                          }}
                        >
                          {skill} ({jobCount})
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {allLocations.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Popular locations (click to search):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {allLocations.slice(0, 6).map((location) => {
                      const jobCount = opportunities.filter(
                        (opp) => opp.location === location
                      ).length;

                      return (
                        <Badge
                          key={location}
                          variant="outline"
                          className="cursor-pointer hover:bg-secondary hover:text-secondary-foreground transition-colors flex items-center gap-1"
                          title={`${jobCount} job${
                            jobCount !== 1 ? "s" : ""
                          } in this location`}
                          onClick={() => {
                            const url = new URL(window.location.href);
                            url.searchParams.set("q", location);
                            window.history.pushState({}, "", url.toString());
                            window.location.reload();
                          }}
                        >
                          <MapPin className="h-3 w-3" />
                          {location} ({jobCount})
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
      </div>

      <Card className="mb-6 rounded-3xl">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5" />
            Filter Opportunities
          </CardTitle>
          {searchParams.get("q") && (
            <CardDescription className="flex items-center justify-between">
              <span>
                Searching for "{searchParams.get("q")}" in job titles,
                companies, skills, locations, and descriptions.
                {(filteredOpportunities.some((opp) => {
                  const skillsArray =
                    typeof opp.skills === "string"
                      ? opp.skills.split(",").map((s) => s.trim())
                      : opp.skills || [];
                  return skillsArray.some((skill) =>
                    isSkillMatchingSearch(skill, searchParams.get("q")!)
                  );
                }) ||
                  filteredOpportunities.some((opp) =>
                    isLocationMatchingSearch(
                      opp.location,
                      searchParams.get("q")!
                    )
                  )) &&
                  " Matching skills and locations are highlighted below."}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const url = new URL(window.location.href);
                  url.searchParams.delete("q");
                  window.history.pushState({}, "", url.toString());
                  window.location.reload();
                }}
                className="ml-2"
              >
                Clear search
              </Button>
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              placeholder="Filter by location..."
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
            />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="rounded-full">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent className="rounded-3xl">
                <SelectItem className="rounded-full" value="Internship">Internship</SelectItem>
                <SelectItem className="rounded-full" value="Volunteer">Volunteer</SelectItem>
                <SelectItem className="rounded-full" value="Full-time">Full-time</SelectItem>
                <SelectItem className="rounded-full" value="Part-time">Part-time</SelectItem>
                <SelectItem className="rounded-full" value="Contract">Contract</SelectItem>
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild className="rounded-full">
                <Button variant="outline" className="justify-start">
                  Filter by skills...
                  {selectedSkills.size > 0 && (
                    <Badge variant="secondary" className="ml-auto">
                      {selectedSkills.size} selected
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0" align="start">
                <Command>
                  <CommandInput placeholder="Filter skills..." />
                  <CommandList>
                    <CommandEmpty>No results found.</CommandEmpty>
                    <CommandGroup>
                      {allSkills.map((skill) => {
                        const isSelected = selectedSkills.has(skill);
                        return (
                          <CommandItem
                            key={skill}
                            onSelect={() => {
                              setSelectedSkills((prev) => {
                                const newSet = new Set(prev);
                                if (isSelected) {
                                  newSet.delete(skill);
                                } else {
                                  newSet.add(skill);
                                }
                                return newSet;
                              });
                            }}
                          >
                            <div
                              className={cn(
                                "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                isSelected
                                  ? "bg-primary text-primary-foreground"
                                  : "opacity-50 [&_svg]:invisible"
                              )}
                            >
                              <Check className={cn("h-4 w-4")} />
                            </div>
                            <span>{skill}</span>
                          </CommandItem>
                        );
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
            <Button
              className="rounded-full"
              variant="outline"
              onClick={() => {
                setLocationFilter("");
                setTypeFilter("");
                setSelectedSkills(new Set());
              }}
            >
              Clear All Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      {!loading && filteredOpportunities.length > 0 && (
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            {filteredOpportunities.length} opportunity
            {filteredOpportunities.length !== 1 ? "ies" : "y"} found
            {searchParams.get("q") && ` for "${searchParams.get("q")}"`}
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredOpportunities.length === 0 ? (
        <Card className="rounded-3xl">
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground py-10">
              <p>
                No opportunities found. Please check back later or try a
                different search or filter.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-3xl overflow-hidden">
          {/* Table Header */}
          <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-4 bg-muted/50 border-b border-border text-sm font-medium text-muted-foreground">
            <div className="col-span-4">Job Title</div>
            <div className="col-span-3">Role</div>
            <div className="col-span-2">Location</div>
            <div className="col-span-1">Date</div>
            <div className="col-span-2 text-right">Action</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-border">
            {paginatedOpportunities.map((opp) => {
              const isSaved = saved.some((savedOpp) => savedOpp.id === opp.id);
              const matchPercentage = calculateMatch(opp);
              const createdDate = opp.createdAt?.toDate?.() 
                ? new Date(opp.createdAt.toDate()).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                : 'Recently';
              
              // Parse skills for badges
              const skillsArray = typeof opp.skills === "string"
                ? opp.skills.split(",").slice(0, 2).map(s => s.trim())
                : (opp.skills || []).slice(0, 2);

              return (
                <div
                  key={opp.id}
                  className="group grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 hover:bg-muted/30 transition-colors items-center"
                >
                  {/* Job Title & Company */}
                  <div className="md:col-span-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-bold text-primary">
                        {opp.employerName?.charAt(0)?.toUpperCase() || 'J'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <Link 
                        href={`/opportunities/${opp.id}`}
                        className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
                      >
                        {opp.title}
                      </Link>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {opp.employerName}
                      </p>
                    </div>
                  </div>

                  {/* Role Badges */}
                  <div className="md:col-span-3 flex flex-wrap gap-1.5">
                    {opp.type && (
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "text-xs rounded-full",
                          opp.type === "Full-time" && "bg-blue-500/10 text-blue-600 border-blue-500/20",
                          opp.type === "Part-time" && "bg-amber-500/10 text-amber-600 border-amber-500/20",
                          opp.type === "Internship" && "bg-purple-500/10 text-purple-600 border-purple-500/20",
                          opp.type === "Contract" && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                          opp.type === "Volunteer" && "bg-pink-500/10 text-pink-600 border-pink-500/20"
                        )}
                      >
                        {opp.type}
                      </Badge>
                    )}
                    {opp.experience && (
                      <Badge variant="outline" className="text-xs rounded-full">
                        {opp.experience}
                      </Badge>
                    )}
                    {opp.workMode && (
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs rounded-full",
                          opp.workMode === "Remote" && "bg-green-500/10 text-green-600 border-green-500/20",
                          opp.workMode === "Hybrid" && "bg-orange-500/10 text-orange-600 border-orange-500/20"
                        )}
                      >
                        {opp.workMode}
                      </Badge>
                    )}
                    {matchPercentage > 0 && (
                      <Badge className="text-xs rounded-full bg-primary/10 text-primary border-primary/20">
                        {matchPercentage}% Match
                      </Badge>
                    )}
                  </div>

                  {/* Location */}
                  <div className="md:col-span-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="line-clamp-1">{opp.location || 'Remote'}</span>
                  </div>

                  {/* Date */}
                  <div className="md:col-span-1 text-sm text-muted-foreground">
                    {createdDate}
                  </div>

                  {/* Actions */}
                  <div className="md:col-span-2 flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "rounded-full h-8 w-8 p-0",
                        isSaved && "bg-red-500/10 border-red-500/20 text-red-500"
                      )}
                      onClick={(e) => {
                        e.preventDefault();
                        toggleSave(opp);
                      }}
                    >
                      <Heart className={cn("h-4 w-4", isSaved && "fill-current")} />
                    </Button>
                    <Button
                      asChild
                      size="sm"
                      className="rounded-full bg-primary hover:bg-primary/90"
                    >
                      <Link href={`/opportunities/${opp.id}`}>
                        Apply Now
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Pagination Controls */}
      {filteredOpportunities.length > itemsPerPage && (
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to{" "}
              {Math.min(endIndex, filteredOpportunities.length)} of{" "}
              {filteredOpportunities.length} opportunities
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Show:</span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  setItemsPerPage(parseInt(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <div className="flex items-center space-x-1">
                {/* Page numbers with ellipsis */}
                {currentPage > 3 && totalPages > 5 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(1)}
                      className="w-8 h-8 p-0"
                    >
                      1
                    </Button>
                    {currentPage > 4 && (
                      <span className="text-muted-foreground">...</span>
                    )}
                  </>
                )}

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}

                {currentPage < totalPages - 2 && totalPages > 5 && (
                  <>
                    {currentPage < totalPages - 3 && (
                      <span className="text-muted-foreground">...</span>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      className="w-8 h-8 p-0"
                    >
                      {totalPages}
                    </Button>
                  </>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {totalPages > 10 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Go to:</span>
                <Input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => {
                    const page = parseInt(e.target.value);
                    if (page >= 1 && page <= totalPages) {
                      setCurrentPage(page);
                    }
                  }}
                  className="w-16 h-8"
                />
                <span className="text-sm text-muted-foreground">
                  of {totalPages}
                </span>
              </div>
            )}
          </div>

          {/* Keyboard navigation hint */}
          {totalPages > 1 && (
            <div className="text-xs text-muted-foreground mt-2 sm:mt-0">
              Use Ctrl/Cmd + ← → for quick navigation
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function OpportunitiesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <OpportunitiesContent />
    </Suspense>
  );
}
