import { describe, it, expect, vi, beforeEach } from 'vitest'
import { deckService } from '../../src/decks/deck.service'
import { deckRepository } from '../../src/decks/deck.repository'
import { prisma } from '../../src/database'

vi.mock('../../src/decks/deck.repository', () => ({
  deckRepository: {
    findCardsByIds: vi.fn(),
    createDeck: vi.fn(),
    findDecksByUserId: vi.fn(),
  },
}))

vi.mock('../../src/database', () => ({
  prisma: {
    deck: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    card: {
      findMany: vi.fn(),
    },
    deckCard: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
  },
}))

describe('deckServiceTest', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createDeck', () => {
    it('should throw if name missing', async () => {
      await expect(
        deckService.createDeck(1, '', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
      ).rejects.toEqual({ status: 400, message: 'Deck name is required' })
    })

    it('should throw if cards length !== 10', async () => {
      await expect(deckService.createDeck(1, 'Test', [1, 2])).rejects.toEqual({
        status: 400,
        message: 'Deck must contain exactly 10 cards',
      })
    })

    it('should throw if some cards invalid', async () => {
      ;(
        deckRepository.findCardsByIds as unknown as {
          mockResolvedValue: (v: unknown) => unknown
        }
      ).mockResolvedValue([{ id: 1 }])

      await expect(
        deckService.createDeck(1, 'Test', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
      ).rejects.toEqual({
        status: 400,
        message: 'Some card IDs are invalid',
      })
    })

    it('should create deck if valid', async () => {
      const cards = Array.from({ length: 10 }, (_, i) => ({ id: i }))

      ;(
        deckRepository.findCardsByIds as unknown as {
          mockResolvedValue: (v: unknown) => unknown
        }
      ).mockResolvedValue(cards)
      ;(
        deckRepository.createDeck as unknown as {
          mockResolvedValue: (v: unknown) => unknown
        }
      ).mockResolvedValue({ id: 1 })

      const result = await deckService.createDeck(
        1,
        'Test',
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      )

      expect(result).toEqual({ id: 1 })
    })
  })

  describe('getMyDecks', () => {
    it('should return decks', async () => {
      ;(
        deckRepository.findDecksByUserId as unknown as {
          mockResolvedValue: (v: unknown) => unknown
        }
      ).mockResolvedValue([{ id: 1 }])

      const result = await deckService.getMyDecks(1)
      expect(result).toEqual([{ id: 1 }])
    })
  })

  describe('getDeckById', () => {
    it('should return a deck if found', async () => {
      ;(
        prisma.deck.findFirst as unknown as {
          mockResolvedValue: (v: unknown) => unknown
        }
      ).mockResolvedValue({ id: 1, name: 'Deck1', userId: 1, cards: [] })

      const result = await deckService.getDeckById(1, 1)
      expect(result).toEqual({ id: 1, name: 'Deck1', userId: 1, cards: [] })
    })

    it('should return null if deck not found', async () => {
      ;(
        prisma.deck.findFirst as unknown as {
          mockResolvedValue: (v: unknown) => unknown
        }
      ).mockResolvedValue(null)

      const result = await deckService.getDeckById(1, 1)
      expect(result).toBeNull()
    })
  })

  describe('updateDeck', () => {
    it('should return null if deck not found or not owner', async () => {
      ;(
        prisma.deck.findUnique as unknown as {
          mockResolvedValue: (v: unknown) => unknown
        }
      ).mockResolvedValue(null)

      const result = await deckService.updateDeck(
        1,
        1,
        'name',
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      )
      expect(result).toBeNull()
    })

    it('should throw if nothing to update', async () => {
      ;(
        prisma.deck.findUnique as unknown as {
          mockResolvedValue: (v: unknown) => unknown
        }
      ).mockResolvedValue({ id: 1, userId: 1 })

      await expect(deckService.updateDeck(1, 1)).rejects.toEqual({
        status: 400,
        message: 'Nothing to update',
      })
    })

    it('should throw if cards length !== 10', async () => {
      ;(
        prisma.deck.findUnique as unknown as {
          mockResolvedValue: (v: unknown) => unknown
        }
      ).mockResolvedValue({ id: 1, userId: 1 })

      await expect(
        deckService.updateDeck(1, 1, undefined, [1, 2]),
      ).rejects.toEqual({
        status: 400,
        message: 'Deck must have exactly 10 cards',
      })
    })

    it('should throw if invalid card IDs', async () => {
      ;(
        prisma.deck.findUnique as unknown as {
          mockResolvedValue: (v: unknown) => unknown
        }
      ).mockResolvedValue({ id: 1, userId: 1 })
      ;(
        prisma.card.findMany as unknown as {
          mockResolvedValue: (v: unknown) => unknown
        }
      ).mockResolvedValue([{ id: 1 }]) // moins de 10

      await expect(
        deckService.updateDeck(
          1,
          1,
          undefined,
          Array.from({ length: 10 }, (_, i) => i + 1),
        ),
      ).rejects.toEqual({ status: 400, message: 'Invalid card IDs' })
    })

    it('should update name and cards successfully', async () => {
      const deckMock = { id: 1, userId: 1, name: 'OldDeck' }
      const updatedMock = { id: 1, name: 'NewDeck', cards: [] }

      ;(
        prisma.deck.findUnique as unknown as {
          mockResolvedValue: (v: unknown) => unknown
        }
      ).mockResolvedValue(deckMock)
      ;(
        prisma.card.findMany as unknown as {
          mockResolvedValue: (v: unknown) => unknown
        }
      ).mockResolvedValue(Array.from({ length: 10 }, (_, i) => ({ id: i + 1 })))
      ;(
        prisma.deck.update as unknown as {
          mockResolvedValue: (v: unknown) => unknown
        }
      ).mockResolvedValue(updatedMock)
      ;(
        prisma.deckCard.deleteMany as unknown as {
          mockResolvedValue: (v: unknown) => unknown
        }
      ).mockResolvedValue(undefined)
      ;(
        prisma.deckCard.createMany as unknown as {
          mockResolvedValue: (v: unknown) => unknown
        }
      ).mockResolvedValue(undefined)

      const result = await deckService.updateDeck(
        1,
        1,
        'NewDeck',
        Array.from({ length: 10 }, (_, i) => i + 1),
      )
      expect(result).toEqual(updatedMock)
    })

    it('should update name only successfully', async () => {
      const deckMock = { id: 1, userId: 1, name: 'OldDeck' }
      const updatedMock = { id: 1, name: 'NewDeck', cards: [] }

      ;(
        prisma.deck.findUnique as unknown as {
          mockResolvedValue: (v: unknown) => unknown
        }
      ).mockResolvedValue(deckMock)
      ;(
        prisma.deck.update as unknown as {
          mockResolvedValue: (v: unknown) => unknown
        }
      ).mockResolvedValue(updatedMock)

      const result = await deckService.updateDeck(1, 1, 'NewDeck')

      expect(result).toEqual(updatedMock)
      expect(prisma.deck.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: 'NewDeck' },
        include: { cards: { include: { card: true } } },
      })
    })

    it('should update with same name when name is undefined', async () => {
      const deckMock = { id: 1, userId: 1, name: 'OldDeck' }
      const updatedMock = { id: 1, name: 'OldDeck', cards: [] }

      ;(
        prisma.deck.findUnique as unknown as {
          mockResolvedValue: (v: unknown) => unknown
        }
      ).mockResolvedValue(deckMock)
      ;(
        prisma.card.findMany as unknown as {
          mockResolvedValue: (v: unknown) => unknown
        }
      ).mockResolvedValue(Array.from({ length: 10 }, (_, i) => ({ id: i + 1 })))
      ;(
        prisma.deckCard.deleteMany as unknown as {
          mockResolvedValue: (v: unknown) => unknown
        }
      ).mockResolvedValue(undefined)
      ;(
        prisma.deckCard.createMany as unknown as {
          mockResolvedValue: (v: unknown) => unknown
        }
      ).mockResolvedValue(undefined)
      ;(
        prisma.deck.update as unknown as {
          mockResolvedValue: (v: unknown) => unknown
        }
      ).mockResolvedValue(updatedMock)

      const result = await deckService.updateDeck(
        1,
        1,
        undefined,
        Array.from({ length: 10 }, (_, i) => i + 1),
      )

      expect(result).toEqual(updatedMock)
      expect(prisma.deck.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: 'OldDeck' },
        include: { cards: { include: { card: true } } },
      })
    })
  })

  describe('deleteDeck', () => {
    it('should return null if not owner', async () => {
      ;(
        prisma.deck.findUnique as unknown as {
          mockResolvedValue: (v: unknown) => unknown
        }
      ).mockResolvedValue(null)

      const result = await deckService.deleteDeck(1, 1)
      expect(result).toBeNull()
    })

    it('should delete deck if owner', async () => {
      ;(
        prisma.deck.findUnique as unknown as {
          mockResolvedValue: (v: unknown) => unknown
        }
      ).mockResolvedValue({ id: 1, userId: 1 })

      const result = await deckService.deleteDeck(1, 1)
      expect(result).toBe(true)
    })
  })
})
