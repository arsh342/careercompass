"use client";

import { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import {
  Image as ImageIcon,
  Video,
  FileText,
  Calendar,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CreatePostProps {
  onPost: (content: string, imageUrl?: string) => Promise<void>;
}

export function CreatePost({ onPost }: CreatePostProps) {
  const { user, userProfile } = useAuth();
  const [content, setContent] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePost = async () => {
    if (!content.trim()) return;
    
    setIsPosting(true);
    try {
      await onPost(content, imagePreview || undefined);
      setContent("");
      setImagePreview(null);
      setIsExpanded(false);
    } catch (error) {
      console.error("Error creating post:", error);
    } finally {
      setIsPosting(false);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Card className="w-full rounded-2xl border border-border/50 bg-card p-4 shadow-sm">
      <div className="flex gap-3">
        <Avatar className="h-12 w-12 flex-shrink-0">
          <AvatarImage src={user?.photoURL || userProfile?.photoURL} />
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold">
            {userProfile?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          {!isExpanded ? (
            <button
              onClick={() => setIsExpanded(true)}
              className="w-full text-left px-4 py-3 rounded-full border border-border hover:bg-muted/50 transition-colors text-muted-foreground"
            >
              Start a post...
            </button>
          ) : (
            <div className="space-y-3">
              <Textarea
                placeholder="What do you want to talk about?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[100px] resize-none rounded-xl border-0 bg-transparent p-0 focus-visible:ring-0 text-base"
                autoFocus
              />

              {/* Image Preview */}
              {imagePreview && (
                <div className="relative rounded-xl overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full max-h-[300px] object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 rounded-full"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {isExpanded && (
        <>
          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-xl gap-2 text-muted-foreground hover:text-foreground"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="h-5 w-5 text-blue-500" />
                  <span className="hidden sm:inline">Photo</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-xl gap-2 text-muted-foreground hover:text-foreground"
                  disabled
                >
                  <Video className="h-5 w-5 text-green-500" />
                  <span className="hidden sm:inline">Video</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-xl gap-2 text-muted-foreground hover:text-foreground"
                  disabled
                >
                  <FileText className="h-5 w-5 text-orange-500" />
                  <span className="hidden sm:inline">Document</span>
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsExpanded(false);
                    setContent("");
                    setImagePreview(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="rounded-full px-6"
                  onClick={handlePost}
                  disabled={!content.trim() || isPosting}
                >
                  {isPosting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Post"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
