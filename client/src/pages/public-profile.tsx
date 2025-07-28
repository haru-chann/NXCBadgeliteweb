import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import ProfileAvatar from "@/components/profile-avatar";
import { 
  User, 
  Building, 
  Globe, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  Download,
  Share2,
  Heart,
  ExternalLink
} from "lucide-react";
import { SiLinkedin, SiGithub, SiX, SiInstagram, SiWhatsapp } from "react-icons/si";

interface Profile {
  id: number;
  userId: string;
  name: string;
  profession?: string;
  company?: string;
  bio?: string;
  phone?: string;
  website?: string;
  socialLinks?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    instagram?: string;
    whatsapp?: string;
  };
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
}

export default function PublicProfile() {
  const params = useParams();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  const profileId = params.id;

  useEffect(() => {
    if (profileId) {
      fetchProfile();
    }
  }, [profileId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response: Response = await fetch(`/api/profile/${profileId}`);
      
      if (!response.ok) {
        throw new Error("Profile not found");
      }
      
      const profileData: Profile = await response.json();
      setProfile(profileData);
      
      // Check if this is the user's own profile
      if (isAuthenticated && user && user.id === profileData.userId) {
        setIsOwnProfile(true);
      }
      
      // Record the profile view (for analytics)
      recordProfileView(profileData.id);
      
    } catch (error) {
      toast({
  title: "Profile Fetch Error",
  description: error?.message || "Error fetching profile.",
  variant: "destructive",
});
      toast({
        title: "Profile Not Found",
        description: "This profile doesn't exist or is private",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const recordProfileView = async (profileId: number) => {
    try {
      // This will record a view for analytics
      await fetch(`/api/profile/${profileId}/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAgent: navigator.userAgent,
          viewerLocation: null, // Could be enhanced with geolocation
        }),
      });
    } catch (error) {
      // Silently fail - analytics are not critical
      toast({
  title: "Profile View Error",
  description: error?.message || "Could not record profile view.",
  variant: "destructive",
});
    }
  };

  const handleConnect = async () => {
    if (!isAuthenticated) {
      // Redirect to login
      window.location.href = "/";
      return;
    }

    try {
      const response = await fetch('/api/connections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toUserId: profile?.userId,
          toProfileId: profile?.id,
          scanMethod: 'link',
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to connect");
      }

      toast({
        title: "Connected!",
        description: `You're now connected with ${profile?.name}`,
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Could not connect. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile?.name} - Digital Business Card`,
          text: `Check out ${profile?.name}'s digital business card`,
          url: url,
        });
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(url);
        toast({
          title: "Link Copied",
          description: "Profile link copied to clipboard",
        });
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(url);
      toast({
        title: "Link Copied",
        description: "Profile link copied to clipboard",
      });
    }
  };

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'linkedin': return <SiLinkedin className="w-5 h-5" />;
      case 'github': return <SiGithub className="w-5 h-5" />;
      case 'twitter': return <SiX className="w-5 h-5" />;
      case 'instagram': return <SiInstagram className="w-5 h-5" />;
      case 'whatsapp': return <SiWhatsapp className="w-5 h-5" />;
      default: return <ExternalLink className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">Profile Not Found</h2>
            <p className="text-muted-foreground mb-6">
              This profile doesn't exist or is private.
            </p>
            <Button onClick={() => window.location.href = "/"}>
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <ProfileAvatar
                src={profileUser?.profileImageUrl}
                alt={profile.name}
                className="w-16 h-16"
              />
              <div>
                <h1 className="text-2xl font-bold">{profile.name}</h1>
                {profile.profession && (
                  <p className="text-muted-foreground">{profile.profession}</p>
                )}
                {profile.company && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Building className="w-4 h-4" />
                    {profile.company}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-1" />
                Share
              </Button>
              {!isOwnProfile && (
                <Button onClick={handleConnect} size="sm">
                  <Heart className="w-4 h-4 mr-1" />
                  Connect
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Main Info */}
          <div className="space-y-6">
            {/* Bio */}
            {profile.bio && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    About
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{profile.bio}</p>
                </CardContent>
              </Card>
            )}

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <a href={`tel:${profile.phone}`} className="text-primary hover:underline">
                      {profile.phone}
                    </a>
                  </div>
                )}
                {profileUser?.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <a href={`mailto:${profileUser.email}`} className="text-primary hover:underline">
                      {profileUser.email}
                    </a>
                  </div>
                )}
                {profile.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-muted-foreground" />
                    <a 
                      href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {profile.website}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Social Links */}
          <div className="space-y-6">
            {profile.socialLinks && Object.keys(profile.socialLinks).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Social Links</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(profile.socialLinks).map(([platform, url]) => {
                      if (!url) return null;
                      return (
                        <a
                          key={platform}
                          href={url.startsWith('http') ? url : `https://${url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors"
                        >
                          {getSocialIcon(platform)}
                          <span className="capitalize">{platform}</span>
                        </a>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* App Download CTA */}
            {!isAuthenticated && (
              <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">Get NXC Badge</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create your own digital business card and start networking!
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => window.location.href = "/api/login"}>
                      Sign Up Free
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => window.location.href = "/"}>
                      Learn More
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}