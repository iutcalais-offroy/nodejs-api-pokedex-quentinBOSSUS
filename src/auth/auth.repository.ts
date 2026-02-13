import { prisma } from '../database'
import { User } from '../generated/prisma/client'

export const authRepository = {
  findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    })
  },

  createUser(data: {
    email: string
    username: string
    password: string
  }): Promise<User> {
    return prisma.user.create({
      data,
    })
  },
}
