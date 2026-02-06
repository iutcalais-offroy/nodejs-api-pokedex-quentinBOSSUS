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

  async getMine(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const decks = await deckService.getMyDecks(req.user.userId);

      return res.status(200).json(decks);
    } catch (error: any) {
      if (error?.status) {
        return res.status(error.status).json({ error: error.message });
      }

      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

    async getById(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const deckId = Number(req.params.id);
      if (isNaN(deckId)) {
        return res.status(400).json({ error: "Invalid deck ID" });
      }

      const deck = await deckService.getDeckById(req.user.userId, deckId);

      if (!deck) {
        return res.status(404).json({ error: "Deck not found or access denied" });
      }

      return res.status(200).json(deck);
    } catch (error: any) {
      if (error?.status) {
        return res.status(error.status).json({ error: error.message });
      }

      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  async update(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const deckId = Number(req.params.id);
      
      if (isNaN(deckId)) {
        return res.status(400).json({ error: "Invalid deck ID" });
      }

      const { name, cards } = req.body;

      const updatedDeck = await deckService.updateDeck(req.user.userId, deckId, name, cards);

      return res.status(200).json(updatedDeck);
    } catch (error: any) {
      if (error?.status) {
        return res.status(error.status).json({ error: error.message });
      }

      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
};
