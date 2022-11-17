import githubApp from '../app';

githubApp.webhooks.onError((event) => {
  // TODO handle Github Webhook Error
  console.log('Github Webhook Error', { event });
});

githubApp.webhooks.on('issues.opened', async ({ octokit, payload }) => {
  console.log('issues.opened', { payload });
});

githubApp.webhooks.on('issues.closed', ({ octokit, payload }) => {
  console.log('issue.closed', { payload });
});
