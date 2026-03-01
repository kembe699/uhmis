import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import * as SonnerPrimitive from "sonner";

type ToasterProps = React.ComponentProps<typeof SonnerPrimitive.Toaster>;

// Create our custom Toaster component
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything on the server or until mounted
  if (!mounted) {
    return null;
  }

  return (
    <SonnerPrimitive.Toaster
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-right"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

// Export the toast function directly from sonner
const { toast } = SonnerPrimitive;

// Make sure to export both the Toaster component and the toast function
export { Toaster, toast };
