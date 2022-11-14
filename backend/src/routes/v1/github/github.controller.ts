import { Request, Response } from 'express';
import { githubApp } from '../../../core';

export async function githubWebhookController(req: Request, res: Response) {
  try {
    const githubDeliveryHeaderKey = 'X-GitHub-Delivery';
    const githubDelivery =
      req.headers[githubDeliveryHeaderKey] ??
      req.headers[githubDeliveryHeaderKey.toLowerCase()];

    const githubEventNameHeaderKey = 'X-GitHub-Event';
    const githubEventName =
      req.headers[githubEventNameHeaderKey] ||
      req.headers[githubEventNameHeaderKey.toLowerCase()];

    const githubSignatureHeaderKey = 'X-Hub-Signature-256';
    const githubSignature =
      req.headers[githubSignatureHeaderKey] ??
      req.headers[githubSignatureHeaderKey.toLowerCase()];

    // Pass received Webhook Event to Octokit
    if (
      typeof githubDelivery === 'string' &&
      typeof githubEventName === 'string' &&
      typeof githubSignature === 'string'
    ) {
      await githubApp.webhooks.verifyAndReceive({
        id: githubDelivery,
        name: githubEventName as any,
        signature: githubSignature,
        payload: JSON.parse(req.body),
      });
    }

    res.sendStatus(200);
  } catch (err) {
    // TODO proper error handling
    console.log(err);
    githubApp.log.error(err as string);
    res.sendStatus(500);
  }
}
