/**
 * @file socket.controller.ts - Contrôleur Socket.io pour la gestion des rooms et parties
 * @module socket
 * @author Quentin BOSSUS
 * @date 2026-02-23
 * @license MIT
 */

import { Server as HTTPServer } from 'http'
import { Server, Socket } from 'socket.io'
import jwt from 'jsonwebtoken'
import { prisma } from '../database'
import { calculateDamage } from '../utils/rules.util'
import { SocketRepository } from './socket.repository'
import { SocketService } from './socket.service'

export class SocketController {
  private io: Server
  private repository = new SocketRepository()
  private service = new SocketService()

  constructor(httpServer: HTTPServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: '*',
      },
    })

    this.initializeSocket()
  }

  /**
   * Configure l'authentification JWT et enregistre
   * tous les événements socket liés aux rooms et aux parties.
   */
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

      /**
       * Crée une room en attente pour un joueur hôte.
       * @param data.deckId - Identifiant du deck utilisé
       */
      socket.on('createRoom', async (data: { deckId: number | string }) => {
        const deckId = Number(data.deckId)
        if (!(await this.repository.validateDeck(deckId, user.userId))) {
          socket.emit(
            'error',
            'Deck invalide ou non appartenant à l’utilisateur',
          )
          return
        }

        const roomId = Date.now()
        this.repository.getRooms()[roomId] = {
          hostId: user.userId,
          hostEmail: user.email,
          deckId,
          players: [user.userId],
        }

        socket.join(String(roomId))
        socket.emit('roomCreated', {
          roomId,
          ...this.repository.getRooms()[roomId],
        })
        this.io.emit(
          'roomsListUpdated',
          Object.entries(this.repository.getRooms())
            .filter(([, r]) => r.players.length === 1)
            .map(([id, r]) => ({ roomId: id, ...r })),
        )
      })

      /**
       * Retourne la liste des rooms disponibles.
       */
      socket.on('getRooms', () => {
        const availableRooms = Object.entries(this.repository.getRooms())
          .filter(([, r]) => r.players.length === 1)
          .map(([id, r]) => ({ roomId: id, ...r }))
        socket.emit('roomsList', availableRooms)
      })

      /**
       * Permet à un joueur de rejoindre une room existante
       * et initialise une nouvelle partie.
       * @param data.roomId - Identifiant de la room
       * @param data.deckId - Identifiant du deck du joueur
       */
      socket.on(
        'joinRoom',
        async (data: { roomId: number; deckId: number | string }) => {
          const room = this.repository.getRooms()[data.roomId]
          if (!room) {
            socket.emit('error', 'Room inexistante')
            return
          }
          if (room.players.length >= 2) {
            socket.emit('error', 'Room complète')
            return
          }

          const deckId = Number(data.deckId)
          if (!(await this.repository.validateDeck(deckId, user.userId))) {
            socket.emit(
              'error',
              'Deck invalide ou non appartenant à l’utilisateur',
            )
            return
          }

          room.players.push(user.userId)
          socket.join(String(data.roomId))

          const [hostId, guestId] = room.players

          const hostSocket = this.service.getSocketByUserId(this.io, hostId)
          const guestSocket = this.service.getSocketByUserId(this.io, guestId)

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

          this.repository.getGames()[roomId] = {
            roomId,
            players: [
              {
                userId: hostId,
                socketId: hostSocket.id,
                deck: this.repository.shuffleCards(
                  hostDeck.cards.map((dc) => dc.card),
                ),
                hand: [],
                activeCard: null,
                score: 0,
              },
              {
                userId: guestId,
                socketId: guestSocket.id,
                deck: this.repository.shuffleCards(
                  guestDeck.cards.map((dc) => dc.card),
                ),
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

          delete this.repository.getRooms()[data.roomId]
          this.io.emit(
            'roomsListUpdated',
            Object.entries(this.repository.getRooms())
              .filter(([, r]) => r.players.length === 1)
              .map(([id, r]) => ({ roomId: id, ...r })),
          )
        },
      )

      /**
       * Permet au joueur courant de piocher jusqu'à 5 cartes en main.
       * @param roomId - Identifiant de la partie
       */
      socket.on('drawCards', ({ roomId }) => {
        const roomIdNum = Number(roomId)
        const game = this.repository.getGames()[roomIdNum]
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
            .emit('gameStateUpdated', this.service.playerView(game, p.socketId))
        })
      })

      /**
       * Joue une carte de la main et la place en carte active.
       * @param roomId - Identifiant de la partie
       * @param cardIndex - Index de la carte dans la main
       */
      socket.on('playCard', ({ roomId, cardIndex }) => {
        const roomIdNum = Number(roomId)
        const game = this.repository.getGames()[roomIdNum]
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
            .emit('gameStateUpdated', this.service.playerView(game, p.socketId))
        })
      })

      /**
       * Exécute une attaque entre les cartes actives des joueurs
       * et met à jour les points ainsi que le tour courant.
       * @param roomId - Identifiant de la partie
       */
      socket.on('attack', ({ roomId }) => {
        const roomIdNum = Number(roomId)
        const game = this.repository.getGames()[roomIdNum]
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
            delete this.repository.getGames()[roomId]
            return
          }
        }

        game.currentPlayerSocketId = defender.socketId
        game.currentPlayerUserId = defender.userId

        game.players.forEach((p) => {
          this.io
            .to(p.socketId)
            .emit('gameStateUpdated', this.service.playerView(game, p.socketId))
        })
      })

      /**
       * Termine le tour du joueur courant et passe la main à l'adversaire.
       * @param roomId - Identifiant de la partie
       */
      socket.on('endTurn', ({ roomId }) => {
        const roomIdNum = Number(roomId)
        const game = this.repository.getGames()[roomIdNum]
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
            .emit('gameStateUpdated', this.service.playerView(game, p.socketId))
        })
      })

      /**
       * Gère la déconnexion d'un joueur.
       */
      socket.on('disconnect', () => {})
    })
  }
}
