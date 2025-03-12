import { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SiTwitch } from "react-icons/si";

interface AuthPopupProps {
  onClose: () => void;
}

export default function AuthPopup({ onClose }: AuthPopupProps) {
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data === "twitch-auth-success") {
        onClose();
        window.location.reload(); // Refresh to update auth state
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onClose]);

  const handleTwitchLogin = () => {
    const width = 600;
    const height = 600;
    const left = window.innerWidth / 2 - width / 2;
    const top = window.innerHeight / 2 - height / 2;

    window.open(
      "/api/auth/twitch",
      "Twitch Login",
      `width=${width},height=${height},left=${left},top=${top}`
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-[400px] p-6 relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
        
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
      </Card>
    </div>
  );
}
