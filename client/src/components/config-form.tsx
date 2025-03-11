import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertConfigSchema } from "@shared/schema";
import type { Config } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

interface ConfigFormProps {
  config: Config | null;
  onSubmit: (data: any) => void;
  isPending: boolean;
}

export default function ConfigForm({ config, onSubmit, isPending }: ConfigFormProps) {
  const form = useForm({
    resolver: zodResolver(insertConfigSchema),
    defaultValues: config || {
      twitchChannel: "",
      twitchUsername: "",
      twitchToken: "",
      enabled: true,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="twitchChannel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Twitch Channel</FormLabel>
              <FormControl>
                <Input placeholder="channel name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="twitchUsername"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bot Username</FormLabel>
              <FormControl>
                <Input placeholder="bot username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="twitchToken"
          render={({ field }) => (
            <FormItem>
              <FormLabel>OAuth Token</FormLabel>
              <FormControl>
                <Input type="password" placeholder="oauth:xxxxx" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="enabled"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2">
              <FormLabel>Enable Bot</FormLabel>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save Configuration"}
        </Button>
      </form>
    </Form>
  );
}
