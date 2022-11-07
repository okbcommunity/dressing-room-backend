import dotenv from 'dotenv';

// Load environment variables based on Stage
const ENVIRONMENT = process.env.NODE_ENV ?? 'dev'; // https://stackoverflow.com/questions/11104028/why-is-process-env-node-env-undefined
dotenv.config({ path: `.env.${ENVIRONMENT}` });

// Import Configs
import appConfig from './app.config';

export const config = {
    app: appConfig
}

console.log(`Loaded Config based on '.env.${ENVIRONMENT}'`, {config});

export default config;