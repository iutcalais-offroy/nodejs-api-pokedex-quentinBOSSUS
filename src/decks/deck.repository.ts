import { prisma } from "../database";

export const deckRepository = {
  createDeck(userId: number, name: string, cardIds: number[]) {
    return prisma.deck.create({
      data: {
        name,
        userId,
        cards: {
          create: cardIds.map(cardId => ({ cardId })),
        },
      },
      include: { cards: true },
    });
  },

  findCardsByIds(cardIds: number[]) {
    return prisma.card.findMany({
      where: { id: { in: cardIds } },
    });
  },

  findDecksByUserId(userId: number) {
    return prisma.deck.findMany({
      where: { userId },
      include: {
        cards: {
          include: {
            card: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },
};
