import { Socket, Server } from 'socket.io'
import { GameState, GameCard } from './socket.types'

export class SocketService {
  public getSocketByUserId(io: Server, userId: number): Socket | undefined {
    for (const [, socket] of io.sockets.sockets) {
      if (socket.data.user?.userId === userId) return socket
    }
    return undefined
  }

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
