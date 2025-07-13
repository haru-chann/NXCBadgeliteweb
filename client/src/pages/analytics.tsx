import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import GlowingButton from "@/components/glowing-button";
import { ArrowLeft, Download, FileText, BarChart } from "lucide-react";

export default function Analytics() {
  const { isLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

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

  const handleDownloadCSV = () => {
    // Generate CSV data
    const csvData = [
      "Date,Views,Connections,Device Type",
      `${new Date().toLocaleDateString()},${stats?.views?.todayViews || 0},${stats?.connections?.thisWeek || 0},Mobile`,
      // Add more data rows as needed
    ].join("\n");

    const blob = new Blob([csvData], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nxc-analytics.csv";
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "CSV report downloaded successfully",
    });
  };

  const handleDownloadPDF = () => {
    toast({
      title: "PDF Export",
      description: "PDF export functionality would be implemented here",
    });
  };

  // Mock profession data
  const professionStats = [
    { profession: "Software Engineers", percentage: 35, color: "primary" },
    { profession: "Product Managers", percentage: 28, color: "secondary" },
    { profession: "Designers", percentage: 18, color: "primary" },
    { profession: "Others", percentage: 19, color: "secondary" },
  ];

  // Mock geographic data
  const geographicStats = [
    { country: "🇺🇸 United States", percentage: 45, color: "primary" },
    { country: "🇮🇳 India", percentage: 22, color: "secondary" },
    { country: "🇬🇧 United Kingdom", percentage: 18, color: "primary" },
    { country: "🇩🇪 Germany", percentage: 15, color: "secondary" },
  ];

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
        <h1 className="text-xl font-semibold">Analytics</h1>
        <Button
          variant="outline"
          size="icon"
          onClick={handleDownloadCSV}
          className="border-border"
        >
          <Download className="h-4 w-4 text-primary" />
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Card className="bg-card border-border text-center">
          <CardContent className="p-6">
            <p className="text-3xl font-bold text-primary mb-1">
              {stats?.views?.totalViews || 342}
            </p>
            <p className="text-muted-foreground text-sm">Total Views</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border text-center">
          <CardContent className="p-6">
            <p className="text-3xl font-bold text-secondary mb-1">
              {stats?.connections?.total || 28}
            </p>
            <p className="text-muted-foreground text-sm">Connections</p>
          </CardContent>
        </Card>
      </div>

      {/* Profession Analytics */}
      <Card className="bg-card border-border mb-8">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Who's Viewing Your Profile</h3>
          <div className="space-y-4">
            {professionStats.map((stat, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-muted-foreground">{stat.profession}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-background rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        stat.color === "primary" ? "bg-primary" : "bg-secondary"
                      }`}
                      style={{ width: `${stat.percentage}%` }}
                    />
                  </div>
                  <span className={`font-medium ${
                    stat.color === "primary" ? "text-primary" : "text-secondary"
                  }`}>
                    {stat.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Geographic Distribution */}
      <Card className="bg-card border-border mb-8">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Geographic Distribution</h3>
          <div className="space-y-3">
            {geographicStats.map((stat, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-muted-foreground">{stat.country}</span>
                <span className={`font-medium ${
                  stat.color === "primary" ? "text-primary" : "text-secondary"
                }`}>
                  {stat.percentage}%
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Export Data</h3>
          <div className="space-y-3">
            <GlowingButton
              onClick={handleDownloadCSV}
              variant="outline"
              className="w-full border-primary text-primary hover:bg-primary hover:text-black"
            >
              <FileText className="w-4 h-4 mr-2" />
              Download CSV Report
            </GlowingButton>
            <GlowingButton
              onClick={handleDownloadPDF}
              variant="outline"
              className="w-full border-secondary text-secondary hover:bg-secondary hover:text-black"
            >
              <BarChart className="w-4 h-4 mr-2" />
              Download PDF Summary
            </GlowingButton>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
