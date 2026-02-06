import { Request, Response } from "express";
import { prisma } from "../database";

export const cardsController = {
  async getAll(req: Request, res: Response) {
    try {
      const cards = await prisma.card.findMany({
        orderBy: { pokedexNumber: "asc" },
      });
      res.status(200).json(cards);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
};
