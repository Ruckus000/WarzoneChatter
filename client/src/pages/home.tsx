import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Power, Settings, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiTwitch } from "react-icons/si";
import ConfigForm from "@/components/config-form";
import MessageTemplate from "@/components/message-template";
import AuthPopup from "@/components/auth-popup";
import type { Config } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";

export default function Home() {
  const { toast } = useToast();
  const { isAuthenticated, user, logout, isLoading: authLoading, error } = useAuth();
  const [showAuthPopup, setShowAuthPopup] = useState(false);

  // Config query - only fetch when authenticated
  const { data: config, isLoading: configLoading } = useQuery<Config | null>({
    queryKey: ["/api/config"],
    enabled: isAuthenticated,
  });

  // Save config mutation
  const { mutate: saveConfig, isPending: isSaving } = useMutation({
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

  // Show loading state
  if (authLoading || configLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth popup when requested
  if (showAuthPopup) {
    return <AuthPopup onClose={() => setShowAuthPopup(false)} />;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Warzone Twitch Bot
        </h1>
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-lg">
                <SiTwitch className="h-5 w-5 text-[#9146FF]" />
                <span>{user?.login}</span>
              </div>
              <Button variant="outline" onClick={() => logout()}>
                Logout
              </Button>
            </>
          ) : (
            <Button
              className="bg-[#9146FF] hover:bg-[#7313FF]"
              onClick={() => setShowAuthPopup(true)}
            >
              <SiTwitch className="mr-2 h-5 w-5" />
              Connect Twitch Account
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Connection Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isAuthenticated ? (
              config && (
                <ConfigForm
                  config={config}
                  onSubmit={saveConfig}
                  isPending={isSaving}
                />
              )
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Connect your Twitch account to configure bot settings
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Message Templates
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isAuthenticated ? (
              config && (
                <MessageTemplate
                  config={config}
                  onUpdate={saveConfig}
                  isPending={isSaving}
                />
              )
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Connect your Twitch account to customize message templates
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Power className="h-5 w-5" />
              System Requirements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Make sure you have Overwolf installed and running to detect game events.
                The bot will only work when both Overwolf and Call of Duty: Warzone are running.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}