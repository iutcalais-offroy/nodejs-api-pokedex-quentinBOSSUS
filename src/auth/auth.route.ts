import { Router } from "express";
import { authController } from "./auth.controller";

const router = Router();

router.post("/sign-up", authController.signUp);

export default router;
