/**
 * @file auth.controller.ts - Contrôleur pour les routes d'authentification
 * @module auth
 * @author Quentin BOSSUS
 * @date 2026-02-16
 * @license MIT
 */

import { Request, Response } from 'express'
import { authService } from './auth.service'

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

export const authController = {
  /**
   * Route pour l'inscription d'un nouvel utilisateur.
   * @param req - Requête Express contenant `email`, `username` et `password` dans le body.
   * @param res - Réponse Express renvoyant le token JWT et les informations utilisateur.
   * @returns Réponse HTTP 201 avec les données utilisateur et token.
   * @throws {status: 400|409} Si les données sont invalides ou l'email déjà utilisé.
   * @throws {status: 500} Pour toute erreur interne inattendue.
   */
  async signUp(req: Request, res: Response) {
    try {
      const result = await authService.signUp(req.body)
      return res.status(201).json(result)
    } catch (error: unknown) {
      if (isErrorWithStatus(error)) {
        return res.status(error.status).json({ error: error.message })
      }
      return res.status(500).json({ error: 'Internal server error' })
    }
  },

  /**
   * Route pour la connexion d'un utilisateur existant.
   * @param req - Requête Express contenant `email` et `password` dans le body.
   * @param res - Réponse Express renvoyant le token JWT et les informations utilisateur.
   * @returns Réponse HTTP 200 avec les données utilisateur et token.
   * @throws {status: 400|401} Si les données sont invalides ou l'authentification échoue.
   * @throws {status: 500} Pour toute erreur interne inattendue.
   */
  async signIn(req: Request, res: Response) {
    try {
      const result = await authService.signIn(req.body)
      return res.status(200).json(result)
    } catch (error: unknown) {
      if (isErrorWithStatus(error)) {
        return res.status(error.status).json({ error: error.message })
      }
      return res.status(500).json({ error: 'Internal server error' })
    }
  },
}
