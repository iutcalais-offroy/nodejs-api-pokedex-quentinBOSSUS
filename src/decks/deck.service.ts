import { deckRepository } from "./deck.repository";
import { prisma } from "../database";

export const deckService = {
  async createDeck(userId: number, name: string, cardIds: number[]) {
    if (!name) {
      throw { status: 400, message: "Deck name is required" };
    }
    if (!cardIds || cardIds.length !== 10) {
      throw { status: 400, message: "Deck must contain exactly 10 cards" };
    }

    const existingCards = await deckRepository.findCardsByIds(cardIds);
    if (existingCards.length !== 10) {
      throw { status: 400, message: "Some card IDs are invalid" };
    }

    const deck = await deckRepository.createDeck(userId, name, cardIds);
    return deck;
  },

  async getMyDecks(userId: number) {
    return deckRepository.findDecksByUserId(userId);
  },

  async getDeckById(userId: number, deckId: number) {
    return prisma.deck.findFirst({
      where: { id: deckId, userId },
      include: { cards: { include: { card: true } } },
    });
  },

  async updateDeck(userId: number, deckId: number, name?: string, cards?: number[]) {
    const deck = await prisma.deck.findUnique({ where: { id: deckId } });
    if (!deck || deck.userId !== userId) {
      return null;
    }

    if (!name && !cards) {
      throw { status: 400, message: "Nothing to update" };
    }
    if (cards && cards.length !== 10) {
      throw { status: 400, message: "Deck must have exactly 10 cards" };
    }

    if (cards) {
      const validCards = await prisma.card.findMany({
        where: { id: { in: cards } },
      });
      if (validCards.length !== 10) {
        throw { status: 400, message: "Invalid card IDs" };
      }

      await prisma.deckCard.deleteMany({ where: { deckId } });

      const newDeckCards = cards.map(cardId => ({ deckId, cardId }));
      await prisma.deckCard.createMany({ data: newDeckCards });
    }

    const updated = await prisma.deck.update({
      where: { id: deckId },
      data: { name: name ?? deck.name },
      include: { cards: { include: { card: true } } },
    });

    return updated;
  },
};
