import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import ConfigForm from "@/components/config-form";
import MessageTemplate from "@/components/message-template";
import type { Config } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Home() {
  const { toast } = useToast();
  
  const { data: config, isLoading } = useQuery<Config | null>({
    queryKey: ["/api/config"],
  });

  const { mutate: saveConfig, isPending } = useMutation({
    mutationFn: async (config: Partial<Config>) => {
      const method = config.id ? "PATCH" : "POST";
      const res = await apiRequest(method, "/api/config", config);
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

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
        Warzone Twitch Bot
      </h1>

      <div className="grid gap-8">
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

        {config && (
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
