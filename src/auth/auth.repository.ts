/**
 * @file auth.repository.ts - Gestion des opérations de base de données pour l'authentification
 * @module auth
 * @author Quentin BOSSUS
 * @date 2026-02-16
 * @license MIT
 */

import { prisma } from '../database'
import { User } from '../generated/prisma/client'

export const authRepository = {
  /**
   * Recherche un utilisateur par son adresse e-mail.
   * @param email - L'adresse e-mail de l'utilisateur à rechercher.
   * @returns Une promesse qui résout l'utilisateur si trouvé, sinon `null`.
   */
  findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    })
  },

  /**
   * Crée un nouvel utilisateur dans la base de données.
   * @param data - Objet contenant `email`, `username` et `password` (haché) du nouvel utilisateur.
   * @returns Une promesse qui résout le nouvel utilisateur créé.
   */
  createUser(data: {
    email: string
    username: string
    password: string
  }): Promise<User> {
    return prisma.user.create({
      data,
    })
  },
}
