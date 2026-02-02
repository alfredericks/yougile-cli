import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { join, dirname } from 'path';

export interface YougileConfig {
  apiKey: string;
  apiHost: string;
  defaultProjectId?: string;
  defaultProjectName?: string;
  defaultBoardId?: string;
  defaultBoardName?: string;
  defaultColumnId?: string;
  defaultColumnName?: string;
}

const CONFIG_DIR = join(homedir(), '.config', 'yougile');
const CONFIG_PATH = join(CONFIG_DIR, 'config.json');

export function getConfigPath(): string {
  return CONFIG_PATH;
}

export function loadConfig(): YougileConfig | null {
  if (!existsSync(CONFIG_PATH)) {
    return null;
  }
  try {
    const data = readFileSync(CONFIG_PATH, 'utf-8');
    return JSON.parse(data) as YougileConfig;
  } catch {
    return null;
  }
}

export function saveConfig(config: YougileConfig): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

export function hasConfig(): boolean {
  const config = loadConfig();
  return config !== null && !!config.apiKey;
}
