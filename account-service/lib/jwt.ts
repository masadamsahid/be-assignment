import { type Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_AUTH_SECRET = process.env.JWT_AUTH_SECRET!;

type AuthTokenPayload = Prisma.UserGetPayload<{ select: { id: true, username: true } }>;

export const generateAuthToken = ({ id, username }: AuthTokenPayload) => {
  return jwt.sign({ id, username }, JWT_AUTH_SECRET, { expiresIn: '1d' });
}


