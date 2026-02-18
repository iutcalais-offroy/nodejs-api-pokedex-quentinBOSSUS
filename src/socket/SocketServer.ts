import { Server as HTTPServer } from 'http'
import { Server, Socket } from 'socket.io'
import jwt from 'jsonwebtoken'
import { env } from '../env'

interface JwtPayload {
  userId: number
  email: string
}

export class SocketServer {
  private io: Server

  constructor(httpServer: HTTPServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: '*',
      },
    })

    this.initializeMiddleware()
    this.initializeSocket()
  }

  private initializeMiddleware() {
    this.io.use((socket, next) => {
      const token = socket.handshake.auth?.token

      if (!token) {
        return next(new Error('Authentication token missing'))
      }

      try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload

        socket.data.user = {
          userId: decoded.userId,
          email: decoded.email,
        }

        next()
      } catch {
        return next(new Error('Invalid token'))
      }
    })
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
      socket.on('disconnect', () => {})
    })
  }
}
