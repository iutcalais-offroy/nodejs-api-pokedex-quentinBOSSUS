/**
 * @file socket.service.ts - Logique métier liée aux sockets et à la vue joueur
 * @module socket
 * @author Quentin BOSSUS
 * @date 2026-02-23
 * @license MIT
 */

import { Socket, Server } from 'socket.io'
import { GameState, GameCard } from './socket.types'

export class SocketService {
  /**
   * Récupère une instance Socket à partir de l'identifiant utilisateur.
   * @param io - Instance du serveur Socket.io
   * @param userId - Identifiant de l'utilisateur
   * @returns La socket correspondante ou undefined si non trouvée
   */
  public getSocketByUserId(io: Server, userId: number): Socket | undefined {
    for (const [, socket] of io.sockets.sockets) {
      if (socket.data.user?.userId === userId) return socket
    }
    return undefined
  }

  /**
   * Génère une vue filtrée du GameState pour un joueur donné.
   * Masque les cartes de la main adverse.
   * @param game - État complet de la partie
   * @param viewerSocketId - Identifiant de la socket du joueur qui consulte la vue
   * @returns Objet représentant l'état visible par le joueur
   */
  public playerView(game: GameState, viewerSocketId: string) {
    const filterCard = (card: GameCard) => ({
      id: card.id,
      name: card.name,
      hp: card.hp,
      attack: card.attack,
      type: card.type,
    })

    return {
      roomId: game.roomId,
      currentPlayerUserId: game.currentPlayerUserId,
      players: game.players.map((p) => ({
        userId: p.userId,
        hand:
          p.socketId === viewerSocketId
            ? p.hand.map(filterCard)
            : new Array(p.hand.length).fill(null),
        activeCard: p.activeCard ? filterCard(p.activeCard) : null,
        score: p.score,
      })),
    }
  }
}
