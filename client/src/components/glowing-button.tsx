import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GlowingButtonProps extends ButtonProps {
  children: React.ReactNode;
}

export default function GlowingButton({ 
  children, 
  className, 
  ...props 
}: GlowingButtonProps) {
  return (
    <Button
      className={cn(
        "transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
        "hover:shadow-primary/20 focus:shadow-primary/20",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
}
