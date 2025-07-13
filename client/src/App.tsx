import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import ProfileEditor from "@/pages/profile-editor";
import ScanNFC from "@/pages/scan-nfc";
import Connections from "@/pages/connections";
import ProfileViews from "@/pages/profile-views";
import Analytics from "@/pages/analytics";
import ProfileView from "@/pages/profile-view";
import BottomNavigation from "@/components/bottom-navigation";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-black text-soft-white">
      <Switch>
        {isLoading || !isAuthenticated ? (
          <Route path="/" component={Landing} />
        ) : (
          <>
            <Route path="/" component={Home} />
            <Route path="/profile/edit" component={ProfileEditor} />
            <Route path="/scan" component={ScanNFC} />
            <Route path="/connections" component={Connections} />
            <Route path="/views" component={ProfileViews} />
            <Route path="/analytics" component={Analytics} />
            <Route path="/profile/:id" component={ProfileView} />
          </>
        )}
        <Route component={NotFound} />
      </Switch>
      
      {isAuthenticated && !isLoading && <BottomNavigation />}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="dark">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
