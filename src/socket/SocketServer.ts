import { Server as HTTPServer } from 'http'
import { Server, Socket } from 'socket.io'
import jwt from 'jsonwebtoken'
import { prisma } from '../database'
import { calculateDamage } from '../utils/rules.util'
import { PokemonType } from '../generated/prisma/client'

type GameCard = {
  id: number
  name: string
  hp: number
  attack: number
  type: PokemonType
}

type PlayerState = {
  userId: number
  socketId: string
  deck: GameCard[]
  hand: GameCard[]
  activeCard: GameCard | null
  score: number
}

type GameState = {
  roomId: number
  players: PlayerState[]
  currentPlayerSocketId: string
  currentPlayerUserId: number
}

export class SocketServer {
  private io: Server
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

  private playerView(game: GameState, viewerSocketId: string) {
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

  private shuffleCards(array: GameCard[]): GameCard[] {
    return [...array].sort(() => Math.random() - 0.5)
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

          if (!hostSocket || !guestSocket) {
            socket.emit('error', 'Socket introuvable')
            return
          }

          const hostDeck = await prisma.deck.findUnique({
            where: { id: room.deckId },
            include: { cards: { include: { card: true } } },
          })

          const guestDeck = await prisma.deck.findUnique({
            where: { id: deckId },
            include: { cards: { include: { card: true } } },
          })

          if (!hostDeck || !guestDeck) {
            socket.emit('error', 'Deck introuvable')
            return
          }

          const roomId = data.roomId

          this.games[roomId] = {
            roomId,
            players: [
              {
                userId: hostId,
                socketId: hostSocket.id,
                deck: this.shuffleCards(hostDeck.cards.map((dc) => dc.card)),
                hand: [],
                activeCard: null,
                score: 0,
              },
              {
                userId: guestId,
                socketId: guestSocket.id,
                deck: this.shuffleCards(guestDeck.cards.map((dc) => dc.card)),
                hand: [],
                activeCard: null,
                score: 0,
              },
            ],
            currentPlayerSocketId: hostSocket.id,
            currentPlayerUserId: hostId,
          }

          this.io.to(String(roomId)).emit('gameStarted', {
            roomId,
            currentPlayerSocketId: hostSocket.id,
            currentPlayerUserId: hostId,
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

      socket.on('drawCards', ({ roomId }) => {
        const game = this.games[roomId]
        if (!game) {
          socket.emit('error', 'Partie introuvable')
          return
        }

        if (game.currentPlayerUserId !== socket.data.user.userId) {
          socket.emit('error', 'Pas votre tour')
          return
        }

        const player = game.players.find((p) => p.socketId === socket.id)!
        while (player.hand.length < 5 && player.deck.length > 0) {
          player.hand.push(player.deck.shift()!)
        }

        game.players.forEach((p) => {
          this.io
            .to(p.socketId)
            .emit('gameStateUpdated', this.playerView(game, p.socketId))
        })
      })

      socket.on('playCard', ({ roomId, cardIndex }) => {
        const game = this.games[roomId]
        if (!game) {
          socket.emit('error', 'Partie introuvable')
          return
        }
        if (game.currentPlayerUserId !== socket.data.user.userId) {
          socket.emit('error', 'Pas votre tour')
          return
        }

        const player = game.players.find((p) => p.socketId === socket.id)!
        if (cardIndex < 0 || cardIndex >= player.hand.length) {
          socket.emit('error', 'Index invalide')
          return
        }

        if (player.activeCard) {
          socket.emit('error', 'Carte déjà active')
          return
        }

        player.activeCard = player.hand.splice(cardIndex, 1)[0]

        game.players.forEach((p) => {
          this.io
            .to(p.socketId)
            .emit('gameStateUpdated', this.playerView(game, p.socketId))
        })
      })

      socket.on('attack', ({ roomId }) => {
        const game = this.games[roomId]
        if (!game) {
          socket.emit('error', 'Partie introuvable')
          return
        }
        if (game.currentPlayerUserId !== socket.data.user.userId) {
          socket.emit('error', 'Pas votre tour')
          return
        }

        const attacker = game.players.find((p) => p.socketId === socket.id)!
        const defender = game.players.find((p) => p.socketId !== socket.id)!

        if (!attacker.activeCard) {
          socket.emit('error', 'Pas de carte active')
          return
        }
        if (!defender.activeCard) {
          socket.emit('error', 'Adversaire sans carte active')
          return
        }

        const damage = calculateDamage(
          attacker.activeCard.attack,
          attacker.activeCard.type,
          defender.activeCard.type,
        )

        defender.activeCard.hp -= damage

        if (defender.activeCard.hp <= 0) {
          attacker.score += 1
          defender.activeCard = null

          if (attacker.score >= 3) {
            this.io.to(String(roomId)).emit('gameEnded', {
              winner: attacker.userId,
            })
            delete this.games[roomId]
            return
          }
        }

        game.currentPlayerSocketId = defender.socketId
        game.currentPlayerUserId = defender.userId

        game.players.forEach((p) => {
          this.io
            .to(p.socketId)
            .emit('gameStateUpdated', this.playerView(game, p.socketId))
        })
      })

      socket.on('endTurn', ({ roomId }) => {
        const game = this.games[roomId]
        if (!game) {
          socket.emit('error', 'Partie introuvable')
          return
        }
        if (game.currentPlayerUserId !== socket.data.user.userId) {
          socket.emit('error', 'Pas votre tour')
          return
        }

        const opponent = game.players.find(
          (p) => p.userId !== socket.data.user.userId,
        )!
        game.currentPlayerUserId = opponent.userId
        game.currentPlayerSocketId = opponent.socketId

        game.players.forEach((p) => {
          this.io
            .to(p.socketId)
            .emit('gameStateUpdated', this.playerView(game, p.socketId))
        })
      })

      socket.on('disconnect', () => {})
    })
  }
}
