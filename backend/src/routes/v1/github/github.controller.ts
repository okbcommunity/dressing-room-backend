import express from 'express';
import { githubApp } from '../../../core';

export async function githubWebhookController(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
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
      typeof githubSignature === 'string' &&
      req.body != null
    ) {
      // https://github.com/octokit/webhooks.js/#webhooksverifyandreceive
      await githubApp.webhooks.verifyAndReceive({
        id: githubDelivery,
        name: (req.body.action != null
          ? `${githubEventName}.${req.body.action}`
          : githubEventName) as any,
        signature: githubSignature,
        payload: req.body,
      });
    }

    // Response
    res.sendStatus(200);
  } catch (err: any) {
    next(err);
    githubApp.log.error(err as string);
  }
}
