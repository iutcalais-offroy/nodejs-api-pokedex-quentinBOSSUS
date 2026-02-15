import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Request, Response } from 'express'
import { cardsController } from '../../src/cards/cards.controller'
import { prisma } from '../../src/database'

vi.mock('../../src/database', () => ({
  prisma: {
    card: {
      findMany: vi.fn(),
    },
  },
}))

describe('cardsControllerTest', () => {
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

  describe('getAll', () => {
    it('should return 200 and cards', async () => {
      const mockCards = [
        { id: 1, name: 'Bulbasaur', pokedexNumber: 1 },
        { id: 2, name: 'Ivysaur', pokedexNumber: 2 },
      ]

      ;(
        prisma.card.findMany as unknown as {
          mockResolvedValue: (value: unknown) => unknown
        }
      ).mockResolvedValue(mockCards)

      await cardsController.getAll(req as Request, res as Response)

      expect(prisma.card.findMany).toHaveBeenCalledWith({
        orderBy: { pokedexNumber: 'asc' },
      })

      expect(statusMock).toHaveBeenCalledWith(200)
      expect(jsonMock).toHaveBeenCalledWith(mockCards)
    })

    it('should return 500 on error', async () => {
      ;(
        prisma.card.findMany as unknown as {
          mockRejectedValue: (value: unknown) => unknown
        }
      ).mockRejectedValue(new Error('DB error'))

      await cardsController.getAll(req as Request, res as Response)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Internal server error',
      })
    })
  })
})
