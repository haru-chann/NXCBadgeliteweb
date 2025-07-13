import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GripVertical } from "lucide-react";
import { FaLinkedin, FaGithub, FaTwitter, FaInstagram, FaWhatsapp } from "react-icons/fa";

interface SocialLinksEditorProps {
  value: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    instagram?: string;
    whatsapp?: string;
  };
  onChange: (socialLinks: any) => void;
}

export default function SocialLinksEditor({ value, onChange }: SocialLinksEditorProps) {
  const [links, setLinks] = useState(value);

  const socialPlatforms = [
    {
      key: "whatsapp",
      icon: FaWhatsapp,
      color: "bg-green-500",
      placeholder: "WhatsApp number",
    },
    {
      key: "github",
      icon: FaGithub,
      color: "bg-gray-900",
      placeholder: "GitHub username",
    },
    {
      key: "linkedin",
      icon: FaLinkedin,
      color: "bg-blue-600",
      placeholder: "LinkedIn profile",
    },
    {
      key: "instagram",
      icon: FaInstagram,
      color: "bg-gradient-to-r from-purple-500 to-pink-500",
      placeholder: "Instagram handle",
    },
  ];

  const handleInputChange = (platform: string, value: string) => {
    const newLinks = { ...links, [platform]: value };
    setLinks(newLinks);
    onChange(newLinks);
  };

  return (
    <div className="space-y-3">
      {socialPlatforms.map((platform) => {
        const Icon = platform.icon;
        return (
          <div
            key={platform.key}
            className="flex items-center gap-4 p-4 bg-background rounded-xl border border-border"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${platform.color}`}>
              <Icon className="text-white" size={20} />
            </div>
            <Input
              type="text"
              placeholder={platform.placeholder}
              value={links[platform.key as keyof typeof links] || ""}
              onChange={(e) => handleInputChange(platform.key, e.target.value)}
              className="flex-1 bg-transparent border-none focus:ring-0 focus:border-none"
            />
            <Button variant="ghost" size="sm" className="cursor-move p-1">
              <GripVertical className="text-muted-foreground" size={16} />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
