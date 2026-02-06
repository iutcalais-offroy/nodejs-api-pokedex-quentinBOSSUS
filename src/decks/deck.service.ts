import { deckRepository } from "./deck.repository";

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
};
