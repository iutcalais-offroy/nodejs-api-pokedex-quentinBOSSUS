/**
 * @file auth.route.ts - Définition des routes pour l'authentification
 * @module auth
 * @author Quentin BOSSUS
 * @date 2026-02-16
 * @license MIT
 */

import { Router } from 'express'
import { authController } from './auth.controller'

/**
 * Routes d'authentification.
 * - POST /sign-up : Inscription d'un nouvel utilisateur.
 * - POST /sign-in : Connexion d'un utilisateur existant.
 */
const router = Router()

router.post('/sign-up', authController.signUp)
router.post('/sign-in', authController.signIn)

export default router
