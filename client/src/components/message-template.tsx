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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface MessageTemplateProps {
  config: Config;
  onUpdate: (data: Partial<Config>) => void;
  isPending: boolean;
}

export default function MessageTemplate({ config, onUpdate, isPending }: MessageTemplateProps) {
  const form = useForm({
    resolver: zodResolver(insertConfigSchema.pick({
      killMessageTemplate: true,
      deathMessageTemplate: true,
      matchEndMessageTemplate: true,
    })),
    defaultValues: {
      killMessageTemplate: config.killMessageTemplate,
      deathMessageTemplate: config.deathMessageTemplate,
      matchEndMessageTemplate: config.matchEndMessageTemplate,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onUpdate)} className="space-y-6">
        <FormField
          control={form.control}
          name="killMessageTemplate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kill Message</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>
                Use (kills) to insert the current kill count
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="deathMessageTemplate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Death Message</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="matchEndMessageTemplate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Match End Message</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>
                Use (kills) to insert the final kill count
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Update Templates"}
        </Button>
      </form>
    </Form>
  );
}
