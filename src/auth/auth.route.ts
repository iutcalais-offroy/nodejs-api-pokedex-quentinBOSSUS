import { Router } from "express";
import { authController } from "./auth.controller";

const router = Router();

router.post("/sign-up", authController.signUp);
router.post("/sign-in", authController.signIn);

export default router;
