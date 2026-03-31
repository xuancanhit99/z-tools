import { Request } from "express";

import { UserRole } from "../../database/entities/user.entity";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
