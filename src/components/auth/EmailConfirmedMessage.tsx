import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * EmailConfirmedMessage Component
 *
 * Displays a success message after email verification
 * Automatically redirects to /plans after 3 seconds
 * User can also click a button to go immediately
 */
export function EmailConfirmedMessage() {
  const [countdown, setCountdown] = useState(15);

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = "/plans";
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleGoToPlans = () => {
    window.location.href = "/plans";
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle2 className="h-16 w-16 text-green-500" />
        </div>
        <CardTitle className="text-2xl">Email Confirmed!</CardTitle>
        <CardDescription>
          Your email has been successfully verified. You can now access all features of 12 Weeks Planner.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center text-sm text-muted-foreground">
          Redirecting to your plans in {countdown} second{countdown !== 1 ? "s" : ""}...
        </div>
        <Button onClick={handleGoToPlans} className="w-full" size="lg">
          Go to Plans Now
        </Button>
      </CardContent>
    </Card>
  );
}
