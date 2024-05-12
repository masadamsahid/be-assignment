import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { sendErrorZodValidationReply, sendError, sendReply } from "../lib/custom-reply";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { compareHashPwd, hashPwd } from "../lib/hashing";
import { generateAuthToken } from "../lib/jwt";

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
      }, { message: "Please fill the required fields" }).refine((schema) => schema.confirmPassword === schema.password, {
        message: "Confirm password must match",
        path: ["confirmPassword"],
      });

      const { data, error } = registerSchema.safeParse(body);
      if (error) return sendErrorZodValidationReply(reply, error);

      delete data.confirmPassword;
      data.password = await hashPwd(data.password);
      
      let newUser;
      try {
        newUser = await fastify.prisma.user.create({
          data,
          select: { id: true, username: true },
        });
      } catch (error) {
        if(
          error instanceof PrismaClientKnownRequestError
          && error.code === "P2002"
        ) return sendError(reply, { code: 400, message: "Username already taken" });
        throw error;
      }
      
      const authToken = generateAuthToken(newUser);
      
      return sendReply(reply, { message: "Success register user", data: { authToken } });
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
      }, { message: "Please fill the required fields" });

      const { data, error } = registerSchema.safeParse(body);
      if (error) return sendErrorZodValidationReply(reply, error);

      const user = await fastify.prisma.user.findUnique({
        where: { username: data.username },
      });
      if (!user) return sendError(reply, { code: 400, message: "Wrong credentials" });
      
      const isPwdMatch = await compareHashPwd(data.password, user.password);
      if (!isPwdMatch) return sendError(reply, { code: 400, message: "Wrong credentials" });
      
      const authToken = generateAuthToken(user);

      return sendReply(reply, { message: "Authentication success", data: { authToken } });
    } catch (error) {
      console.log("[ERR_AUTH_LOGIN_POST]:", error);
      return sendError(reply);
    }
  });
}

export default authRoutes;