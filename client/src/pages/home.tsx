import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import GlowingButton from "@/components/glowing-button";
import ProfileAvatar from "@/components/profile-avatar";
import { 
  User, 
  Wifi, 
  Users, 
  Eye, 
  BarChart3, 
  Share,
} from "lucide-react";

export default function Home() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: profile } = useQuery({
    queryKey: ["/api/profile"],
    enabled: isAuthenticated,
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/analytics/stats"],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Please log in.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/"; // Redirect to landing/login page
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleShareProfile = () => {
    if (navigator.share && profile) {
      navigator.share({
        title: `${profile.name}'s Digital Business Card`,
        text: `Connect with ${profile.name} on NXC Badge`,
        url: `${window.location.origin}/profile/${profile.id}`,
      });
    } else {
      // Fallback to copy to clipboard
      const url = `${window.location.origin}/profile/${profile?.id}`;
      navigator.clipboard.writeText(url);
      toast({
        title: "Link Copied",
        description: "Profile link copied to clipboard",
      });
    }
  };

  const userName = profile?.name || user?.firstName || "User";
  const greeting = `Hey ${userName} 👋`;

  return (
    <div className="min-h-screen p-6 pb-24 slide-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">{greeting}</h1>
          <p className="text-muted-foreground">Manage your digital presence</p>
        </div>
        <ProfileAvatar 
          src={user?.profileImageUrl} 
          alt={userName}
          className="w-12 h-12"
        />
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {/* My Profile */}
        <Card 
          className="bg-card border-border cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1"
          onClick={() => setLocation("/profile/edit")}
        >
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mb-4">
              <User className="text-primary text-xl" size={24} />
            </div>
            <h3 className="font-semibold mb-1">My Profile</h3>
            <p className="text-muted-foreground text-sm">Edit your info</p>
          </CardContent>
        </Card>

        {/* Scan NFC */}
        <Card 
          className="bg-card border-border cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-secondary/20 hover:-translate-y-1"
          onClick={() => setLocation("/scan")}
        >
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center mb-4">
              <Wifi className="text-secondary text-xl" size={24} />
            </div>
            <h3 className="font-semibold mb-1">Scan NFC</h3>
            <p className="text-muted-foreground text-sm">Read cards</p>
          </CardContent>
        </Card>

        {/* Connections */}
        <Card 
          className="bg-card border-border cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1"
          onClick={() => setLocation("/connections")}
        >
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mb-4">
              <Users className="text-primary text-xl" size={24} />
            </div>
            <h3 className="font-semibold mb-1">Connections</h3>
            <p className="text-muted-foreground text-sm">
              {stats?.connections?.total || 0} contacts
            </p>
          </CardContent>
        </Card>

        {/* Profile Views */}
        <Card 
          className="bg-card border-border cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-secondary/20 hover:-translate-y-1"
          onClick={() => setLocation("/views")}
        >
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center mb-4">
              <Eye className="text-secondary text-xl" size={24} />
            </div>
            <h3 className="font-semibold mb-1">Profile Views</h3>
            <p className="text-muted-foreground text-sm">
              {stats?.views?.totalViews || 0} views
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Card */}
      <Card 
        className="bg-card border-border cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1"
        onClick={() => setLocation("/analytics")}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Analytics</h3>
            <BarChart3 className="text-primary" size={20} />
          </div>
          <div className="flex justify-between text-sm">
            <div>
              <p className="text-muted-foreground">This Week</p>
              <p className="text-xl font-semibold text-secondary">
                {stats?.views?.weekViews || 0}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Connections</p>
              <p className="text-xl font-semibold text-primary">
                {stats?.connections?.thisWeek || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Floating Share Button */}
      <div className="fixed bottom-20 right-6">
        <GlowingButton
          onClick={handleShareProfile}
          className="w-14 h-14 bg-gradient-to-r from-primary to-secondary rounded-full p-0 floating shadow-lg"
          disabled={!profile}
        >
          <Share className="text-black" size={20} />
        </GlowingButton>
      </div>
    </div>
  );
}
