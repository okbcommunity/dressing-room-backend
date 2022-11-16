import { App, Octokit } from 'octokit';
import appConfig from '../../config/app.config';
import githubConfig from '../../config/github.config';

const CustomOctokit = Octokit.plugin().defaults({
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

export function getInstallationOctokit() {
  // https://github.com/octokit/app.js/issues/262
  // InstallationId reflects the 'okbcommunity/dressing-room-cms'
  // Got installationId from  App Settings > Advanced > 'installation.created' (https://stackoverflow.com/a/73962856/14108895)
  return githubApp.getInstallationOctokit(31152990);
}

export default githubApp;
