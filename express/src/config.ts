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
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    namedPlaceholders: true,
  },
  port: parseInt(process.env.PORT),
  salt: process.env.SALT,
};

export default config;
