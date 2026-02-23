import { PokemonType } from '../generated/prisma/client'

export type GameCard = {
  id: number
  name: string
  hp: number
  attack: number
  type: PokemonType
}

export type PlayerState = {
  userId: number
  socketId: string
  deck: GameCard[]
  hand: GameCard[]
  activeCard: GameCard | null
  score: number
}

export type GameState = {
  roomId: number
  players: PlayerState[]
  currentPlayerSocketId: string
  currentPlayerUserId: number
}
