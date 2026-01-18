"use client";

import { useState, useEffect, useCallback } from "react";
import { PostCard, Post, PostComment } from "@/components/ui/post-card";
import { CreatePost } from "@/components/ui/create-post";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  arrayUnion,
  arrayRemove,
  increment,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { Loader2 } from "lucide-react";

interface FeedProps {
  className?: string;
}

export function Feed({ className }: FeedProps) {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<string>>(new Set());

  // Subscribe to posts
  useEffect(() => {
    const postsQuery = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      const postsData = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          userName: data.userName,
          userPhoto: data.userPhoto,
          userRole: data.userRole,
          userTitle: data.userTitle,
          content: data.content,
          imageUrl: data.imageUrl,
          likes: data.likes || [],
          comments: (data.comments || []).map((c: any) => ({
            ...c,
            createdAt: c.createdAt?.toDate?.() || new Date(),
          })),
          shares: data.shares || 0,
          createdAt: data.createdAt?.toDate?.() || new Date(),
        } as Post;
      });
      setPosts(postsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Helper function to convert data URL to File
  const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  // Upload image to Cloudinary via API
  const uploadToCloudinary = async (imageDataUrl: string): Promise<string | null> => {
    try {
      if (!user) return null;

      // Get Firebase auth token
      const token = await user.getIdToken();

      const file = dataURLtoFile(imageDataUrl, `post-${Date.now()}.jpg`);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", user.uid);

      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Upload error:", errorData);
        throw new Error(errorData.error || "Upload failed");
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error("Error uploading to Cloudinary:", error);
      return null;
    }
  };

  // Create a new post
  const handleCreatePost = useCallback(async (content: string, imageDataUrl?: string) => {
    if (!user || !userProfile) return;

    let imageUrl: string | null = null;

    // Upload image to Cloudinary if provided
    if (imageDataUrl) {
      imageUrl = await uploadToCloudinary(imageDataUrl);
      if (!imageUrl) {
        toast({
          title: "Image upload failed",
          description: "Post will be created without the image.",
          variant: "destructive",
        });
      }
    }

    // Build post data
    const postData: Record<string, any> = {
      userId: user.uid,
      userName: userProfile.displayName || user.email?.split("@")[0] || "User",
      userPhoto: user.photoURL || userProfile.photoURL || null,
      userRole: userProfile.role || "employee",
      userTitle: userProfile.headline || userProfile.company || null,
      content,
      imageUrl,
      likes: [],
      comments: [],
      shares: 0,
      createdAt: serverTimestamp(),
    };

    await addDoc(collection(db, "posts"), postData);

    toast({
      title: "Post created!",
      description: "Your post has been shared with the community.",
    });
  }, [user, userProfile, toast]);

  // Like/unlike a post
  const handleLike = useCallback(async (postId: string) => {
    if (!user) return;

    const postRef = doc(db, "posts", postId);
    const post = posts.find((p) => p.id === postId);
    
    if (!post) return;

    const isLiked = post.likes.includes(user.uid);
    
    await updateDoc(postRef, {
      likes: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
    });
  }, [user, posts]);

  // Add a comment
  const handleComment = useCallback(async (postId: string, content: string) => {
    if (!user || !userProfile) return;

    const postRef = doc(db, "posts", postId);
    const newComment = {
      id: `${Date.now()}_${user.uid}`,
      userId: user.uid,
      userName: userProfile.displayName || user.email?.split("@")[0] || "User",
      userPhoto: user.photoURL || userProfile.photoURL || null,
      content,
      createdAt: new Date(),
      likes: [],
    };

    await updateDoc(postRef, {
      comments: arrayUnion(newComment),
    });
  }, [user, userProfile]);

  // Share a post
  const handleShare = useCallback(async (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    // Copy post link to clipboard
    const postUrl = `${window.location.origin}/feed/post/${postId}`;
    await navigator.clipboard.writeText(postUrl);

    // Increment share count
    const postRef = doc(db, "posts", postId);
    await updateDoc(postRef, {
      shares: increment(1),
    });

    toast({
      title: "Link copied!",
      description: "Post link has been copied to your clipboard.",
    });
  }, [posts, toast]);

  // Bookmark a post
  const handleBookmark = useCallback((postId: string) => {
    setBookmarkedPosts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
        toast({ title: "Post removed from saved" });
      } else {
        newSet.add(postId);
        toast({ title: "Post saved!" });
      }
      return newSet;
    });
  }, [toast]);

  // Delete a post
  const handleDelete = useCallback(async (postId: string) => {
    await deleteDoc(doc(db, "posts", postId));
    toast({
      title: "Post deleted",
      description: "Your post has been removed.",
    });
  }, [toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-4 max-w-2xl mx-auto">
        {/* Create Post */}
        <CreatePost onPost={handleCreatePost} />

        {/* Posts Feed */}
        {posts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg font-medium">No posts yet</p>
            <p className="text-sm">Be the first to share something with the community!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={user?.uid || ""}
                onLike={handleLike}
                onComment={handleComment}
                onShare={handleShare}
                onBookmark={handleBookmark}
                onDelete={handleDelete}
                isBookmarked={bookmarkedPosts.has(post.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
