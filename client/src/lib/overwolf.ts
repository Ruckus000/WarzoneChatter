import { sendMessage } from "./twitch";
import type { Config } from "@shared/schema";

declare global {
  interface Window {
    overwolf: any;
  }
}

let currentKills = 0;
let config: Config | null = null;

export function initializeOverwolf(botConfig: Config) {
  config = botConfig;
  
  if (!window.overwolf) {
    throw new Error("Overwolf not detected");
  }

  const gameId = 21652; // Call of Duty: Warzone game ID

  window.overwolf.games.events.setRequiredFeatures(gameId, [
    "kill",
    "death",
    "match_end"
  ], (status: string) => {
    if (status === "error") {
      throw new Error("Failed to set required features");
    }

    window.overwolf.games.events.onNewEvents.addListener((event: any) => {
      if (!config?.enabled) return;

      if (event.events) {
        event.events.forEach((evt: any) => {
          switch (evt.name) {
            case "kill":
              currentKills++;
              const killMessage = config.killMessageTemplate.replace("(kills)", String(currentKills));
              sendMessage(killMessage);
              break;
            case "death":
              sendMessage(config.deathMessageTemplate);
              break;
            case "match_end":
              const endMessage = config.matchEndMessageTemplate.replace("(kills)", String(currentKills));
              sendMessage(endMessage);
              currentKills = 0;
              break;
          }
        });
      }
    });
  });
}

export function updateConfig(newConfig: Config) {
  config = newConfig;
}
