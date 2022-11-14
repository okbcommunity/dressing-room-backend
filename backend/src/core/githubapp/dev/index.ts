import SmeeClient from 'smee-client';
import config from '../../../config';

export function setupGithubWebhookDevRedirect(): () => void {
  // Setup Github Dev Webhook
  const githubSmee = new SmeeClient({
    source: 'https://smee.io/VmyxJteWkIp4bd',
    target: `${config.app.baseUrl}/github/events`,
    logger: console,
  });
  const githubEvents = githubSmee.start();

  return githubEvents.close;
}
