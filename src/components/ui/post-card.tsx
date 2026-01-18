"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HoverProfileCard } from "@/components/ui/hover-profile-card";
import { cn } from "@/lib/utils";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Send,
  ThumbsUp,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";

export interface PostComment {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  content: string;
  createdAt: Date;
  likes: string[];
}

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  userRole?: "employer" | "employee";
  userTitle?: string;
  content: string;
  imageUrl?: string;
  likes: string[];
  comments: PostComment[];
  shares: number;
  createdAt: Date;
}

interface PostCardProps {
  post: Post;
  currentUserId: string;
  onLike: (postId: string) => void;
  onComment: (postId: string, content: string) => void;
  onShare: (postId: string) => void;
  onBookmark?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  isBookmarked?: boolean;
}

export function PostCard({
  post,
  currentUserId,
  onLike,
  onComment,
  onShare,
  onBookmark,
  onDelete,
  isBookmarked = false,
}: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLiked = post.likes.includes(currentUserId);
  const isOwner = post.userId === currentUserId;

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;
    setIsSubmitting(true);
    await onComment(post.id, commentText);
    setCommentText("");
    setIsSubmitting(false);
  };

  const formatDate = (date: Date) => {
    try {
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return "Recently";
    }
  };

  return (
    <Card className="w-full rounded-2xl border border-border/50 bg-card p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <HoverProfileCard 
            userId={post.userId} 
            userName={post.userName}
            userPhoto={post.userPhoto}
            userRole={post.userRole}
          >
            <Link href={`/users/${post.userId}`}>
              <Avatar className="h-12 w-12 cursor-pointer hover:opacity-80 transition-opacity">
                <AvatarImage src={post.userPhoto} alt={post.userName} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold">
                  {post.userName?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </Link>
          </HoverProfileCard>
          <div>
            <Link 
              href={`/users/${post.userId}`}
              className="font-semibold text-foreground hover:underline hover:text-primary transition-colors"
            >
              {post.userName}
            </Link>
            <p className="text-sm text-muted-foreground">
              {post.userTitle || (post.userRole === "employer" ? "Employer" : "Job Seeker")}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDate(post.createdAt)}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl">
            {onBookmark && (
              <DropdownMenuItem onClick={() => onBookmark(post.id)}>
                <Bookmark className={cn("h-4 w-4 mr-2", isBookmarked && "fill-current")} />
                {isBookmarked ? "Unsave" : "Save"}
              </DropdownMenuItem>
            )}
            {isOwner && onDelete && (
              <DropdownMenuItem 
                onClick={() => onDelete(post.id)}
                className="text-destructive focus:text-destructive"
              >
                Delete post
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content */}
      <div className="mt-4">
        <p className="text-foreground whitespace-pre-wrap leading-relaxed">
          {post.content}
        </p>
        {post.imageUrl && (
          <div className="mt-4 rounded-xl overflow-hidden">
            <img
              src={post.imageUrl}
              alt="Post image"
              className="w-full object-cover max-h-[400px]"
            />
          </div>
        )}
      </div>

      {/* Stats */}
      {(post.likes.length > 0 || post.comments.length > 0 || post.shares > 0) && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground border-b border-border/50 pb-3">
          <div className="flex items-center gap-1">
            {post.likes.length > 0 && (
              <>
                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500">
                  <ThumbsUp className="h-3 w-3 text-white" />
                </div>
                <span>{post.likes.length}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            {post.comments.length > 0 && (
              <button
                onClick={() => setShowComments(!showComments)}
                className="hover:text-foreground hover:underline"
              >
                {post.comments.length} comment{post.comments.length !== 1 ? "s" : ""}
              </button>
            )}
            {post.shares > 0 && (
              <span>{post.shares} share{post.shares !== 1 ? "s" : ""}</span>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-3 flex items-center justify-between border-b border-border/50 pb-3">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "flex-1 gap-2 rounded-xl",
            isLiked && "text-blue-500 hover:text-blue-600"
          )}
          onClick={() => onLike(post.id)}
        >
          <ThumbsUp className={cn("h-5 w-5", isLiked && "fill-current")} />
          <span className="hidden sm:inline">Like</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="flex-1 gap-2 rounded-xl"
          onClick={() => setShowComments(!showComments)}
        >
          <MessageCircle className="h-5 w-5" />
          <span className="hidden sm:inline">Comment</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="flex-1 gap-2 rounded-xl"
          onClick={() => onShare(post.id)}
        >
          <Share2 className="h-5 w-5" />
          <span className="hidden sm:inline">Share</span>
        </Button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 space-y-4">
          {/* Comment Input */}
          <div className="flex gap-3">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                You
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 flex gap-2">
              <Textarea
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="min-h-[40px] rounded-xl resize-none"
                rows={1}
              />
              <Button
                size="icon"
                className="rounded-xl h-10 w-10"
                onClick={handleSubmitComment}
                disabled={!commentText.trim() || isSubmitting}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Comments List */}
          {post.comments.length > 0 && (
            <div className="space-y-3">
              {post.comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Link href={`/users/${comment.userId}`}>
                    <Avatar className="h-8 w-8 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
                      <AvatarImage src={comment.userPhoto} />
                      <AvatarFallback className="bg-muted text-xs">
                        {comment.userName?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 bg-muted/50 rounded-xl p-3">
                    <Link 
                      href={`/users/${comment.userId}`}
                      className="text-sm font-semibold hover:underline hover:text-primary transition-colors"
                    >
                      {comment.userName}
                    </Link>
                    <p className="text-sm text-foreground">{comment.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(comment.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
