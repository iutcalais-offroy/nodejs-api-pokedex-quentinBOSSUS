/**
 * @file deck.controller.ts - Contrôleur pour les routes liées aux decks
 * @module decks
 * @author Quentin BOSSUS
 * @date 2026-02-16
 * @license MIT
 */

import { Response } from 'express'
import { deckService } from './deck.service'
import { AuthRequest } from '../auth/auth.middleware'

type ErrorWithStatus = {
  status: number
  message: string
}

function isErrorWithStatus(error: unknown): error is ErrorWithStatus {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    'message' in error
  )
}

export const deckController = {
  /**
   * Crée un nouveau deck pour l'utilisateur connecté.
   *
   * @param req - Requête HTTP avec `user` et `body` contenant `name` et `cards`
   * @param res - Réponse HTTP
   * @returns Le deck créé avec son ID, nom, utilisateur et cartes
   * @throws {401} Si l'utilisateur n'est pas authentifié
   * @throws {400|500} En cas d'erreur de validation ou serveur
   */
  async create(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const { name, cards } = req.body
      const deck = await deckService.createDeck(req.user.userId, name, cards)

      return res.status(201).json({
        id: deck.id,
        name: deck.name,
        userId: deck.userId,
        cards: deck.cards,
      })
    } catch (error: unknown) {
      if (isErrorWithStatus(error)) {
        return res.status(error.status).json({ error: error.message })
      }

      return res.status(500).json({ error: 'Internal server error' })
    }
  },

  /**
   * Récupère tous les decks de l'utilisateur connecté.
   *
   * @param req - Requête HTTP avec `user`
   * @param res - Réponse HTTP
   * @returns Liste des decks de l'utilisateur
   * @throws {401} Si l'utilisateur n'est pas authentifié
   * @throws {500} En cas d'erreur serveur
   */
  async getMine(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const decks = await deckService.getMyDecks(req.user.userId)

      return res.status(200).json(decks)
    } catch (error: unknown) {
      if (isErrorWithStatus(error)) {
        return res.status(error.status).json({ error: error.message })
      }

      return res.status(500).json({ error: 'Internal server error' })
    }
  },

  /**
   * Récupère un deck spécifique par son ID pour l'utilisateur connecté.
   *
   * @param req - Requête HTTP avec `user` et `params.id`
   * @param res - Réponse HTTP
   * @returns Le deck trouvé ou message d'erreur si non trouvé
   * @throws {400|401|404|500} En cas d'erreur de validation, d'authentification, d'accès ou serveur
   */
  async getById(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const deckId = Number(req.params.id)
      if (isNaN(deckId)) {
        return res.status(400).json({ error: 'Invalid deck ID' })
      }

      const deck = await deckService.getDeckById(req.user.userId, deckId)

      if (!deck) {
        return res
          .status(404)
          .json({ error: 'Deck not found or access denied' })
      }

      return res.status(200).json(deck)
    } catch (error: unknown) {
      if (isErrorWithStatus(error)) {
        return res.status(error.status).json({ error: error.message })
      }

      return res.status(500).json({ error: 'Internal server error' })
    }
  },

  /**
   * Met à jour le nom et/ou les cartes d'un deck existant.
   *
   * @param req - Requête HTTP avec `user`, `params.id`, et `body` contenant `name` et/ou `cards`
   * @param res - Réponse HTTP
   * @returns Le deck mis à jour ou message d'erreur
   * @throws {400|401|404|500} En cas d'erreur de validation, d'authentification, d'accès ou serveur
   */
  async update(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const deckId = Number(req.params.id)

      if (isNaN(deckId)) {
        return res.status(400).json({ error: 'Invalid deck ID' })
      }

      const { name, cards } = req.body

      const updatedDeck = await deckService.updateDeck(
        req.user.userId,
        deckId,
        name,
        cards,
      )

      if (!updatedDeck) {
        return res
          .status(404)
          .json({ error: 'Deck not found or access denied' })
      }

      return res.status(200).json({
        id: updatedDeck.id,
        name: updatedDeck.name,
        cards: updatedDeck.cards,
      })
    } catch (error: unknown) {
      if (isErrorWithStatus(error)) {
        return res.status(error.status).json({ error: error.message })
      }

      return res.status(500).json({ error: 'Internal server error' })
    }
  },

  /**
   * Supprime un deck de l'utilisateur connecté.
   *
   * @param req - Requête HTTP avec `user` et `params.id`
   * @param res - Réponse HTTP
   * @returns Message de succès ou erreur si non trouvé
   * @throws {400|401|404|500} En cas d'erreur de validation, d'authentification, d'accès ou serveur
   */
  async delete(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const deckId = Number(req.params.id)
      if (isNaN(deckId)) {
        return res.status(400).json({ error: 'Invalid deck ID' })
      }

      const deleted = await deckService.deleteDeck(req.user.userId, deckId)

      if (!deleted) {
        return res
          .status(404)
          .json({ error: 'Deck not found or access denied' })
      }

      return res.status(200).json({ message: 'Deck deleted successfully' })
    } catch (error: unknown) {
      if (isErrorWithStatus(error)) {
        return res.status(error.status).json({ error: error.message })
      }

      return res.status(500).json({ error: 'Internal server error' })
    }
  },
}
