import { Router } from "express";
import { deckController } from "./deck.controller";
import { authenticateJWT } from "../auth/auth.middleware";

const router = Router();

router.post("/", authenticateJWT, deckController.create);

export default router;
