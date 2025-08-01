"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PlusCircle, Eye, Briefcase, Zap, Settings } from "lucide-react";

export function HeaderQuickActions() {
  const { role, loading } = useAuth();

  if (loading || role !== "employer") {
    return null;
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        {/* Mobile: Show most important action as button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" asChild className="md:hidden">
              <Link href="/employer/postings/new">
                <PlusCircle className="h-4 w-4" />
                <span className="sr-only">Post New Job</span>
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Post New Job</p>
          </TooltipContent>
        </Tooltip>

        {/* Desktop: Show dropdown with all actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="hidden md:flex">
              <Zap className="h-4 w-4 mr-2" />
              Quick Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Employer Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/employer/profile">
                <Eye className="h-4 w-4 mr-2" />
                View Company Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/employer/postings/new">
                <PlusCircle className="h-4 w-4 mr-2" />
                Post New Job
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/employer/postings">
                <Briefcase className="h-4 w-4 mr-2" />
                Manage All Postings
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </TooltipProvider>
  );
}
