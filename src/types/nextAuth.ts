import { JWT } from "next-auth/jwt";
import { Session, User } from "next-auth";

export interface Credentials {
  mobileNumber: string;
  password: string;
}

export interface JWTCallbackParams {
  token: JWT;
  user?: User;
}

export interface SessionCallbackParams {
  session: Session;
  token: JWT;
}
