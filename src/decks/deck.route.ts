import { Router } from "express";
import { deckController } from "./deck.controller";
import { authenticateJWT } from "../auth/auth.middleware";

const router = Router();

router.post("/", authenticateJWT, deckController.create);
router.get("/mine", authenticateJWT, deckController.getMine);
router.get("/:id", authenticateJWT, deckController.getById);


export default router;
