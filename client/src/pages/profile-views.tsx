import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { ArrowLeft, User, Smartphone, Monitor, Clock } from "lucide-react";

export default function ProfileViews() {
  const { isLoading, isAuthenticated } = useAuth();
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

  const { data: views = [] } = useQuery({
    queryKey: ["/api/analytics/views", profile?.id],
    enabled: isAuthenticated && !!profile?.id,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getDeviceIcon = (userAgent: string) => {
    if (userAgent.includes("Mobile") || userAgent.includes("Android")) {
      return <Smartphone className="text-secondary" size={16} />;
    }
    return <Monitor className="text-primary" size={16} />;
  };

  const getLocationFromIP = (ipAddress: string) => {
    // In a real app, you'd use a geolocation service
    return "Unknown Location";
  };

  const getDeviceInfo = (userAgent: string) => {
    if (userAgent.includes("Chrome")) return "Chrome";
    if (userAgent.includes("Firefox")) return "Firefox";
    if (userAgent.includes("Safari")) return "Safari";
    if (userAgent.includes("Edge")) return "Edge";
    return "Unknown Browser";
  };

  const formatViewDuration = (seconds: number | null) => {
    if (!seconds) return "Quick view";
    if (seconds < 60) return `${seconds}s view`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s view`;
  };

  // Generate chart data for the last 7 days
  const generateChartData = () => {
    const days = 7;
    const chartData = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      const dayViews = views.filter((view: any) => {
        const viewDate = new Date(view.viewedAt);
        return viewDate.toDateString() === date.toDateString();
      }).length;
      
      chartData.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        views: dayViews,
      });
    }
    
    return chartData;
  };

  const chartData = generateChartData();
  const maxViews = Math.max(...chartData.map(d => d.views), 1);

  if (isLoading) {
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
        <h1 className="text-xl font-semibold">Profile Views</h1>
        <div></div>
      </div>

      {/* View Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Card className="bg-card border-border text-center">
          <CardContent className="p-6">
            <p className="text-3xl font-bold text-primary mb-1">
              {stats?.views?.todayViews || 0}
            </p>
            <p className="text-muted-foreground text-sm">Today</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border text-center">
          <CardContent className="p-6">
            <p className="text-3xl font-bold text-secondary mb-1">
              {stats?.views?.weekViews || 0}
            </p>
            <p className="text-muted-foreground text-sm">This Week</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart Preview */}
      <Card className="bg-card border-border mb-8">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Views Over Time</h3>
          <div className="h-40 bg-background rounded-lg flex items-end justify-center gap-2 p-4">
            {chartData.map((data, index) => (
              <div key={index} className="flex flex-col items-center gap-2">
                <div 
                  className={`w-8 rounded-t transition-all duration-300 ${
                    index % 2 === 0 
                      ? "bg-gradient-to-t from-primary to-primary/50" 
                      : "bg-gradient-to-t from-secondary to-secondary/50"
                  }`}
                  style={{ 
                    height: `${Math.max((data.views / maxViews) * 120, 8)}px` 
                  }}
                />
                <span className="text-xs text-muted-foreground">{data.day}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-muted-foreground text-sm mt-2">Last 7 days</p>
        </CardContent>
      </Card>

      {/* Recent Views List */}
      <div>
        <h3 className="font-semibold mb-4">Recent Views</h3>
        <div className="space-y-3">
          {views.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No profile views yet.</p>
              </CardContent>
            </Card>
          ) : (
            views.slice(0, 10).map((view: any, index: number) => (
              <Card key={view.id || index} className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        index % 2 === 0 ? "bg-primary/20" : "bg-secondary/20"
                      }`}>
                        <User className={index % 2 === 0 ? "text-primary" : "text-secondary"} size={16} />
                      </div>
                      <div>
                        <p className="font-medium">
                          {view.viewerLocation || getLocationFromIP(view.ipAddress)}
                        </p>
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          {getDeviceIcon(view.userAgent)}
                          <span>{getDeviceInfo(view.userAgent)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground text-sm">
                        {formatTimeAgo(view.viewedAt)}
                      </p>
                      <div className="flex items-center gap-1 text-secondary text-xs">
                        <Clock size={12} />
                        {formatViewDuration(view.viewDuration)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
