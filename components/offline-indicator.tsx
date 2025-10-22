"use client";

import { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);

  useEffect(() => {
    // Set initial online status
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineAlert(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineAlert(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline && !showOfflineAlert) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
      <Alert
        className={cn(
          "border-2 shadow-lg transition-all duration-300",
          isOnline
            ? "bg-green-50 border-green-500 dark:bg-green-950"
            : "bg-orange-50 border-orange-500 dark:bg-orange-950"
        )}
      >
        <div className="flex items-start gap-3">
          {isOnline ? (
            <Wifi className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
          ) : (
            <WifiOff className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
          )}
          <div className="flex-1">
            <AlertTitle className={cn(
              "font-semibold mb-1",
              isOnline
                ? "text-green-800 dark:text-green-300"
                : "text-orange-800 dark:text-orange-300"
            )}>
              {isOnline ? "Back Online" : "You're Offline"}
            </AlertTitle>
            <AlertDescription className={cn(
              "text-sm",
              isOnline
                ? "text-green-700 dark:text-green-400"
                : "text-orange-700 dark:text-orange-400"
            )}>
              {isOnline
                ? "Your connection has been restored. You can now start new conversations."
                : "Real-time conversations require an internet connection. You can still view your conversation history."}
            </AlertDescription>
          </div>
        </div>
      </Alert>
    </div>
  );
}
