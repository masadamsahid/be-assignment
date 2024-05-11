import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const SALT = Number(process.env.HASH_SALT);

export const hashPwd = async (strPassword: string) => {
  try {
    return await bcrypt.hash(strPassword, SALT);
  } catch (error: any) {
    error.message = `[ERR_HASH_PWD] ${error.message}`;
    throw error;
  }
}

export const compareHashPwd = async (strPassword: string, hashedPassword: string) => {
  try {
    return await bcrypt.compare(strPassword, hashedPassword);
  } catch (error: any) {
    error.message = `[ERR_COMPARE_HASH_PWD] ${error.message}`;
    throw error;
  }
}
