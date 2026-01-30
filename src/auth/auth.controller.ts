import { Request, Response } from "express";
import { authService } from "./auth.service";

export const authController = {
  async signUp(req: Request, res: Response) {
    try {
      const result = await authService.signUp(req.body);
      return res.status(201).json(result);
    } catch (error: any) {
      if (error?.status) {
        return res.status(error.status).json({ error: error.message });
      }

      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
};
