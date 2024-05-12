import { AccountType } from "@prisma/client";
import { FastifyPluginAsync } from "fastify";
import { sendError, sendErrorZodValidationReply, sendReply } from "../lib/custom-reply";
import { z } from "zod";
import { isAuthenticated } from "../middlewares/auth.middlewares";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

type CreateAccountDto = {
  name: string;
  type: AccountType;
}

type ReadAccountDto = {
  type?: AccountType;
}

type UpdateAccountDto = {
  name?: string;
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
      if (!newAccount) return sendError(reply, { code: 500, message: "Some thing went wrong. Failed create new account" });

      return sendReply(reply, { data: newAccount, message: "Success create new account" });
    } catch (error) {
      console.log("[ERR_ACCOUNT_POST]:", error);
      return sendError(reply);
    }
  });

  fastify.get<{ Body: ReadAccountDto, Querystring: { [key: string]: string | undefined } }>("/", { preHandler: [isAuthenticated] }, async (request, reply) => {
    try {
      if (!request.user) return sendError(reply, { code: 401, message: "Unauthenticated" });


      const getAccountsSchema = z.object({
        type: z.enum([AccountType.CREDIT, AccountType.DEBIT, AccountType.LOAN]).optional(),
      }).optional();

      const { data, error } = getAccountsSchema.safeParse({
        type: request.query.type
      });
      if (error) return sendErrorZodValidationReply(reply, error);

      const accounts = await fastify.prisma.account.findMany({
        where: { type: data?.type, userId: request.user.id },
      });
      if (accounts.length <= 0) return sendError(reply, { code: 404, message: "No account found" });

      return sendReply(reply, { data: accounts, message: "Success retrieve account(s)" });
    } catch (error) {
      console.log("[ERR_ACCOUNT_GET]:", error);
      return sendError(reply);
    }
  });

  fastify.patch<{ Body: UpdateAccountDto, Params: { id: string } }>("/:id", { preHandler: [isAuthenticated] }, async (request, reply) => {
    try {
      if (!request.user) return sendError(reply, { code: 401, message: "Unauthenticated" });
      const id = Number(request.params.id);
      if (isNaN(id)) return sendError(reply, { code: 400, message: "Invalid account id" });

      const updateAccountsSchema = z.object({
        name: z.string().min(1).max(100).optional(),
      }).optional();

      const { data, error } = updateAccountsSchema.safeParse(request.body);
      if (error) return sendErrorZodValidationReply(reply, error);

      const updatedAccount = await fastify.prisma.account.update({
        where: { id, userId: request.user.id },
        data: { ...data },
      }).catch(error => {
        if (error instanceof PrismaClientKnownRequestError && error.code === "P2025") return null;
        throw error;
      });
      if (!updatedAccount) return sendError(reply, { code: 404, message: "No account found" });

      return sendReply(reply, { data: updatedAccount, message: "Success update account" });
    } catch (error) {
      console.log("[ERR_ACCOUNT_ID_PATCH]:", error);
      return sendError(reply);
    }
  });

  fastify.delete<{ Params: { id: string } }>("/:id", { preHandler: [isAuthenticated] }, async (request, reply) => {
    try {
      if (!request.user) return sendError(reply, { code: 401, message: "Unauthenticated" });
      const id = Number(request.params.id);
      if (isNaN(id)) return sendError(reply, { code: 400, message: "Invalid account id" });

      const deletedAccount = await fastify.prisma.account.delete({
        where: { id, userId: request.user.id },
      }).catch(error => {
        if (error instanceof PrismaClientKnownRequestError && error.code === "P2025") return null;
        throw error;
      });;
      if (!deletedAccount) return sendError(reply, { code: 404, message: "Failed deleting account" });

      return sendReply(reply, { data: deletedAccount, message: "Success deleting account" });
    } catch (error) {
      console.log("[ERR_ACCOUNT_ID_DELETE]:", error);
      return sendError(reply);
    }
  });

}

export default accountRoutes;