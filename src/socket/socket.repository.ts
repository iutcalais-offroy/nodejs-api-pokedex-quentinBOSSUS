import { prisma } from '../database'
import { GameCard, GameState } from './socket.types'

export class SocketRepository {
  private games: Record<number, GameState> = {}

  private rooms: Record<
    number,
    {
      hostId: number
      hostEmail: string
      deckId: number
      players: number[]
    }
  > = {}

  public getGames() {
    return this.games
  }

  public getRooms() {
    return this.rooms
  }

  public async validateDeck(deckId: number, userId: number): Promise<boolean> {
    const deck = await prisma.deck.findUnique({
      where: { id: deckId },
      include: {
        cards: true,
      },
    })

    if (!deck) return false
    if (deck.userId !== userId) return false
    if (deck.cards.length !== 10) return false

    return true
  }

  public shuffleCards(array: GameCard[]): GameCard[] {
    return [...array].sort(() => Math.random() - 0.5)
  }
}
