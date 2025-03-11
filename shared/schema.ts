import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const configs = pgTable("configs", {
  id: serial("id").primaryKey(),
  twitchChannel: text("twitch_channel").notNull(),
  twitchUsername: text("twitch_username").notNull(),
  twitchToken: text("twitch_token").notNull(),
  killMessageTemplate: text("kill_message_template").notNull().default("(kills) enemies eliminated"),
  deathMessageTemplate: text("death_message_template").notNull().default("Defeated in battle"),
  matchEndMessageTemplate: text("match_end_message_template").notNull().default("Match complete with (kills) kills"),
  enabled: boolean("enabled").notNull().default(true)
});

export const insertConfigSchema = createInsertSchema(configs).omit({ 
  id: true 
});

export type InsertConfig = z.infer<typeof insertConfigSchema>;
export type Config = typeof configs.$inferSelect;
