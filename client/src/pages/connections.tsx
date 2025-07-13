import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import ProfileAvatar from "@/components/profile-avatar";
import { ArrowLeft, Search, Star, Github, Linkedin, Instagram, Twitter } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

export default function Connections() {
  const { isLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: connections = [], isLoading: connectionsLoading } = useQuery({
    queryKey: ["/api/connections"],
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
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (connectionId: number) => {
      await apiRequest("PATCH", `/api/connections/${connectionId}/favorite`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/stats"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update favorite status",
        variant: "destructive",
      });
    },
  });

  const filteredConnections = connections.filter((connection: any) =>
    connection.toUser?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    connection.toUser?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    connection.toProfile?.profession?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    connection.toProfile?.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleFavorite = (e: React.MouseEvent, connectionId: number) => {
    e.stopPropagation();
    toggleFavoriteMutation.mutate(connectionId);
  };

  const handleViewProfile = (connection: any) => {
    if (connection.toProfile?.id) {
      setLocation(`/profile/${connection.toProfile.id}`);
    }
  };

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case "linkedin":
        return <Linkedin className="text-blue-500" size={16} />;
      case "github":
        return <Github className="text-gray-400" size={16} />;
      case "instagram":
        return <Instagram className="text-pink-400" size={16} />;
      case "twitter":
        return <Twitter className="text-blue-400" size={16} />;
      case "whatsapp":
        return <FaWhatsapp className="text-green-500" size={16} />;
      default:
        return null;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  if (isLoading || connectionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
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
        <h1 className="text-xl font-semibold">Connections</h1>
        <Button
          variant="outline"
          size="icon"
          className="border-border"
          onClick={() => document.getElementById("search")?.focus()}
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Input
            id="search"
            type="text"
            placeholder="Search connections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-card border-border pl-12 focus:border-primary"
          />
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
        </div>
      </div>

      {/* Connection Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card className="bg-card border-border text-center">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-primary">{stats?.connections?.total || 0}</p>
            <p className="text-muted-foreground text-sm">Total</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border text-center">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-secondary">{stats?.connections?.thisWeek || 0}</p>
            <p className="text-muted-foreground text-sm">This Week</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border text-center">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-primary">{stats?.connections?.favorites || 0}</p>
            <p className="text-muted-foreground text-sm">Favorites</p>
          </CardContent>
        </Card>
      </div>

      {/* Connections List */}
      <div className="space-y-4">
        {filteredConnections.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                {searchQuery ? "No connections found matching your search." : "No connections yet. Start networking!"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredConnections.map((connection: any) => (
            <Card 
              key={connection.id}
              className="bg-card border-border cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1"
              onClick={() => handleViewProfile(connection)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <ProfileAvatar
                    src={connection.toUser?.profileImageUrl}
                    alt={`${connection.toUser?.firstName} ${connection.toUser?.lastName}`}
                    className="w-16 h-16"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">
                        {connection.toUser?.firstName} {connection.toUser?.lastName}
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleToggleFavorite(e, connection.id)}
                        className="p-1 h-auto"
                      >
                        <Star 
                          className={connection.isFavorite ? "text-primary fill-current" : "text-muted-foreground"}
                          size={16}
                        />
                      </Button>
                    </div>
                    <p className="text-muted-foreground text-sm">{connection.toProfile?.profession}</p>
                    <p className="text-muted-foreground text-xs mt-1">{connection.toProfile?.company}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-secondary text-xs">
                        Connected {formatTimeAgo(connection.connectedAt)}
                      </span>
                      <div className="flex gap-2">
                        {connection.toProfile?.socialLinks && 
                          Object.entries(connection.toProfile.socialLinks)
                            .filter(([, value]) => value)
                            .slice(0, 3)
                            .map(([platform]) => (
                              <span key={platform}>
                                {getSocialIcon(platform)}
                              </span>
                            ))
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
