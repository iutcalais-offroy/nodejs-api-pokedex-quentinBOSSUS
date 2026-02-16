/**
 * @file deck.service.ts - Logique métier pour les decks
 * @module decks
 * @author Quentin BOSSUS
 * @date 2026-02-16
 * @license MIT
 */

import { deckRepository } from './deck.repository'
import { prisma } from '../database'

export const deckService = {
  /**
   * Crée un deck pour un utilisateur avec exactement 10 cartes.
   *
   * @param userId - ID de l'utilisateur propriétaire
   * @param name - Nom du deck
   * @param cardIds - Liste des IDs des cartes à inclure
   * @returns Le deck créé avec ses cartes
   * @throws {400} Si le nom est manquant, si le nombre de cartes n'est pas 10 ou si des cartes sont invalides
   */
  async createDeck(userId: number, name: string, cardIds: number[]) {
    if (!name) {
      throw { status: 400, message: 'Deck name is required' }
    }
    if (!cardIds || cardIds.length !== 10) {
      throw { status: 400, message: 'Deck must contain exactly 10 cards' }
    }

    const existingCards = await deckRepository.findCardsByIds(cardIds)
    if (existingCards.length !== 10) {
      throw { status: 400, message: 'Some card IDs are invalid' }
    }

    const deck = await deckRepository.createDeck(userId, name, cardIds)
    return deck
  },

  /**
   * Récupère tous les decks appartenant à un utilisateur.
   *
   * @param userId - ID de l'utilisateur
   * @returns Liste des decks avec leurs cartes
   */
  async getMyDecks(userId: number) {
    return deckRepository.findDecksByUserId(userId)
  },

  /**
   * Récupère un deck spécifique d'un utilisateur.
   *
   * @param userId - ID de l'utilisateur
   * @param deckId - ID du deck
   * @returns Le deck trouvé ou null s'il n'existe pas
   */
  async getDeckById(userId: number, deckId: number) {
    return prisma.deck.findFirst({
      where: { id: deckId, userId },
      include: { cards: { include: { card: true } } },
    })
  },

  /**
   * Met à jour le nom et/ou les cartes d'un deck.
   *
   * @param userId - ID de l'utilisateur propriétaire
   * @param deckId - ID du deck à mettre à jour
   * @param name - Nouveau nom du deck (optionnel)
   * @param cards - Nouvelle liste d'IDs de cartes (optionnel, doit être exactement 10)
   * @returns Le deck mis à jour ou null si non trouvé ou pas propriétaire
   * @throws {400} Si rien n'est fourni pour la mise à jour ou si les cartes sont invalides
   */
  async updateDeck(
    userId: number,
    deckId: number,
    name?: string,
    cards?: number[],
  ) {
    const deck = await prisma.deck.findUnique({ where: { id: deckId } })
    if (!deck || deck.userId !== userId) {
      return null
    }

    if (!name && !cards) {
      throw { status: 400, message: 'Nothing to update' }
    }
    if (cards && cards.length !== 10) {
      throw { status: 400, message: 'Deck must have exactly 10 cards' }
    }

    if (cards) {
      const validCards = await prisma.card.findMany({
        where: { id: { in: cards } },
      })
      if (validCards.length !== 10) {
        throw { status: 400, message: 'Invalid card IDs' }
      }

      await prisma.deckCard.deleteMany({ where: { deckId } })

      const newDeckCards = cards.map((cardId) => ({ deckId, cardId }))
      await prisma.deckCard.createMany({ data: newDeckCards })
    }

    const updated = await prisma.deck.update({
      where: { id: deckId },
      data: { name: name ?? deck.name },
      include: { cards: { include: { card: true } } },
    })

    return updated
  },

  /**
   * Supprime un deck d'un utilisateur.
   *
   * @param userId - ID de l'utilisateur propriétaire
   * @param deckId - ID du deck à supprimer
   * @returns true si supprimé, null si le deck n'existe pas ou n'appartient pas à l'utilisateur
   */
  async deleteDeck(userId: number, deckId: number) {
    const deck = await prisma.deck.findUnique({ where: { id: deckId } })
    if (!deck || deck.userId !== userId) return null

    await prisma.deckCard.deleteMany({ where: { deckId } })

    await prisma.deck.delete({ where: { id: deckId } })

    return true
  },
}
