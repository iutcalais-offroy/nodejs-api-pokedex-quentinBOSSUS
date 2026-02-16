/**
 * @file deck.route.ts - Définition des routes liées aux decks
 * @module decks
 * @author Quentin BOSSUS
 * @date 2026-02-16
 * @license MIT
 */

import { Router } from 'express'
import { deckController } from './deck.controller'
import { authenticateJWT } from '../auth/auth.middleware'

/**
 * Routes pour la gestion des decks.
 * - POST /         : Création d'un nouveau deck (authentifié)
 * - GET /mine      : Récupération des decks de l'utilisateur connecté
 * - GET /:id       : Récupération d'un deck par son ID
 * - PATCH /:id     : Mise à jour d'un deck existant
 * - DELETE /:id    : Suppression d'un deck
 */
const router = Router()

router.post('/', authenticateJWT, deckController.create)
router.get('/mine', authenticateJWT, deckController.getMine)
router.get('/:id', authenticateJWT, deckController.getById)
router.patch('/:id', authenticateJWT, deckController.update)
router.delete('/:id', authenticateJWT, deckController.delete)

export default router
