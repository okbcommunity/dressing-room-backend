import { uploadFileTest } from '../actions';
import githubApp from '../app';

githubApp.webhooks.onError(() => {
  // TODO handle Github Webhook Error
});

githubApp.webhooks.on('issues.opened', async ({ octokit, payload }) => {
  console.log('issues.opened', { payload });
  uploadFileTest();
});

githubApp.webhooks.on('issues.closed', ({ octokit, payload }) => {
  console.log('issue.closed', { payload });
});
