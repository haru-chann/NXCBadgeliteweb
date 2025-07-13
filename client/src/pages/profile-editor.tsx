import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import GlowingButton from "@/components/glowing-button";
import ProfileAvatar from "@/components/profile-avatar";
import SocialLinksEditor from "@/components/social-links-editor";
import { ArrowLeft, Camera, Save } from "lucide-react";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  profession: z.string().optional(),
  company: z.string().optional(),
  bio: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  socialLinks: z.object({
    linkedin: z.string().optional(),
    github: z.string().optional(),
    twitter: z.string().optional(),
    instagram: z.string().optional(),
    whatsapp: z.string().optional(),
  }).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfileEditor() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [profileImage, setProfileImage] = useState<string>("");

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/profile"],
    enabled: isAuthenticated,
  });

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      profession: "",
      company: "",
      bio: "",
      phone: "",
      website: "",
      socialLinks: {
        linkedin: "",
        github: "",
        twitter: "",
        instagram: "",
        whatsapp: "",
      },
    },
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

  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name || "",
        profession: profile.profession || "",
        company: profile.company || "",
        bio: profile.bio || "",
        phone: profile.phone || "",
        website: profile.website || "",
        socialLinks: profile.socialLinks || {
          linkedin: "",
          github: "",
          twitter: "",
          instagram: "",
          whatsapp: "",
        },
      });
      setProfileImage(user?.profileImageUrl || "");
    } else if (user) {
      form.reset({
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        profession: "",
        company: "",
        bio: "",
        phone: "",
        website: "",
        socialLinks: {
          linkedin: "",
          github: "",
          twitter: "",
          instagram: "",
          whatsapp: "",
        },
      });
      setProfileImage(user.profileImageUrl || "");
    }
  }, [profile, user, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      await apiRequest("POST", "/api/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({
        title: "Success",
        description: "Profile saved successfully",
      });
      setLocation("/");
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
        description: "Failed to save profile",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    saveMutation.mutate(data);
  };

  const handleImageUpload = () => {
    // In a real app, this would open a file picker or camera
    toast({
      title: "Image Upload",
      description: "Image upload functionality would be implemented here",
    });
  };

  if (isLoading || profileLoading) {
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
        <h1 className="text-xl font-semibold">Edit Profile</h1>
        <Button
          variant="ghost"
          onClick={form.handleSubmit(onSubmit)}
          disabled={saveMutation.isPending}
          className="text-primary"
        >
          Save
        </Button>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Profile Image Upload */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <ProfileAvatar
              src={profileImage}
              alt="Profile"
              className="w-24 h-24 border-4 border-primary shadow-lg shadow-primary/20"
            />
            <Button
              type="button"
              size="icon"
              onClick={handleImageUpload}
              className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary rounded-full"
            >
              <Camera className="text-black text-sm" size={16} />
            </Button>
          </div>
          <p className="text-muted-foreground text-sm mt-2">Tap to change photo</p>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              {...form.register("name")}
              className="bg-card border-border focus:border-primary"
            />
            {form.formState.errors.name && (
              <p className="text-destructive text-sm">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="profession">Profession</Label>
            <Input
              id="profession"
              {...form.register("profession")}
              placeholder="e.g., UX Designer"
              className="bg-card border-border focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              {...form.register("company")}
              placeholder="e.g., Google"
              className="bg-card border-border focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              {...form.register("phone")}
              placeholder="+1 (555) 123-4567"
              className="bg-card border-border focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              {...form.register("website")}
              placeholder="https://yourwebsite.com"
              className="bg-card border-border focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              {...form.register("bio")}
              placeholder="Tell people about yourself..."
              rows={3}
              className="bg-card border-border focus:border-primary resize-none"
            />
          </div>
        </div>

        {/* Social Links */}
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Social Links</h3>
            <SocialLinksEditor 
              value={form.watch("socialLinks") || {}}
              onChange={(socialLinks) => form.setValue("socialLinks", socialLinks)}
            />
          </CardContent>
        </Card>

        {/* Save Button */}
        <GlowingButton
          type="submit"
          disabled={saveMutation.isPending}
          className="w-full bg-gradient-to-r from-primary to-secondary text-black"
        >
          <Save className="w-4 h-4 mr-2" />
          {saveMutation.isPending ? "Saving..." : "Save Profile Changes"}
        </GlowingButton>
      </form>
    </div>
  );
}
