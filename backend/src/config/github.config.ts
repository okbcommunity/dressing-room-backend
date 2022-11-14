const appClientSecret = process.env.GITHUB_APP_CLIENT_SECRET || 'unknown';
const appClientId = process.env.GITHUB_APP_CLIENT_ID || 'unknown';
const appId = process.env.GITHUB_APP_ID || 'unkown';
const appWebhookSecret = process.env.GITHUB_WEBHOOK_SECRET || 'unkown';
const appPrivateKey = process.env.GITHUB_APP_PRIVATE_KEY || 'unknown';

export default {
  // App
  app: {
    id: appId,
    clientSecret: appClientSecret,
    clientId: appClientId,
    webhookSecret: appWebhookSecret,
    name: 'okb-community-app',
    privateKey: appPrivateKey,
  },

  // API
  baseUrl: 'https://api.github.com',
};
