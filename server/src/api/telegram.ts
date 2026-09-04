import { Router, Request, Response } from 'express';
import {
  handleTelegramUpdate,
  verifyTelegramWebhookSecret,
  type TelegramUpdate,
} from '../lib/telegram';

const router = Router();

router.post('/webhook', async (req: Request, res: Response) => {
  if (!verifyTelegramWebhookSecret(req.headers['x-telegram-bot-api-secret-token'])) {
    return res.status(401).json({ ok: false });
  }

  res.status(200).json({ ok: true });

  try {
    await handleTelegramUpdate(req.body as TelegramUpdate);
  } catch (error) {
    console.error('[telegram] webhook handler failed:', error);
  }
});

export default router;
