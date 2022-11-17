const appId = process.env.GITHUB_APP_ID || -1;
const appWebhookSecret = process.env.GITHUB_APP_WEBHOOK_SECRET || 'unkown';
const appPrivateKey = process.env.GITHUB_APP_PRIVATE_KEY || 'unknown';

export default {
  // App
  app: {
    id: appId,
    webhookSecret: appWebhookSecret,
    name: 'okb-community-app',
    privateKey: appPrivateKey.replace(/\\n/gm, '\n'), // https://github.com/octokit/app.js/issues/262
  },
  repo: {
    owner: 'okbcommunity',
    name: 'dressing-room-cms',
    installationId: 31152990,
    defaultBranch: 'master',
  },

  // API
  baseUrl: 'https://api.github.com',
};
