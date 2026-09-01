// Configuration loader that prioritizes environment variables over config.json
// In SvelteKit, use VITE_ prefix for public environment variables

interface Config {
  api: string;
  booru: string;
}

// Import fallback config - use static import with assertion
import configFile from './config.json';

// Load config from environment variables with fallback to config.json
const config: Config = {
  api: import.meta.env.VITE_API_URL || configFile.api,
  booru: import.meta.env.VITE_BOORU_URL || configFile.booru
};

export default config;
