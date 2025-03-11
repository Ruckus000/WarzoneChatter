import { configs, type Config, type InsertConfig } from "@shared/schema";

export interface IStorage {
  getConfig(): Promise<Config | undefined>;
  saveConfig(config: InsertConfig): Promise<Config>;
  updateConfig(config: Partial<InsertConfig>): Promise<Config>;
}

export class MemStorage implements IStorage {
  private config?: Config;
  private currentId: number = 1;

  async getConfig(): Promise<Config | undefined> {
    return this.config;
  }

  async saveConfig(insertConfig: InsertConfig): Promise<Config> {
    const config: Config = {
      ...insertConfig,
      id: this.currentId++
    };
    this.config = config;
    return config;
  }

  async updateConfig(updateConfig: Partial<InsertConfig>): Promise<Config> {
    if (!this.config) {
      throw new Error("No config exists to update");
    }
    
    this.config = {
      ...this.config,
      ...updateConfig
    };
    
    return this.config;
  }
}

export const storage = new MemStorage();
