"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  ArrowLeft,
  Building,
  Mail,
  Briefcase,
  Star,
  Lightbulb,
  Target,
  Phone,
  Linkedin,
  Link as LinkIcon,
  GraduationCap,
  MapPin,
  Users,
  Grid3X3,
  Bookmark,
  MessageCircle,
  UserPlus,
  UserMinus,
  Check,
  User,
  MoreHorizontal,
  Pin,
  Camera,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostCard, Post } from "@/components/ui/post-card";
import { LumaSpin } from "@/components/ui/luma-spin";

interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: "employee" | "employer";
  photoURL?: string;
  firstName?: string;
  lastName?: string;
  headline?: string;
  location?: string;
  contactNumber?: string;
  supportEmail?: string;
  companyName?: string;
  company?: string;
  companyOverview?: string;
  education?: string;
  skills?: string;
  interests?: string;
  careerGoals?: string;
  employmentHistory?: string;
  portfolioLink?: string;
  linkedinLink?: string;
  followers?: string[];
  following?: string[];
  coverPhoto?: string;
  [key: string]: any;
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const { user, userProfile: currentUserProfile } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [uploading, setUploading] = useState(false);

  const isOwnProfile = user?.uid === id;

  // Fetch user profile
  useEffect(() => {
    if (!id) return;
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, "users", id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const profileData = docSnap.data() as UserProfile;
          setProfile(profileData);
          setFollowersCount(profileData.followers?.length || 0);
          setFollowingCount(profileData.following?.length || 0);
          setIsFollowing(profileData.followers?.includes(user?.uid || "") || false);
        } else {
          toast({
            title: "Error",
            description: "User not found.",
            variant: "destructive",
          });
          router.push("/dashboard");
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch user profile.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id, user, toast, router]);

  // Fetch user's posts
  useEffect(() => {
    if (!id) return;

    const postsQuery = query(
      collection(db, "posts"),
      where("userId", "==", id),
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
      setPostsLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  // Follow/unfollow handler
  const handleFollowToggle = useCallback(async () => {
    if (!user || !id || isOwnProfile) return;
    
    setFollowLoading(true);
    try {
      const profileRef = doc(db, "users", id as string);
      const currentUserRef = doc(db, "users", user.uid);

      if (isFollowing) {
        // Unfollow
        await updateDoc(profileRef, {
          followers: arrayRemove(user.uid),
        });
        await updateDoc(currentUserRef, {
          following: arrayRemove(id),
        });
        setIsFollowing(false);
        setFollowersCount((prev) => prev - 1);
        toast({ title: "Unfollowed" });
      } else {
        // Follow
        await updateDoc(profileRef, {
          followers: arrayUnion(user.uid),
        });
        await updateDoc(currentUserRef, {
          following: arrayUnion(id),
        });
        setIsFollowing(true);
        setFollowersCount((prev) => prev + 1);
        toast({ title: "Following!" });
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast({
        title: "Error",
        description: "Failed to update follow status.",
        variant: "destructive",
      });
    } finally {
      setFollowLoading(false);
    }
  }, [user, id, isFollowing, isOwnProfile, toast]);

  // Like handler for posts
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

  // Comment handler
  const handleComment = useCallback(async (postId: string, content: string) => {
    if (!user || !currentUserProfile) return;
    const postRef = doc(db, "posts", postId);
    const newComment = {
      id: `${Date.now()}_${user.uid}`,
      userId: user.uid,
      userName: currentUserProfile.displayName || user.email?.split("@")[0] || "User",
      userPhoto: user.photoURL || currentUserProfile.photoURL || null,
      content,
      createdAt: new Date(),
      likes: [],
    };
    await updateDoc(postRef, {
      comments: arrayUnion(newComment),
    });
  }, [user, currentUserProfile]);

  // Share handler
  const handleShare = useCallback(async (postId: string) => {
    const postUrl = `${window.location.origin}/feed/post/${postId}`;
    await navigator.clipboard.writeText(postUrl);
    toast({ title: "Link copied!" });
  }, [toast]);

  const getInitials = (name: string) =>
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("") || "";

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center min-h-[60vh]">
        <LumaSpin />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto text-center py-20">
        <h1 className="text-2xl font-bold">User not found</h1>
        <Button variant="link" className="mt-4" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  const displayName =
    profile.role === "employer"
      ? profile.companyName || profile.displayName
      : profile.displayName || `${profile.firstName} ${profile.lastName}`;

  const skillsArray = profile.skills
    ? profile.skills.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  // Get user's position/title from employment history or headline
  const getPositionTitle = () => {
    if (profile.headline) return profile.headline;
    if (profile.employmentHistory) {
      // Try to extract position from employment history (first line often has position)
      const lines = profile.employmentHistory.split('\n');
      if (lines.length > 0) {
        const firstLine = lines[0].trim();
        // Check if it looks like a job title (not too long)
        if (firstLine.length < 50 && !firstLine.toLowerCase().includes('company')) {
          return firstLine;
        }
      }
    }
    // Fallback to first skill if available
    if (skillsArray.length > 0) {
      return `${skillsArray[0]} Professional`;
    }
    return null;
  };

  const postsWithImages = posts.filter((p) => p.imageUrl);

  return (
    <div className="container mx-auto max-w-4xl pb-12">
      {/* Back Button */}
      <div className="mb-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Profile Header Card */}
      <Card className="rounded-3xl overflow-hidden mb-6">
        {/* Cover Photo */}
        {/* Cover Photo */}
        <div className="relative h-48 bg-muted/30 group">
          {profile.coverPhoto && (
            <img
              src={profile.coverPhoto}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          )}
          {isOwnProfile && (
            <>
              <Button
                variant="secondary"
                size="sm"
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => document.getElementById('banner-upload')?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Camera className="h-4 w-4 mr-2" />
                )}
                Edit Cover
              </Button>
              <input
                id="banner-upload"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !user) return;

                  setUploading(true);
                  const formData = new FormData();
                  formData.append("file", file);
                  formData.append("userId", user.uid);

                  try {
                    const response = await fetch("/api/upload", {
                      method: "POST",
                      body: formData,
                    });

                    if (!response.ok) throw new Error("Upload failed");

                    const { url } = await response.json();
                    
                    // Update profile with new cover photo
                    await updateDoc(doc(db, "users", user.uid), {
                      coverPhoto: url
                    });
                    
                    // Update local state
                    setProfile(prev => prev ? ({ ...prev, coverPhoto: url }) : null);

                    toast({
                      title: "Cover Photo Updated",
                      description: "Your new cover photo has been saved.",
                    });
                  } catch (error) {
                    toast({
                      title: "Error",
                      description: "Failed to upload cover photo.",
                      variant: "destructive",
                    });
                  } finally {
                    setUploading(false);
                  }
                }}
              />
            </>
          )}
        </div>

        <CardContent className="relative pt-0 -mt-16 px-6 pb-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            {/* Avatar */}
            <Avatar className="h-32 w-32 border-4 border-card shadow-xl">
              <AvatarImage src={profile.photoURL} alt={displayName} />
              <AvatarFallback className="text-4xl bg-muted text-muted-foreground flex items-center justify-center">
                <User className="h-16 w-16" />
              </AvatarFallback>
            </Avatar>

            {/* Name & Info */}
            <div className="flex-1 md:pb-2">
              <h1 className="text-2xl font-bold">{displayName}</h1>
              <p className="text-muted-foreground font-medium">
                {profile.headline || 
                 (profile.role === "employer" 
                   ? (profile.companyName ? `${profile.companyName}` : "Employer") 
                   : (getPositionTitle() || "Professional"))}
              </p>
              
              {/* Quick Info Row */}
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                {profile.company && (
                  <div className="flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5" />
                    <span>{profile.company}</span>
                  </div>
                )}
                {profile.education && (
                  <div className="flex items-center gap-1">
                    <GraduationCap className="h-3.5 w-3.5" />
                    <span className="line-clamp-1">{profile.education.split(',')[0]}</span>
                  </div>
                )}
                {profile.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{profile.location}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 md:pb-2">
              {!isOwnProfile ? (
                <>
                  <Button
                    onClick={handleFollowToggle}
                    disabled={followLoading}
                    className="rounded-full"
                    variant={isFollowing ? "outline" : "default"}
                  >
                    {followLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isFollowing ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Following
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Follow
                      </>
                    )}
                  </Button>
                  <Button variant="outline" className="rounded-full" asChild>
                    <a href={`mailto:${profile.email}`}>
                      <Mail className="h-4 w-4 mr-2" />
                      Message
                    </a>
                  </Button>
                </>
              ) : (
                <Button variant="outline" className="rounded-full" asChild>
                  <Link href="/profile/edit">Edit Profile</Link>
                </Button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-6 mt-6 pt-4 border-t border-border">
            <div className="text-center">
              <div className="text-xl font-bold">{posts.length}</div>
              <div className="text-sm text-muted-foreground">Posts</div>
            </div>
            <div className="text-center cursor-pointer hover:text-primary">
              <div className="text-xl font-bold">{followersCount}</div>
              <div className="text-sm text-muted-foreground">Followers</div>
            </div>
            <div className="text-center cursor-pointer hover:text-primary">
              <div className="text-xl font-bold">{followingCount}</div>
              <div className="text-sm text-muted-foreground">Following</div>
            </div>
          </div>

          {/* Bio */}
          {profile.careerGoals && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">{profile.careerGoals}</p>
            </div>
          )}

          {/* Skills */}
          {skillsArray.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {skillsArray.slice(0, 10).map((skill, index) => (
                <Badge key={index} variant="secondary" className="rounded-full">
                  {skill}
                </Badge>
              ))}
              {skillsArray.length > 10 && (
                <Badge variant="outline" className="rounded-full">
                  +{skillsArray.length - 10} more
                </Badge>
              )}
            </div>
          )}

          {/* Links */}
          {(profile.portfolioLink || profile.linkedinLink) && (
            <div className="flex gap-4 mt-4">
              {profile.portfolioLink && (
                <a
                  href={profile.portfolioLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <LinkIcon className="h-4 w-4" />
                  Portfolio
                </a>
              )}
              {profile.linkedinLink && (
                <a
                  href={profile.linkedinLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <Linkedin className="h-4 w-4" />
                  LinkedIn
                </a>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start rounded-full bg-muted/50 p-1 mb-6">
          <TabsTrigger value="posts" className="rounded-full gap-2">
            <Grid3X3 className="h-4 w-4" />
            Posts
          </TabsTrigger>
          <TabsTrigger value="about" className="rounded-full gap-2">
            <Users className="h-4 w-4" />
            About
          </TabsTrigger>
        </TabsList>

        {/* Posts Grid Tab */}
        <TabsContent value="posts" className="mt-0">
          {postsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Grid3X3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No posts yet</p>
              <p className="text-sm">
                {isOwnProfile ? "Share your first post to get started!" : "This user hasn't posted anything yet."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="relative group cursor-pointer overflow-hidden rounded-xl bg-card border border-border hover:border-primary/50 transition-all shadow-sm hover:shadow-md"
                >
                  {post.imageUrl ? (
                    // Post with image
                    <div className="aspect-square">
                      <img
                        src={post.imageUrl}
                        alt="Post"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-xs line-clamp-2">{post.content}</p>
                      </div>
                    </div>
                  ) : (
                    // Text-only post
                    <div className="aspect-square p-4 flex flex-col justify-between bg-gradient-to-br from-primary/10 to-primary/5">
                      <p className="text-sm line-clamp-6">{post.content}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Overlay with stats */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white">
                    <div className="flex items-center gap-1">
                      <Star className="h-5 w-5 fill-current" />
                      <span>{post.likes.length}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-5 w-5" />
                      <span>{post.comments.length}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* About Tab */}
        <TabsContent value="about" className="mt-0">
          <Card className="rounded-2xl">
            <CardContent className="pt-6 space-y-6">
              {profile.role === "employer" ? (
                <>
                  {profile.companyOverview && (
                    <div>
                      <h3 className="font-semibold flex items-center gap-2 mb-2">
                        <Building className="h-4 w-4 text-primary" />
                        Company Overview
                      </h3>
                      <p className="text-muted-foreground whitespace-pre-wrap">
                        {profile.companyOverview}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {profile.education && (
                    <div>
                      <h3 className="font-semibold flex items-center gap-2 mb-2">
                        <GraduationCap className="h-4 w-4 text-primary" />
                        Education
                      </h3>
                      <p className="text-muted-foreground">{profile.education}</p>
                    </div>
                  )}

                  {profile.employmentHistory && (
                    <div>
                      <h3 className="font-semibold flex items-center gap-2 mb-2">
                        <Briefcase className="h-4 w-4 text-primary" />
                        Experience
                      </h3>
                      <p className="text-muted-foreground whitespace-pre-wrap">
                        {profile.employmentHistory}
                      </p>
                    </div>
                  )}

                  {profile.interests && (
                    <div>
                      <h3 className="font-semibold flex items-center gap-2 mb-2">
                        <Lightbulb className="h-4 w-4 text-primary" />
                        Interests
                      </h3>
                      <p className="text-muted-foreground">{profile.interests}</p>
                    </div>
                  )}
                </>
              )}

              {/* Contact Info */}
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-2">
                  <Mail className="h-4 w-4 text-primary" />
                  Contact
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <a href={`mailto:${profile.email}`} className="hover:underline">
                      {profile.email}
                    </a>
                  </div>
                  {profile.contactNumber && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{profile.contactNumber}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
