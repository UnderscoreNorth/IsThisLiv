// Configuration loader that prioritizes environment variables over config.json
// In SvelteKit, use VITE_ prefix for public environment variables

interface Config {
  api: string;
  booru: string;
}

// Import fallback config
let configFile: Config;
try {
  configFile = await import('./config.json').then(m => m.default);
} catch (e) {
  // If config.json doesn't exist, use empty defaults
  configFile = { api: '', booru: '' };
}

// Load config from environment variables with fallback to config.json
const config: Config = {
  api: import.meta.env.VITE_API_URL || configFile.api || 'http://localhost:3000/api',
  booru: import.meta.env.VITE_BOORU_URL || configFile.booru || 'https://isthisliv.com/booru/'
};

export default config;
