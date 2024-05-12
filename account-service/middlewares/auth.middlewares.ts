import { preHandlerHookHandler } from "fastify";
import { sendError } from "../lib/custom-reply";
import { verifyAuthToken } from "../lib/jwt";
import { TokenExpiredError } from "jsonwebtoken";

export const isAuthenticated: preHandlerHookHandler = async (request, reply) => {
  const authHeader = request.headers.authorization as string;
  if (!authHeader) return sendError(reply, { code: 401, message: "Authorization header must be provided" });

  const token = authHeader.split(" ")[1];
  if (!token) return sendError(reply, { code: 401, message: "Format must be 'Bearer [token]'" });

  let user;
  try {
    user = verifyAuthToken(token);
  } catch (error) {
    if (error instanceof TokenExpiredError) return sendError(reply, { code: 401, message: "Auth token expired" });
    else {
      console.log("[ERR_VERIFY_AUTH_TOKEN]", error);
      return sendError(reply, { code: 401, message: "Error verifiying auth token" });
    }
  }
  request.user = user;
}