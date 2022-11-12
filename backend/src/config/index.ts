import dotenv from 'dotenv';

// Load environment variables based on Stage
// https://stackoverflow.com/questions/11104028/why-is-process-env-node-env-undefined
const ENVIRONMENT = process.env.NODE_ENV ?? 'dev';
dotenv.config({ path: `.env.${ENVIRONMENT}` });

// Import Configs
import appConfig from './app.config';
import githubConfig from './github.config';

export const config = {
  app: appConfig,
  github: githubConfig,
};

console.log(`Loaded Config based on '.env.${ENVIRONMENT}'`, { config });

export default config;
