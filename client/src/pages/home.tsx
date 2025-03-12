import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiTwitch } from "react-icons/si";
import ConfigForm from "@/components/config-form";
import MessageTemplate from "@/components/message-template";
import type { Config } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

export default function Home() {
  const { toast } = useToast();
  const { isAuthenticated, user, logout, isLoading: authLoading, error } = useAuth();

  // Error notification effect
  useEffect(() => {
    if (error) {
      toast({
        title: "Authentication Error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Config query - always define it, but only enable when authenticated
  const { data: config } = useQuery<Config | null>({
    queryKey: ["/api/config"],
    enabled: isAuthenticated,
  });

  // Save config mutation
  const { mutate: saveConfig, isPending } = useMutation({
    mutationFn: async (config: Partial<Config>) => {
      const res = await apiRequest("PATCH", "/api/config", config);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/config"] });
      toast({
        title: "Success",
        description: "Configuration saved successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleTwitchLogin = () => {
    window.location.href = "/api/auth/twitch";
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Warzone Twitch Bot
        </h1>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-4">Connect Your Twitch Account</h2>
              <p className="text-muted-foreground mb-6">
                Login with your Twitch account to start using the Warzone bot
              </p>
              <Button
                size="lg"
                className="bg-[#9146FF] hover:bg-[#7313FF]"
                onClick={handleTwitchLogin}
              >
                <SiTwitch className="mr-2 h-5 w-5" />
                Login with Twitch
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Warzone Twitch Bot
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground">
            Connected as {user?.login}
          </span>
          <Button variant="outline" onClick={() => logout()}>
            Logout
          </Button>
        </div>
      </div>

      <div className="grid gap-8">
        {config && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Connection Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <ConfigForm
                  config={config}
                  onSubmit={saveConfig}
                  isPending={isPending}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Message Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <MessageTemplate
                  config={config}
                  onUpdate={saveConfig}
                  isPending={isPending}
                />
              </CardContent>
            </Card>
          </>
        )}

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Make sure you have Overwolf installed and running to detect game events.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}