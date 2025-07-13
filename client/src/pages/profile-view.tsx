import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import GlowingButton from "@/components/glowing-button";
import ProfileAvatar from "@/components/profile-avatar";
import { ArrowLeft, Share, UserPlus, Mail, Phone, ExternalLink } from "lucide-react";
import { FaLinkedin, FaGithub, FaTwitter, FaInstagram, FaWhatsapp } from "react-icons/fa";

export default function ProfileView() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["/api/profile", id],
    enabled: !!id,
  });

  const saveConnectionMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/connections", {
        toUserId: profile.userId,
        toProfileId: profile.id,
        scanMethod: "link",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
      toast({
        title: "Success",
        description: "Connection saved successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save connection",
        variant: "destructive",
      });
    },
  });

  const handleShareProfile = () => {
    if (navigator.share) {
      navigator.share({
        title: `${profile.name}'s Digital Business Card`,
        text: `Connect with ${profile.name} on NXC Badge`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "Profile link copied to clipboard",
      });
    }
  };

  const handleSaveConnection = () => {
    saveConnectionMutation.mutate();
  };

  const handleSendMessage = () => {
    const email = profile.socialLinks?.email || "";
    if (email) {
      window.open(`mailto:${email}`, "_blank");
    } else {
      toast({
        title: "No Email",
        description: "No email address available for this contact",
      });
    }
  };

  const getSocialIcon = (platform: string) => {
    const iconProps = { size: 20, className: "text-white" };
    switch (platform) {
      case "linkedin":
        return <FaLinkedin {...iconProps} />;
      case "github":
        return <FaGithub {...iconProps} />;
      case "twitter":
        return <FaTwitter {...iconProps} />;
      case "instagram":
        return <FaInstagram {...iconProps} />;
      case "whatsapp":
        return <FaWhatsapp {...iconProps} />;
      default:
        return null;
    }
  };

  const getSocialColor = (platform: string) => {
    switch (platform) {
      case "linkedin":
        return "bg-blue-600";
      case "github":
        return "bg-gray-900";
      case "twitter":
        return "bg-blue-400";
      case "instagram":
        return "bg-gradient-to-r from-purple-500 to-pink-500";
      case "whatsapp":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const openSocialLink = (platform: string, username: string) => {
    const urls = {
      linkedin: `https://linkedin.com/in/${username}`,
      github: `https://github.com/${username}`,
      twitter: `https://twitter.com/${username}`,
      instagram: `https://instagram.com/${username}`,
      whatsapp: `https://wa.me/${username.replace(/[^0-9]/g, "")}`,
    };
    
    const url = urls[platform as keyof typeof urls];
    if (url) {
      window.open(url, "_blank");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-card border-border">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Profile Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The profile you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => setLocation("/")} variant="outline">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 pb-24 slide-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setLocation("/")}
          className="border-border"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-semibold">Profile</h1>
        <Button
          variant="outline"
          size="icon"
          onClick={handleShareProfile}
          className="border-border"
        >
          <Share className="h-4 w-4 text-primary" />
        </Button>
      </div>

      {/* Profile Header */}
      <div className="text-center mb-8">
        <ProfileAvatar
          src="/placeholder-avatar.jpg"
          alt={profile.name}
          className="w-32 h-32 mx-auto mb-4 border-4 border-primary shadow-lg shadow-primary/20"
        />
        <h2 className="text-2xl font-bold mb-1">{profile.name}</h2>
        <p className="text-primary text-lg mb-2">{profile.profession}</p>
        <p className="text-muted-foreground mb-4">{profile.company}</p>
        <p className="text-foreground/80 leading-relaxed">{profile.bio}</p>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <GlowingButton
          onClick={handleSaveConnection}
          disabled={saveConnectionMutation.isPending}
          className="bg-gradient-to-r from-primary to-secondary text-black"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          {saveConnectionMutation.isPending ? "Saving..." : "Save Contact"}
        </GlowingButton>
        <GlowingButton
          onClick={handleSendMessage}
          variant="outline"
          className="border-primary text-primary hover:bg-primary hover:text-black"
        >
          <Mail className="w-4 h-4 mr-2" />
          Connect
        </GlowingButton>
      </div>

      {/* Contact Information */}
      <Card className="bg-card border-border mb-8">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Contact Information</h3>
          <div className="space-y-4">
            {profile.phone && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                  <Phone className="text-primary" size={16} />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Phone</p>
                  <p className="font-medium">{profile.phone}</p>
                </div>
              </div>
            )}
            {profile.website && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary/20 rounded-xl flex items-center justify-center">
                  <ExternalLink className="text-secondary" size={16} />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Website</p>
                  <a 
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-secondary hover:underline"
                  >
                    {profile.website}
                  </a>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Social Links */}
      {profile.socialLinks && Object.entries(profile.socialLinks).some(([, value]) => value) && (
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Social Links</h3>
            <div className="grid grid-cols-4 gap-4">
              {Object.entries(profile.socialLinks)
                .filter(([, value]) => value)
                .map(([platform, username]) => (
                  <button
                    key={platform}
                    onClick={() => openSocialLink(platform, username as string)}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${getSocialColor(platform)}`}
                  >
                    {getSocialIcon(platform)}
                  </button>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
