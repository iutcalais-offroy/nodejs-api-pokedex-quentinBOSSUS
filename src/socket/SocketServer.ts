import { Server as HTTPServer } from 'http'
import { Server, Socket } from 'socket.io'
import jwt from 'jsonwebtoken'
import { prisma } from '../database'

export class SocketServer {
  private io: Server

  private rooms: Record<
    number,
    {
      hostId: number
      hostEmail: string
      deckId: number
      players: number[]
    }
  > = {}

  constructor(httpServer: HTTPServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: '*',
      },
    })

    this.initializeSocket()
  }

  private async validateDeck(deckId: number, userId: number): Promise<boolean> {
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

  private getSocketByUserId(userId: number): Socket | undefined {
    for (const [, socket] of this.io.sockets.sockets) {
      if (socket.data.user?.userId === userId) return socket
    }
    return undefined
  }

  private initializeSocket() {
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token
      if (!token) return next(new Error('Token manquant'))

      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
          userId: number
          email: string
        }
        socket.data.user = { userId: payload.userId, email: payload.email }
        next()
      } catch {
        return next(new Error('Token invalide'))
      }
    })

    this.io.on('connection', (socket: Socket) => {
      const user = socket.data.user

      socket.on('createRoom', async (data: { deckId: number | string }) => {
        const deckId = Number(data.deckId)
        if (!(await this.validateDeck(deckId, user.userId))) {
          socket.emit(
            'error',
            'Deck invalide ou non appartenant à l’utilisateur',
          )
          return
        }

        const roomId = Date.now()
        this.rooms[roomId] = {
          hostId: user.userId,
          hostEmail: user.email,
          deckId,
          players: [user.userId],
        }

        socket.join(String(roomId))
        socket.emit('roomCreated', { roomId, ...this.rooms[roomId] })
        this.io.emit(
          'roomsListUpdated',
          Object.entries(this.rooms)
            .filter(([, r]) => r.players.length === 1)
            .map(([id, r]) => ({ roomId: id, ...r })),
        )
      })

      socket.on('getRooms', () => {
        const availableRooms = Object.entries(this.rooms)
          .filter(([, r]) => r.players.length === 1)
          .map(([id, r]) => ({ roomId: id, ...r }))
        socket.emit('roomsList', availableRooms)
      })

      socket.on(
        'joinRoom',
        async (data: { roomId: number; deckId: number | string }) => {
          const room = this.rooms[data.roomId]
          if (!room) {
            socket.emit('error', 'Room inexistante')
            return
          }
          if (room.players.length >= 2) {
            socket.emit('error', 'Room complète')
            return
          }

          const deckId = Number(data.deckId)
          if (!(await this.validateDeck(deckId, user.userId))) {
            socket.emit(
              'error',
              'Deck invalide ou non appartenant à l’utilisateur',
            )
            return
          }

          room.players.push(user.userId)
          socket.join(String(data.roomId))

          const [hostId, guestId] = room.players

          const hostSocket = this.getSocketByUserId(hostId)
          const guestSocket = this.getSocketByUserId(guestId)

          hostSocket?.emit('gameStarted', {
            you: { id: hostId, handCount: 10 },
            opponent: { id: guestId, handCount: 10 },
          })

          guestSocket?.emit('gameStarted', {
            you: { id: guestId, handCount: 10 },
            opponent: { id: hostId, handCount: 10 },
          })

          delete this.rooms[data.roomId]
          this.io.emit(
            'roomsListUpdated',
            Object.entries(this.rooms)
              .filter(([, r]) => r.players.length === 1)
              .map(([id, r]) => ({ roomId: id, ...r })),
          )
        },
      )

      socket.on('disconnect', () => {})
    })
  }
}
