import { replaceBracket } from '../utlis/replaceBracket';

const port = process.env.APP_PORT ?? 9000;
const version = process.env.APP_VERSION ?? 1;
// https://stackoverflow.com/questions/9153571/is-there-a-way-to-get-version-from-package-json-in-nodejs-code
const packageVersion = process.env.npm_package_version;
const baseUrl = process.env.APP_BASE_URL ?? 'http://localhost:{}';
const corsOrigins = process.env.APP_CORS_ORIGIN ?? 'http://localhost:3000';

export default {
  version,
  packageVersion,
  port,
  baseUrl: `${replaceBracket(baseUrl, port.toString())}/v${version}`,
  corsOrigins: corsOrigins.split(', '),
};
