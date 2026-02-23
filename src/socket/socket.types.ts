/**
 * @file socket.types.ts - Définition des types liés au système de jeu
 * @module socket
 * @author Quentin BOSSUS
 * @date 2026-02-23
 * @license MIT
 */
import { PokemonType } from '../generated/prisma/client'

/**
 * Représente une carte utilisée dans une partie.
 */
export type GameCard = {
  id: number
  name: string
  hp: number
  attack: number
  type: PokemonType
}

/**
 * Représente l'état d'un joueur pendant une partie.
 */
export type PlayerState = {
  userId: number
  socketId: string
  deck: GameCard[]
  hand: GameCard[]
  activeCard: GameCard | null
  score: number
}

/**
 * Représente l'état global d'une partie en cours.
 */
export type GameState = {
  roomId: number
  players: PlayerState[]
  currentPlayerSocketId: string
  currentPlayerUserId: number
}
