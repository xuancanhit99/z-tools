import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

import { UserRole } from "../../database/entities/user.entity";
import { AuthenticatedUser } from "../interfaces/authenticated-request.interface";
import { JwtPayload } from "../interfaces/jwt-payload.interface";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("JWT_SECRET", "hyperz-dev-jwt-secret")
    });
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    if (payload.tokenType !== "access") {
      throw new UnauthorizedException("Invalid access token");
    }

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role ?? UserRole.USER
    };
  }
}
