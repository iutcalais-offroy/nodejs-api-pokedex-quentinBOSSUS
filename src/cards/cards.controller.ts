/**
 * @file cards.controller.ts - Contrôleur pour les routes liées aux cartes
 * @module cards
 * @author Quentin BOSSUS
 * @date 2026-02-16
 * @license MIT
 */

import { Request, Response } from 'express'
import { prisma } from '../database'

export const cardsController = {
  /**
   * Récupère toutes les cartes de la base de données triées par numéro Pokédex.
   *
   * @param _req - Requête HTTP (non utilisée)
   * @param res - Réponse HTTP contenant la liste des cartes ou une erreur
   * @throws {500} En cas d'erreur interne lors de la récupération des cartes
   */
  async getAll(_req: Request, res: Response) {
    try {
      const cards = await prisma.card.findMany({
        orderBy: { pokedexNumber: 'asc' },
      })
      return res.status(200).json(cards)
    } catch {
      return res.status(500).json({ error: 'Internal server error' })
    }
  },
}
