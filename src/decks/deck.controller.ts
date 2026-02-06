import { Response } from "express";
import { deckService } from "./deck.service";
import { AuthRequest } from "../auth/auth.middleware";

export const deckController = {
  async create(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { name, cards } = req.body;
      const deck = await deckService.createDeck(req.user.userId, name, cards);

      return res.status(201).json(deck);
    } catch (error: any) {
      if (error?.status) {
        return res.status(error.status).json({ error: error.message });
      }

      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
};
