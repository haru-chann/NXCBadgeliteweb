import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, Wifi, Users, User } from "lucide-react";

export default function BottomNavigation() {
  const [location, setLocation] = useLocation();

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/scan", icon: Wifi, label: "Scan" },
    { path: "/connections", icon: Users, label: "Contacts" },
    { path: "/profile/edit", icon: User, label: "Profile" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-6 py-4 z-50">
      <div className="flex justify-around">
        {navItems.map((item) => {
          const isActive = location === item.path;
          const Icon = item.icon;
          
          return (
            <Button
              key={item.path}
              variant="ghost"
              size="sm"
              onClick={() => setLocation(item.path)}
              className={`flex flex-col items-center gap-1 h-auto py-2 px-3 ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon size={20} />
              <span className="text-xs">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
