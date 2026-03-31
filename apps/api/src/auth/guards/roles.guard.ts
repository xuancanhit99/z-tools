import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { UserRole } from "../../database/entities/user.entity";
import { ROLES_KEY } from "../decorators/roles.decorator";
import { AuthenticatedRequest } from "../interfaces/authenticated-request.interface";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles =
      this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [context.getHandler(), context.getClass()]) ?? [];

    if (requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.user) {
      throw new UnauthorizedException("Authentication required");
    }

    if (!requiredRoles.includes(request.user.role)) {
      throw new ForbiddenException("Insufficient permissions");
    }

    return true;
  }
}
