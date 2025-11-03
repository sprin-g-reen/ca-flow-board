import { cn } from "@/lib/utils";

interface FadeInProps {
  children: React.ReactNode;
  delay?: string;
  className?: string;
}

const FadeIn = ({ children, delay = "0ms", className }: FadeInProps) => {
  return (
    <div
      className={cn("animate-in fade-in duration-500", className)}
      style={{ animationDelay: delay }}
    >
      {children}
    </div>
  );
};

interface SlideInProps {
  children: React.ReactNode;
  direction?: "left" | "right" | "up" | "down";
  delay?: string;
  className?: string;
}

const SlideIn = ({ children, direction = "up", delay = "0ms", className }: SlideInProps) => {
  const directionClasses = {
    left: "slide-in-from-left",
    right: "slide-in-from-right", 
    up: "slide-in-from-bottom",
    down: "slide-in-from-top"
  };

  return (
    <div
      className={cn("animate-in", directionClasses[direction], "duration-500", className)}
      style={{ animationDelay: delay }}
    >
      {children}
    </div>
  );
};

interface ScaleInProps {
  children: React.ReactNode;
  delay?: string;
  className?: string;
}

const ScaleIn = ({ children, delay = "0ms", className }: ScaleInProps) => {
  return (
    <div
      className={cn("animate-in zoom-in-95 duration-300", className)}
      style={{ animationDelay: delay }}
    >
      {children}
    </div>
  );
};

export { FadeIn, SlideIn, ScaleIn };