import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Response } from 'express'
import { deckController } from '../../src/decks/deck.controller'
import { deckService } from '../../src/decks/deck.service'
import type { AuthRequest } from '../../src/auth/auth.middleware'

vi.mock('../../src/decks/deck.service')

describe('deckControllerTest', () => {
  let req: Partial<AuthRequest>
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

  describe('create', () => {
    it('should create a deck successfully', async () => {
      req.user = { userId: 1, email: 'test@example.com' }
      req.body = {
        name: 'My Deck',
        cards: Array.from({ length: 10 }, (_, i) => i + 1),
      }

      vi.mocked(deckService.createDeck).mockResolvedValue({
        id: 1,
        name: 'My Deck',
        userId: 1,
        cards: req.body.cards.map((id: number) => ({ cardId: id })),
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      await deckController.create(req as AuthRequest, res as Response)

      expect(statusMock).toHaveBeenCalledWith(201)
      expect(jsonMock).toHaveBeenCalledWith({
        id: 1,
        name: 'My Deck',
        userId: 1,
        cards: req.body.cards.map((id: number) => ({ cardId: id })),
      })
    })

    it('should return 401 if user is not logged in', async () => {
      req.user = undefined
      await deckController.create(req as AuthRequest, res as Response)

      expect(statusMock).toHaveBeenCalledWith(401)
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized' })
    })

    it('should return 400 if service throws a known error', async () => {
      req.user = { userId: 1, email: 'test@example.com' }
      req.body = {}
      vi.mocked(deckService.createDeck).mockRejectedValue({
        status: 400,
        message: 'Deck name is required',
      })

      await deckController.create(req as AuthRequest, res as Response)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Deck name is required' })
    })

    it('should return 500 on unexpected error', async () => {
      req.user = { userId: 1, email: 'test@example.com' }
      req.body = {
        name: 'My Deck',
        cards: Array.from({ length: 10 }, (_, i) => i + 1),
      }
      vi.mocked(deckService.createDeck).mockRejectedValue(new Error('Fail'))

      await deckController.create(req as AuthRequest, res as Response)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Internal server error' })
    })
  })

  describe('getMine', () => {
    it('should return user decks', async () => {
      req.user = { userId: 1, email: 'test@example.com' }
      const decks = [
        {
          id: 1,
          name: 'Deck1',
          userId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          cards: [],
        },
      ]
      vi.mocked(deckService.getMyDecks).mockResolvedValue(decks)

      await deckController.getMine(req as AuthRequest, res as Response)

      expect(statusMock).toHaveBeenCalledWith(200)
      expect(jsonMock).toHaveBeenCalledWith(decks)
    })

    it('should return 401 if user is not logged in', async () => {
      req.user = undefined

      await deckController.getMine(req as AuthRequest, res as Response)

      expect(statusMock).toHaveBeenCalledWith(401)
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized' })
    })

    it('should return error status if getMyDecks throws known error', async () => {
      req.user = { userId: 1, email: 'test@example.com' }

      vi.mocked(deckService.getMyDecks).mockRejectedValue({
        status: 403,
        message: 'Forbidden',
      })

      await deckController.getMine(req as AuthRequest, res as Response)

      expect(statusMock).toHaveBeenCalledWith(403)
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Forbidden' })
    })

    it('should return 500 if getMyDecks throws unknown error', async () => {
      req.user = { userId: 1, email: 'test@example.com' }

      vi.mocked(deckService.getMyDecks).mockRejectedValue(
        new Error('Unexpected'),
      )

      await deckController.getMine(req as AuthRequest, res as Response)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Internal server error' })
    })
  })

  describe('getById', () => {
    it('should return a deck by ID', async () => {
      req.user = { userId: 1, email: 'test@example.com' }
      req.params = { id: '1' }
      const deck = {
        id: 1,
        name: 'Deck1',
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        cards: [],
      }

      vi.mocked(deckService.getDeckById).mockResolvedValue(deck)

      await deckController.getById(req as AuthRequest, res as Response)

      expect(statusMock).toHaveBeenCalledWith(200)
      expect(jsonMock).toHaveBeenCalledWith(deck)
    })

    it('should return 400 if deck ID is invalid', async () => {
      req.user = { userId: 1, email: 'test@example.com' }
      req.params = { id: 'abc' }

      await deckController.getById(req as AuthRequest, res as Response)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid deck ID' })
    })

    it('should return 404 if deck not found', async () => {
      req.user = { userId: 1, email: 'test@example.com' }
      req.params = { id: '1' }
      vi.mocked(deckService.getDeckById).mockResolvedValue(null)

      await deckController.getById(req as AuthRequest, res as Response)

      expect(statusMock).toHaveBeenCalledWith(404)
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Deck not found or access denied',
      })
    })

    it('should return 401 if user is not logged in in getById', async () => {
      req.user = undefined
      req.params = { id: '1' }

      await deckController.getById(req as AuthRequest, res as Response)

      expect(statusMock).toHaveBeenCalledWith(401)
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized' })
    })

    it('should return 500 on unexpected error in getById', async () => {
      req.user = { userId: 1, email: 'test@example.com' }
      req.params = { id: '1' }

      vi.mocked(deckService.getDeckById).mockRejectedValue(
        new Error('Unexpected'),
      )

      await deckController.getById(req as AuthRequest, res as Response)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Internal server error' })
    })

    it('should return error status if getDeckById throws known error', async () => {
      req.user = { userId: 1, email: 'test@example.com' }
      req.params = { id: '1' }

      vi.mocked(deckService.getDeckById).mockRejectedValue({
        status: 403,
        message: 'Forbidden',
      })

      await deckController.getById(req as AuthRequest, res as Response)

      expect(statusMock).toHaveBeenCalledWith(403)
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Forbidden' })
    })
  })

  describe('update', () => {
    it('should update deck successfully', async () => {
      req.user = { userId: 1, email: 'test@example.com' }
      req.params = { id: '1' }
      req.body = {
        name: 'Updated Deck',
        cards: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      }

      vi.mocked(deckService.updateDeck).mockResolvedValue({
        id: 1,
        name: 'Updated Deck',
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        cards: [],
      })

      await deckController.update(
        req as unknown as AuthRequest,
        res as Response,
      )

      expect(statusMock).toHaveBeenCalledWith(200)
      expect(jsonMock).toHaveBeenCalledWith({
        id: 1,
        name: 'Updated Deck',
        cards: [],
      })
    })

    it('should return 400 if deckId is invalid', async () => {
      req.user = { userId: 1, email: 'test@example.com' }
      req.params = { id: 'NaN' }

      await deckController.update(
        req as unknown as AuthRequest,
        res as Response,
      )

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid deck ID' })
    })

    it('should return 500 on unexpected error', async () => {
      req.user = { userId: 1, email: 'test@example.com' }
      req.params = { id: '1' }
      req.body = { name: 'Deck', cards: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] }

      vi.mocked(deckService.updateDeck).mockRejectedValue(new Error('Fail'))

      await deckController.update(
        req as unknown as AuthRequest,
        res as Response,
      )

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Internal server error' })
    })

    it('should return 401 if user is not logged in', async () => {
      req.user = undefined
      req.params = { id: '1' }
      req.body = { name: 'Deck', cards: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] }

      await deckController.update(req as AuthRequest, res as Response)

      expect(statusMock).toHaveBeenCalledWith(401)
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized' })
    })

    it('should return 404 if updated deck is null', async () => {
      req.user = { userId: 1, email: 'test@example.com' }
      req.params = { id: '1' }
      req.body = {
        name: 'NewDeck',
        cards: Array.from({ length: 10 }, (_, i) => i + 1),
      }

      vi.mocked(deckService.updateDeck).mockResolvedValue(null)

      await deckController.update(req as AuthRequest, res as Response)

      expect(statusMock).toHaveBeenCalledWith(404)
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Deck not found or access denied',
      })
    })

    it('should return error status if updateDeck throws known error', async () => {
      req.user = { userId: 1, email: 'test@example.com' }
      req.params = { id: '1' }
      req.body = {
        name: 'NewDeck',
        cards: Array.from({ length: 10 }, (_, i) => i + 1),
      }

      vi.mocked(deckService.updateDeck).mockRejectedValue({
        status: 403,
        message: 'Forbidden',
      })

      await deckController.update(req as AuthRequest, res as Response)

      expect(statusMock).toHaveBeenCalledWith(403)
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Forbidden' })
    })
  })

  describe('delete', () => {
    it('should delete deck successfully', async () => {
      req.user = { userId: 1, email: 'test@example.com' }
      req.params = { id: '1' }

      vi.mocked(deckService.deleteDeck).mockResolvedValue(true)

      await deckController.delete(
        req as unknown as AuthRequest,
        res as Response,
      )

      expect(statusMock).toHaveBeenCalledWith(200)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Deck deleted successfully',
      })
    })

    it('should return 400 if deckId is invalid', async () => {
      req.user = { userId: 1, email: 'test@example.com' }
      req.params = { id: 'NaN' }

      await deckController.delete(
        req as unknown as AuthRequest,
        res as Response,
      )

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid deck ID' })
    })

    it('should return 404 if deck not found', async () => {
      req.user = { userId: 1, email: 'test@example.com' }
      req.params = { id: '1' }

      vi.mocked(deckService.deleteDeck).mockResolvedValue(null)

      await deckController.delete(
        req as unknown as AuthRequest,
        res as Response,
      )

      expect(statusMock).toHaveBeenCalledWith(404)
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Deck not found or access denied',
      })
    })

    it('should return 500 on unexpected error', async () => {
      req.user = { userId: 1, email: 'test@example.com' }
      req.params = { id: '1' }

      vi.mocked(deckService.deleteDeck).mockRejectedValue(new Error('Fail'))

      await deckController.delete(
        req as unknown as AuthRequest,
        res as Response,
      )

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Internal server error' })
    })

    it('should return 401 if user is not logged in', async () => {
      req.user = undefined
      req.params = { id: '1' }

      await deckController.delete(req as AuthRequest, res as Response)

      expect(statusMock).toHaveBeenCalledWith(401)
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized' })
    })

    it('should return error status if deleteDeck throws known error', async () => {
      req.user = { userId: 1, email: 'test@example.com' }
      req.params = { id: '1' }

      vi.mocked(deckService.deleteDeck).mockRejectedValue({
        status: 403,
        message: 'Forbidden',
      })

      await deckController.delete(req as AuthRequest, res as Response)

      expect(statusMock).toHaveBeenCalledWith(403)
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Forbidden' })
    })
  })
})
