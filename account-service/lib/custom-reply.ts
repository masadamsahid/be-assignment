import { FastifyReply } from "fastify";
import { ZodError } from "zod";

type SendReplyOptions = {
  code?: number;
  message?: string;
  data?: any;
  json?: boolean;
}

export const sendReply = (reply: FastifyReply, { data, code = 200, message = "Success", json = true }: SendReplyOptions) => {
  if(json) reply.header("Content-Type", "application/json; charset=utf-8");
  
  return reply.code(code).send({ message, ...data });
}


type SendInternalErrorOptions = {
  code?: number;
  message?: string;
  data?: any;
}

export const sendError = (reply: FastifyReply, options?: SendInternalErrorOptions) => {
  const { data, message = "Internal error", code = 500 } = options || {};
  
  return sendReply(reply, {
    code,
    message,
    data,
  });
}

export const sendErrorZodValidationReply = (reply: FastifyReply, error: ZodError<any>) => {
  const errors = error.errors.map(e => `Invalid '${e.path}': ${e.message}`);
  
  return sendError(reply, {
    code: 400,
    message: "Invalid user input",
    data: { errors },
  });
}