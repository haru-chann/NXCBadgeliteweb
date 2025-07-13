import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileAvatarProps {
  src?: string | null;
  alt?: string;
  className?: string;
}

export default function ProfileAvatar({ src, alt = "Profile", className }: ProfileAvatarProps) {
  return (
    <Avatar className={cn("ring-2 ring-primary/20", className)}>
      <AvatarImage src={src || undefined} alt={alt} className="object-cover" />
      <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-black">
        <User size={20} />
      </AvatarFallback>
    </Avatar>
  );
}
