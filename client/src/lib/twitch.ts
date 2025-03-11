import { Client } from "tmi.js";
import type { Config } from "@shared/schema";

let twitchClient: Client | null = null;

export async function connectTwitchBot(config: Config) {
  if (twitchClient) {
    await twitchClient.disconnect();
  }

  twitchClient = new Client({
    options: { debug: true },
    identity: {
      username: config.twitchUsername,
      password: config.twitchToken,
    },
    channels: [config.twitchChannel],
  });

  await twitchClient.connect();
  return twitchClient;
}

export function sendMessage(message: string) {
  if (!twitchClient) {
    throw new Error("Twitch client not connected");
  }

  return twitchClient.say(twitchClient.channels[0], message);
}

export function disconnectTwitchBot() {
  if (twitchClient) {
    twitchClient.disconnect();
    twitchClient = null;
  }
}
