import { replaceBracket } from '../utlis/replaceBracket';
import { STAGE } from './types';

const port = process.env.APP_PORT ?? 9000;
const version = process.env.APP_VERSION ?? 1;
// https://stackoverflow.com/questions/9153571/is-there-a-way-to-get-version-from-package-json-in-nodejs-code
const packageVersion = process.env.npm_package_version;
const baseUrl = process.env.APP_BASE_URL ?? 'http://localhost:{}';
const corsOrigins = process.env.APP_CORS_ORIGIN ?? 'http://localhost:3000';
const nodeEnv = process.env.NODE_ENV ?? STAGE.LOCAL;
// https://www.digitalocean.com/community/tutorials/nodejs-how-to-use__dirname
const rootPath = process.cwd() ?? 'unknown';

export default {
  version,
  packageVersion,
  port,
  baseUrl: `${replaceBracket(baseUrl, port.toString())}/v${version}`,
  corsOrigins: corsOrigins.split(', '),
  stage: nodeEnv as STAGE,
  rootPath,
};
