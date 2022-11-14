import { App, Octokit } from 'octokit';
import appConfig from '../../config/app.config';
import githubConfig from '../../config/github.config';

const CustomOctokit = Octokit.defaults({
  userAgent: `${githubConfig.app.name}/v${appConfig.packageVersion}`,
});

const githubApp = new App({
  appId: githubConfig.app.id,
  privateKey: githubConfig.app.privateKey,
  webhooks: {
    secret: githubConfig.app.webhookSecret,
  },
  Octokit: CustomOctokit,
});

export default githubApp;
