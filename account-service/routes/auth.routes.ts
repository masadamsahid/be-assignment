import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { sendErrorZodValidationReply, sendError, sendReply } from "../lib/custom-reply";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

type RegisterDto = {
  username: string;
  password: string;
  confirmPassword?: string;
}

type LoginDto = {
  username: string;
  password: string;
}

const authRoutes: FastifyPluginAsync = async (fastify, opt) => {
  
  fastify.post<{ Body: RegisterDto }>("/register", {}, async (request, reply) => {
    try {
      const body = request.body;

      const registerSchema = z.object({
        username: z.string().min(4).max(32).regex(/[a-zA-Z0-9]/gi),
        password: z.string().min(4).max(128),
        confirmPassword: z.string().optional(),
      }).refine((schema) => schema.confirmPassword === schema.password, {
        message: "Confirm password must match",
        path: ["confirmPassword"],
      });

      const { data, error } = registerSchema.safeParse(body);
      if (error) return sendErrorZodValidationReply(reply, error);

      // TODO: save user data to DB using Prisma
      delete data.confirmPassword;
      let newUser;
      try {
        newUser = await fastify.prisma.user.create({ data });
      } catch (error) {
        if(
          error instanceof PrismaClientKnownRequestError
          && error.code === "P2002"
        ) return sendError(reply, { code: 400, message: "Username already taken" });
        throw error;
      }

      return sendReply(reply, { data: newUser });
    } catch (error) {
      console.log("[ERR_AUTH_REGISTER_POST]:", error);
      return sendError(reply);
    }
  });

  fastify.post<{ Body: LoginDto }>("/login", {}, async (request, reply) => {
    try {

      const body = request.body;

      const registerSchema = z.object({
        username: z.string().min(4).max(32).regex(/[a-zA-Z0-9]/gi),
        password: z.string().min(4).max(128),
      });

      const { data, error } = registerSchema.safeParse(body);
      if (error) return sendErrorZodValidationReply(reply, error);

      // TODO: authenticate user data

      return sendReply(reply, { data });
    } catch (error) {
      console.log("[ERR_AUTH_LOGIN_POST]:", error);
      return sendError(reply);
    }
  });
}

export default authRoutes;