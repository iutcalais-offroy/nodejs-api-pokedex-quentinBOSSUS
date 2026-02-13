import { Request, Response } from 'express'
import { authService } from './auth.service'

type ErrorWithStatus = {
  status: number
  message: string
}

function isErrorWithStatus(error: unknown): error is ErrorWithStatus {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    'message' in error
  )
}

export const authController = {
  async signUp(req: Request, res: Response) {
    try {
      const result = await authService.signUp(req.body)
      return res.status(201).json(result)
    } catch (error: unknown) {
      if (isErrorWithStatus(error)) {
        return res.status(error.status).json({ error: error.message })
      }
      return res.status(500).json({ error: 'Internal server error' })
    }
  },

  async signIn(req: Request, res: Response) {
    try {
      const result = await authService.signIn(req.body)
      return res.status(200).json(result)
    } catch (error: unknown) {
      if (isErrorWithStatus(error)) {
        return res.status(error.status).json({ error: error.message })
      }
      return res.status(500).json({ error: 'Internal server error' })
    }
  },
}
