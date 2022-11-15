import SmeeClient from 'smee-client';
import config from '../../../config';

export function setupGithubWebhookDevRedirect(): () => void {
  console.log('Called Smee');

  // Setup Github Dev Webhook
  const githubSmee = new SmeeClient({
    source: 'https://smee.io/ixv75bJ8u3cLyos9',
    target: `${config.app.baseUrl}/github/events`,
    logger: console,
  });
  const githubEvents = githubSmee.start();

  return githubEvents.close;
}
