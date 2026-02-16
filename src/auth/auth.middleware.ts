/**
 * @file auth.middleware.ts - Middleware pour l'authentification JWT
 * @module auth
 * @author Quentin BOSSUS
 * @date 2026-02-16
 * @license MIT
 */

import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../env'

export interface AuthRequest extends Request {
  user?: {
    userId: number
    email: string
  }
}

/**
 * Middleware d'authentification JWT.
 * Vérifie la présence et la validité d'un token JWT dans l'en-tête Authorization.
 * Si le token est valide, ajoute les informations de l'utilisateur à req.user.
 *
 * @param req - Requête HTTP étendue avec champ optionnel `user`
 * @param res - Réponse HTTP
 * @param next - Fonction de passage au middleware suivant
 * @throws {401} Si le token est manquant, invalide ou expiré
 */
export const authenticateJWT = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token missing' })
    return
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      userId: number
      email: string
    }
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    }
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
    return
  }
}
