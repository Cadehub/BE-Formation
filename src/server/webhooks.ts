import { Request, Response } from "express";

// Webhook handler placeholder - currently unused
export const handleChariowWebhook = async (req: Request, res: Response) => {
  res.status(200).json({ received: true });
};

