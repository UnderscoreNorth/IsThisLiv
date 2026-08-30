// Configuration loader that prioritizes environment variables over config.json
import configFile from "../config.json" assert { type: "json" };

interface Config {
  sql: {
    host: string;
    user: string;
    password: string;
    database: string;
    namedPlaceholders: boolean;
  };
  port: number;
  salt: string;
}

// Load config from environment variables with fallback to config.json
const config: Config = {
  sql: {
    host: process.env.DB_HOST || configFile.sql.host,
    user: process.env.DB_USER || configFile.sql.user,
    password: process.env.DB_PASSWORD || configFile.sql.password,
    database: process.env.DB_NAME || configFile.sql.database,
    namedPlaceholders: true,
  },
  port: parseInt(process.env.PORT || String(configFile.port)),
  salt: process.env.SALT || configFile.salt,
};

export default config;
