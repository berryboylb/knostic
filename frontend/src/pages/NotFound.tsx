import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { HomeIcon } from "lucide-react";

export const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center max-w-md px-4">
        <h1 className="text-7xl font-bold text-primary mb-6">404</h1>
        <p className="text-xl mb-8">
          The page you are looking for does not exist or has been moved.
        </p>
        <Button asChild className="gap-2">
          <a href="/">
            <HomeIcon size={16} />
            <span>Return to Dashboard</span>
          </a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
