/**
 * @file socket.repository.ts - Gestion des données des rooms et parties
 * @module socket
 * @author Quentin BOSSUS
 * @date 2026-02-23
 * @license MIT
 */

import { prisma } from '../database'
import { GameCard, GameState } from './socket.types'

export class SocketRepository {
  private games: Record<number, GameState> = {}

  private rooms: Record<
    number,
    {
      hostId: number
      hostEmail: string
      deckId: number
      players: number[]
    }
  > = {}

  /**
   * Retourne l'ensemble des parties actives.
   * @returns Record<number, GameState>
   */
  public getGames() {
    return this.games
  }

  /**
   * Retourne l'ensemble des rooms en attente.
   * @returns Record<number, { hostId: number; hostEmail: string; deckId: number; players: number[] }>
   */
  public getRooms() {
    return this.rooms
  }

  /**
   * Vérifie qu'un deck appartient à l'utilisateur et contient exactement 10 cartes.
   * @param deckId - Identifiant du deck
   * @param userId - Identifiant de l'utilisateur
   * @returns true si le deck est valide, sinon false
   */
  public async validateDeck(deckId: number, userId: number): Promise<boolean> {
    const deck = await prisma.deck.findUnique({
      where: { id: deckId },
      include: {
        cards: true,
      },
    })

    if (!deck) return false
    if (deck.userId !== userId) return false
    if (deck.cards.length !== 10) return false

    return true
  }

  /**
   * Mélange aléatoirement un tableau de cartes.
   * @param array - Tableau de cartes à mélanger
   * @returns Nouveau tableau mélangé
   */
  public shuffleCards(array: GameCard[]): GameCard[] {
    return [...array].sort(() => Math.random() - 0.5)
  }
}
