const appClientSecret = process.env.GITHUB_APP_CLIENT_SECRET || 'unknown';
const appClientId = process.env.GITHUB_APP_CLIENT_ID || 'unknown';
const appId = process.env.GITHUB_APP_ID || 'unkown';
const appWebhookSecret = process.env.GITHUB_WEBHOOK_SECRET || 'unkown';

export default {
  // App
  appId,
  appClientSecret,
  appClientId,
  appWebhookSecret,

  // API
  baseUrl: 'https://api.github.com',
};
