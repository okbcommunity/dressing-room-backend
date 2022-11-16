import SmeeClient from 'smee-client';
import config from '../../../config';

// Setup Github Dev Webhook
export function setupGithubWebhookDevRedirect(): () => void {
  const githubSmee = new SmeeClient({
    source: 'https://smee.io/ixv75bJ8u3cLyos9',
    target: `${config.app.baseUrl}/github/events`,
    logger: console,
  });
  const githubEvents = githubSmee.start();
  return githubEvents.close;
}
