import { UserRole } from "../../database/entities/user.entity";

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  tokenType: "access" | "refresh";
  jti?: string;
}
