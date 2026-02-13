import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../env'

export interface AuthRequest extends Request {
  user?: {
    userId: number
    email: string
  }
}

export const authenticateJWT = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token missing' })
    return
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      userId: number
      email: string
    }
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    }
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
    return
  }
}
