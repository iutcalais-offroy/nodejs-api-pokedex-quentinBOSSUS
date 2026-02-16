import { describe, it, expect, vi, beforeEach } from 'vitest'
import { deckRepository } from '../../src/decks/deck.repository'
import { prisma } from '../../src/database'

vi.mock('../../src/database', () => ({
  prisma: {
    deck: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    card: {
      findMany: vi.fn(),
    },
  },
}))

describe('deckRepositoryTest', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createDeck', () => {
    it('should call prisma.deck.create with correct params', async () => {
      const mockDeck = { id: 1, name: 'Test Deck', userId: 1, cards: [] }

      ;(
        prisma.deck.create as unknown as {
          mockResolvedValue: (value: unknown) => unknown
        }
      ).mockResolvedValue(mockDeck)

      const result = await deckRepository.createDeck(1, 'Test Deck', [10, 20])

      expect(prisma.deck.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Deck',
          userId: 1,
          cards: {
            create: [{ cardId: 10 }, { cardId: 20 }],
          },
        },
        include: { cards: true },
      })

      expect(result).toEqual(mockDeck)
    })
  })

  describe('findCardsByIds', () => {
    it('should call prisma.card.findMany with correct params', async () => {
      const mockCards = [{ id: 10 }, { id: 20 }]

      ;(
        prisma.card.findMany as unknown as {
          mockResolvedValue: (value: unknown) => unknown
        }
      ).mockResolvedValue(mockCards)

      const result = await deckRepository.findCardsByIds([10, 20])

      expect(prisma.card.findMany).toHaveBeenCalledWith({
        where: { id: { in: [10, 20] } },
      })

      expect(result).toEqual(mockCards)
    })
  })

  describe('findDecksByUserId', () => {
    it('should call prisma.deck.findMany with correct params', async () => {
      const mockDecks = [{ id: 1, userId: 1 }]

      ;(
        prisma.deck.findMany as unknown as {
          mockResolvedValue: (value: unknown) => unknown
        }
      ).mockResolvedValue(mockDecks)

      const result = await deckRepository.findDecksByUserId(1)

      expect(prisma.deck.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        include: {
          cards: {
            include: { card: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      expect(result).toEqual(mockDecks)
    })
  })
})
