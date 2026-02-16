import { describe, it, expect, vi, beforeEach } from 'vitest'
import { authRepository } from '../../src/auth/auth.repository'
import { prismaMock } from './../vitest.setup'

describe('authRepositoryTest', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('findByEmail', () => {
    it('should return user if found', async () => {
      const mockUser = {
        id: 1,
        email: 'test@test.com',
        username: 'user',
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      prismaMock.user.findUnique.mockResolvedValue(mockUser)

      const result = await authRepository.findByEmail('test@test.com')
      expect(result).toEqual(mockUser)
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@test.com' },
      })
    })

    it('should return null if user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null)

      const result = await authRepository.findByEmail('notfound@test.com')
      expect(result).toBeNull()
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'notfound@test.com' },
      })
    })
  })

  describe('createUser', () => {
    it('should create and return a new user', async () => {
      const mockUser = {
        id: 1,
        email: 'new@test.com',
        username: 'user',
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      prismaMock.user.create.mockResolvedValue(mockUser)

      const result = await authRepository.createUser({
        email: 'new@test.com',
        username: 'user',
        password: 'hashed',
      })

      expect(result).toEqual(mockUser)
      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: { email: 'new@test.com', username: 'user', password: 'hashed' },
      })
    })
  })
})
