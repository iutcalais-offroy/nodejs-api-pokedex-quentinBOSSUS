import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import {
  authenticateJWT,
  type AuthRequest,
} from '../../src/auth/auth.middleware'
import { env } from '../../src/env'

vi.mock('jsonwebtoken')

describe('authMiddlewareTest', () => {
  const mockStatus = vi.fn()
  const mockJson = vi.fn()

  const res = {
    status: mockStatus,
    json: mockJson,
  } as unknown as Response

  const next: NextFunction = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockStatus.mockReturnValue(res)
  })

  it('returns 401 if authorization header is missing', () => {
    const req = {
      headers: {},
    } as AuthRequest

    authenticateJWT(req, res, next)

    expect(mockStatus).toHaveBeenCalledWith(401)
    expect(mockJson).toHaveBeenCalledWith({ error: 'Token missing' })
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 401 if authorization header is malformed', () => {
    const req = {
      headers: { authorization: 'Basic abc123' },
    } as AuthRequest

    authenticateJWT(req, res, next)

    expect(mockStatus).toHaveBeenCalledWith(401)
    expect(mockJson).toHaveBeenCalledWith({ error: 'Token missing' })
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 401 if token is invalid', () => {
    const req = {
      headers: { authorization: 'Bearer invalid-token' },
    } as AuthRequest

    vi.mocked(jwt.verify).mockImplementation(() => {
      throw new Error('Invalid token')
    })

    authenticateJWT(req, res, next)

    expect(jwt.verify).toHaveBeenCalledWith('invalid-token', env.JWT_SECRET)
    expect(mockStatus).toHaveBeenCalledWith(401)
    expect(mockJson).toHaveBeenCalledWith({
      error: 'Invalid or expired token',
    })
    expect(next).not.toHaveBeenCalled()
  })

  it('calls next and attaches user if token is valid', () => {
    const req = {
      headers: { authorization: 'Bearer valid-token' },
    } as AuthRequest

    vi.mocked(jwt.verify).mockImplementation(() => ({
      userId: 1,
      email: 'test@example.com',
    }))

    authenticateJWT(req, res, next)

    expect(jwt.verify).toHaveBeenCalledWith('valid-token', env.JWT_SECRET)
    expect(req.user).toEqual({
      userId: 1,
      email: 'test@example.com',
    })
    expect(next).toHaveBeenCalled()
    expect(mockStatus).not.toHaveBeenCalled()
  })
})
