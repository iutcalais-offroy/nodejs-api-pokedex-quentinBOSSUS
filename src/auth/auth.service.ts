/**
 * @file auth.service.ts - Logique métier pour l'authentification et la gestion des utilisateurs
 * @module auth
 * @author Quentin BOSSUS
 * @date 2026-02-16
 * @license MIT
 */

import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { authRepository } from './auth.repository'
import { env } from '../env'

type SignUpInput = {
  email: string
  username: string
  password: string
}

type SignInInput = {
  email: string
  password: string
}

export const authService = {
  /**
   * Inscrit un nouvel utilisateur et génère un token JWT.
   * @param param0 - Objet contenant `email`, `username` et `password`.
   * @returns Un objet contenant le token JWT et les informations de l'utilisateur créé.
   * @throws {status: 400} Si les données sont manquantes ou invalides.
   * @throws {status: 409} Si l'email est déjà utilisé.
   */
  async signUp({ email, username, password }: SignUpInput) {
    if (!email || !username || !password) {
      throw { status: 400, message: 'Missing or invalid data' }
    }

    const existingUser = await authRepository.findByEmail(email)
    if (existingUser) {
      throw { status: 409, message: 'Email already used' }
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await authRepository.createUser({
      email,
      username,
      password: hashedPassword,
    })

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      env.JWT_SECRET,
      { expiresIn: '7d' },
    )

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    }
  },

  /**
   * Connecte un utilisateur existant et génère un token JWT.
   * @param param0 - Objet contenant `email` et `password`.
   * @returns Un objet contenant le token JWT et les informations de l'utilisateur connecté.
   * @throws {status: 400} Si les données sont manquantes ou invalides.
   * @throws {status: 401} Si l'email ou le mot de passe est incorrect.
   */
  async signIn({ email, password }: SignInInput) {
    if (!email || !password) {
      throw { status: 400, message: 'Missing or invalid data' }
    }

    const user = await authRepository.findByEmail(email)
    if (!user) {
      throw { status: 401, message: 'Invalid email or password' }
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      throw { status: 401, message: 'Invalid email or password' }
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      env.JWT_SECRET,
      { expiresIn: '7d' },
    )

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    }
  },
}
