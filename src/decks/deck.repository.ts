/**
 * @file deck.repository.ts - Gestion des opérations de base de données pour les decks
 * @module decks
 * @author Quentin BOSSUS
 * @date 2026-02-16
 * @license MIT
 */

import { prisma } from '../database'

export const deckRepository = {
  /**
   * Crée un nouveau deck pour un utilisateur avec des cartes spécifiques.
   *
   * @param userId - ID de l'utilisateur propriétaire du deck
   * @param name - Nom du deck
   * @param cardIds - Liste des IDs des cartes à inclure dans le deck
   * @returns Le deck créé avec les cartes associées
   */
  createDeck(userId: number, name: string, cardIds: number[]) {
    return prisma.deck.create({
      data: {
        name,
        userId,
        cards: {
          create: cardIds.map((cardId) => ({ cardId })),
        },
      },
      include: { cards: true },
    })
  },

  /**
   * Récupère les cartes correspondant à une liste d'IDs.
   *
   * @param cardIds - Liste des IDs de cartes à récupérer
   * @returns Liste des cartes trouvées
   */
  findCardsByIds(cardIds: number[]) {
    return prisma.card.findMany({
      where: { id: { in: cardIds } },
    })
  },

  /**
   * Récupère tous les decks appartenant à un utilisateur.
   *
   * @param userId - ID de l'utilisateur
   * @returns Liste des decks avec leurs cartes incluses, triés par date de création décroissante
   */
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
      orderBy: { createdAt: 'desc' },
    })
  },
}
