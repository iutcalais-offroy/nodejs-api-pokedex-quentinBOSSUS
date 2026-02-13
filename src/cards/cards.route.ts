import { Router } from 'express'
import { cardsController } from './cards.controller'

const router = Router()

router.get('/', cardsController.getAll)

export default router
