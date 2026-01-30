import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authRepository } from "./auth.repository";
import { env } from "../env";

type SignUpInput = {
  email: string;
  username: string;
  password: string;
};

type SignInInput = {
  email: string;
  password: string;
};

export const authService = {
  async signUp({ email, username, password }: SignUpInput) {
    // Validation
    if (!email || !username || !password) {
      throw { status: 400, message: "Missing or invalid data" };
    }

    // Email unique
    const existingUser = await authRepository.findByEmail(email);
    if (existingUser) {
      throw { status: 409, message: "Email already used" };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await authRepository.createUser({
      email,
      username,
      password: hashedPassword,
    });

    // JWT (7 jours)
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    };
  },
  
  async signIn({ email, password }: SignInInput) {
    // Validation
    if (!email || !password) {
      throw { status: 400, message: "Missing or invalid data" };
    }

    // Email ou mot de passe invalide
    const user = await authRepository.findByEmail(email);
    if (!user) {
      throw { status: 401, message: "Invalid email or password" };
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw { status: 401, message: "Invalid email or password" };
    }

    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email 
      }, 
      env.JWT_SECRET, 
      { expiresIn: "7d" }
    );

    return { 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        username: user.username 
      } 
    };
    }
};
