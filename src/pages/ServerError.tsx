import { Button } from "@/components/ui/button";
import { AlertCircle, Home, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

const ServerError = () => {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6 p-8">
        <div className="space-y-2">
          <AlertCircle className="h-24 w-24 text-destructive mx-auto" />
          <h1 className="text-6xl font-bold text-foreground">500</h1>
          <h2 className="text-2xl font-semibold text-foreground">Something Went Wrong</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            We're experiencing technical difficulties. Our team has been notified and is working on it.
          </p>
        </div>
        
        <div className="flex gap-4 justify-center">
          <Button onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button variant="outline" asChild>
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ServerError;
