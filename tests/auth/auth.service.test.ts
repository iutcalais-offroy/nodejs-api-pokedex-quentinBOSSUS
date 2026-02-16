import { describe, it, expect, vi, beforeEach } from 'vitest'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { authService } from '../../src/auth/auth.service'
import { authRepository } from '../../src/auth/auth.repository'

vi.mock('bcryptjs')
vi.mock('jsonwebtoken')

describe('authServiceTest', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('signUp', () => {
    it('should create user and return token', async () => {
      vi.spyOn(authRepository, 'findByEmail').mockResolvedValue(null)
      vi.spyOn(authRepository, 'createUser').mockResolvedValue({
        id: 1,
        email: 'new@test.com',
        username: 'user',
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed' as unknown as void)
      vi.mocked(jwt.sign).mockImplementation(() => 'mock-token')

      const result = await authService.signUp({
        email: 'new@test.com',
        username: 'user',
        password: 'pass',
      })

      expect(result).toEqual({
        token: 'mock-token',
        user: { id: 1, email: 'new@test.com', username: 'user' },
      })
    })

    it('should throw 400 if missing input', async () => {
      await expect(
        authService.signUp({ email: '', username: '', password: '' }),
      ).rejects.toEqual({ status: 400, message: 'Missing or invalid data' })
    })

    it('should throw 409 if email exists', async () => {
      vi.spyOn(authRepository, 'findByEmail').mockResolvedValue({
        id: 1,
        email: 'exists@test.com',
        username: 'user',
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      await expect(
        authService.signUp({
          email: 'exists@test.com',
          username: 'user',
          password: 'pass',
        }),
      ).rejects.toEqual({ status: 409, message: 'Email already used' })
    })
  })

  describe('signIn', () => {
    it('should return token and user on success', async () => {
      vi.spyOn(authRepository, 'findByEmail').mockResolvedValue({
        id: 1,
        email: 'test@test.com',
        username: 'user',
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      vi.mocked(bcrypt.compare).mockResolvedValue(true as unknown as void)
      vi.mocked(jwt.sign).mockImplementation(() => 'mock-token')

      const result = await authService.signIn({
        email: 'test@test.com',
        password: 'pass',
      })

      expect(result).toEqual({
        token: 'mock-token',
        user: { id: 1, email: 'test@test.com', username: 'user' },
      })
    })

    it('should throw 400 if missing input', async () => {
      await expect(
        authService.signIn({ email: '', password: '' }),
      ).rejects.toEqual({ status: 400, message: 'Missing or invalid data' })
    })

    it('should throw 401 if email not found', async () => {
      vi.spyOn(authRepository, 'findByEmail').mockResolvedValue(null)

      await expect(
        authService.signIn({ email: 'notfound@test.com', password: 'pass' }),
      ).rejects.toEqual({ status: 401, message: 'Invalid email or password' })
    })

    it('should throw 401 if password invalid', async () => {
      vi.spyOn(authRepository, 'findByEmail').mockResolvedValue({
        id: 1,
        email: 'test@test.com',
        username: 'user',
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      vi.mocked(bcrypt.compare).mockResolvedValue(false as unknown as void)

      await expect(
        authService.signIn({ email: 'test@test.com', password: 'wrong' }),
      ).rejects.toEqual({ status: 401, message: 'Invalid email or password' })
    })
  })
})
