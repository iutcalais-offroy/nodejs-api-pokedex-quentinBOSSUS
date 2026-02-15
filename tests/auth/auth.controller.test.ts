import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Request, Response } from 'express'
import { authController } from '../../src/auth/auth.controller'
import { authService } from '../../src/auth/auth.service'

vi.mock('../../src/auth/auth.service')

describe('authController', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let statusMock: ReturnType<typeof vi.fn>
  let jsonMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    req = {}
    jsonMock = vi.fn()
    statusMock = vi.fn().mockReturnValue({ json: jsonMock })
    res = { status: statusMock, json: jsonMock } as Pick<
      Response,
      'status' | 'json'
    > as Response
  })

  describe('signUp', () => {
    it('should create user and return token', async () => {
      req.body = { email: 'new@test.com', username: 'user', password: 'pass' }

      vi.mocked(authService.signUp).mockResolvedValue({
        token: 'mock-token',
        user: { id: 1, email: 'new@test.com', username: 'user' },
      })

      await authController.signUp(req as Request, res as Response)

      expect(statusMock).toHaveBeenCalledWith(201)
      expect(jsonMock).toHaveBeenCalledWith({
        token: 'mock-token',
        user: { id: 1, email: 'new@test.com', username: 'user' },
      })
    })

    it('should return 400 on error', async () => {
      req.body = {}
      vi.mocked(authService.signUp).mockRejectedValue({
        status: 400,
        message: 'Missing or invalid data',
      })

      await authController.signUp(req as Request, res as Response)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Missing or invalid data',
      })
    })

    it('should return 500 on unexpected error', async () => {
      req.body = { email: 'new@test.com', username: 'user', password: 'pass' }
      vi.mocked(authService.signUp).mockRejectedValue(new Error('Fail'))

      await authController.signUp(req as Request, res as Response)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Internal server error' })
    })
  })

  describe('signIn', () => {
    it('should return token and user on success', async () => {
      req.body = { email: 'test@test.com', password: 'pass' }

      vi.mocked(authService.signIn).mockResolvedValue({
        token: 'mock-token',
        user: { id: 1, email: 'test@test.com', username: 'user' },
      })

      await authController.signIn(req as Request, res as Response)

      expect(statusMock).toHaveBeenCalledWith(200)
      expect(jsonMock).toHaveBeenCalledWith({
        token: 'mock-token',
        user: { id: 1, email: 'test@test.com', username: 'user' },
      })
    })

    it('should return 400 on error', async () => {
      req.body = {}
      vi.mocked(authService.signIn).mockRejectedValue({
        status: 400,
        message: 'Missing or invalid data',
      })

      await authController.signIn(req as Request, res as Response)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Missing or invalid data',
      })
    })

    it('should return 500 on unexpected error', async () => {
      req.body = { email: 'test@test.com', password: 'pass' }
      vi.mocked(authService.signIn).mockRejectedValue(new Error('Fail'))

      await authController.signIn(req as Request, res as Response)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Internal server error' })
    })
  })
})
