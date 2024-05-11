import bcrypt from "bcrypt";

const SALT = Number(process.env.HASH_SALT);

export const hashPwd = async (strPassword: string) => {
  try {
    return await bcrypt.hash(strPassword, SALT);
  } catch (error: any) {
    error.message = `[ERR_HASH_PWD] ${error.message}`;
    throw error;
  }
}


