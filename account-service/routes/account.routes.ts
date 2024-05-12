import { AccountType } from "@prisma/client";
import { FastifyPluginAsync } from "fastify";
import { sendError, sendErrorZodValidationReply, sendReply } from "../lib/custom-reply";
import { z } from "zod";
import { isAuthenticated } from "../middlewares/auth.middlewares";

type CreateAccountDto = {
  name: string;
  type: AccountType;
}

const accountRoutes: FastifyPluginAsync = async (fastify, opt) => {

  fastify.post<{ Body: CreateAccountDto }>("/", { preHandler: [isAuthenticated] }, async (request, reply) => {
    try {
      if (!request.user) return sendError(reply, { code: 401, message: "Unauthenticated" });

      const createAccountSchema = z.object({
        name: z.string().min(1).max(100),
        type: z.enum([AccountType.CREDIT, AccountType.DEBIT, AccountType.LOAN]),
      }, { message: "Please fill the required fields" });

      const { data, error } = createAccountSchema.safeParse(request.body);
      if (error) return sendErrorZodValidationReply(reply, error);

      const newAccount = await fastify.prisma.account.create({
        data: {
          ...data,
          userId: request.user?.id,
        },
      });
      if(!newAccount) return sendError(reply, { code: 500, message: "Some thing went wrong. Failed create new account" });
      
      return sendReply(reply, { data: newAccount, message: "Success create new account" });
    } catch (error) {
      console.log("[ERR_ACCOUNT_POST]:", error);
      return sendError(reply);
    }
  });

}

export default accountRoutes;