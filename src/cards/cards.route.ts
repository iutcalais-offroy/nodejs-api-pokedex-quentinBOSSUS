/**
 * @file cards.route.ts - Définition des routes liées aux cartes
 * @module cards
 * @author Quentin BOSSUS
 * @date 2026-02-16
 * @license MIT
 */

import { Router } from 'express'
import { cardsController } from './cards.controller'

/**
 * Routes pour les cartes.
 * GET / : Récupère toutes les cartes triées par numéro Pokédex.
 */
const router = Router()

router.get('/', cardsController.getAll)

export default router
