import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CreditCard, LogIn, Mail } from "lucide-react";
import GlowingButton from "@/components/glowing-button";

export default function Landing() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showSignUp, setShowSignUp] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await import("firebase/auth").then(async ({ signInWithEmailAndPassword }) => {
        const { auth } = await import("@/lib/firebase");
        await signInWithEmailAndPassword(auth, email, password);
      });
      toast({ title: "Login Successful", description: "Welcome back!", variant: "default" });
      setLocation("/home");
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Failed to sign in",
        variant: "destructive",
      });
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await import("firebase/auth").then(async ({ signInWithPopup }) => {
        const { auth, googleProvider } = await import("@/lib/firebase");
        await signInWithPopup(auth, googleProvider);
      });
      toast({ title: "Google Login Successful", description: "Welcome back!", variant: "default" });
      setLocation("/home");
    } catch (error: any) {
      toast({
        title: "Google Login Failed",
        description: error.message || "Google sign-in failed",
        variant: "destructive",
      });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await import("firebase/auth").then(async ({ createUserWithEmailAndPassword }) => {
        const { auth } = await import("@/lib/firebase");
        await createUserWithEmailAndPassword(auth, email, password);
      });
      toast({ title: "Sign Up Successful", description: "Account created!", variant: "default" });
      setLocation("/home");
    } catch (error: any) {
      toast({
        title: "Sign Up Failed",
        description: error.message || "Sign up failed",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6 bg-black">
      {/* Glowing Logo */}
      <div className="mb-12 text-center floating">
        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center pulse-glow">
          <CreditCard className="text-black text-3xl" size={32} />
        </div>
        <h1 className="text-4xl font-bold text-primary mb-2">NXC Badge</h1>
        <p className="text-muted-foreground">Digital Business Cards</p>
      </div>

      {/* Login Card */}
      <Card className="w-full max-w-md bg-card border-border shadow-lg glow-gold">
        <CardContent className="pt-6">
          <h2 className="text-2xl font-semibold text-center mb-8">Welcome Back</h2>
          
          {/* Google Sign-In Button */}
          <GlowingButton
            onClick={handleGoogleLogin}
            className="w-full bg-white text-black mb-4 flex items-center justify-center gap-3"
            variant="outline"
          >
            <img 
              src="https://developers.google.com/identity/images/g-logo.png" 
              alt="Google" 
              className="w-5 h-5"
            />
            Continue with Google
          </GlowingButton>

          <div className="flex items-center my-6">
            <Separator className="flex-1" />
            <span className="px-4 text-muted-foreground text-sm">or</span>
            <Separator className="flex-1" />
          </div>

          {/* Email/Password Form */}
          {!showSignUp ? (
            <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background border-border focus:border-primary focus:ring-primary"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-background border-border focus:border-primary focus:ring-primary"
                required
              />
            </div>
            <GlowingButton
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-secondary text-black"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Sign In
            </GlowingButton>
            <div className="text-center mt-2">
              <span className="text-sm text-muted-foreground">Don't have an account? </span>
              <button
                type="button"
                onClick={() => setShowSignUp(true)}
                className="text-primary underline text-sm"
              >
                Sign up
              </button>
            </div>
          </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email address</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background border-border focus:border-primary focus:ring-primary"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-background border-border focus:border-primary focus:ring-primary"
                  required
                />
              </div>
              <GlowingButton
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-secondary text-black"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Sign Up
              </GlowingButton>
              <div className="text-center mt-2">
                <span className="text-sm text-muted-foreground">Already have an account? </span>
                <button
                  type="button"
                  onClick={() => setShowSignUp(false)}
                  className="text-primary underline text-sm"
                >
                  Sign in
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
