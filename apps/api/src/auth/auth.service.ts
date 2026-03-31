import { randomUUID } from "node:crypto";

import { ConflictException, Injectable, OnModuleInit, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcryptjs";
import { Repository } from "typeorm";

import { RefreshTokenEntity } from "../database/entities/refresh-token.entity";
import { UserEntity, UserRole } from "../database/entities/user.entity";
import { JwtPayload } from "./interfaces/jwt-payload.interface";

export interface AuthUserResponse {
  id: string;
  email: string;
  role: UserRole;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  refreshExpiresIn: number;
  user: AuthUserResponse;
}

export interface RefreshResponse {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
}

type JwtExpiresIn = string | number;

const DEFAULT_ACCESS_EXPIRES_IN = "15m";
const DEFAULT_REFRESH_EXPIRES_IN = "7d";
const DEFAULT_SEED_EMAIL = "admin@hyperz.local";
const DEFAULT_SEED_PASSWORD = "admin123";

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokensRepository: Repository<RefreshTokenEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureLocalSeedUser();
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const user = await this.validateCredentials(email, password);
    user.lastLoginAt = new Date();
    await this.usersRepository.save(user);
    return this.issueTokenPair(user);
  }

  async register(email: string, password: string): Promise<LoginResponse> {
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await this.usersRepository.findOne({ where: { email: normalizedEmail } });
    if (existingUser) {
      throw new ConflictException("Email is already registered");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.usersRepository.save(
      this.usersRepository.create({
        email: normalizedEmail,
        passwordHash,
        role: UserRole.USER,
        isActive: true
      })
    );

    return this.issueTokenPair(user);
  }

  async refresh(refreshToken: string): Promise<RefreshResponse> {
    const payload = await this.verifyRefreshToken(refreshToken);
    const storedToken = await this.refreshTokensRepository.findOne({
      where: { tokenId: payload.jti, user: { id: payload.sub } },
      relations: { user: true }
    });
    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    if (!storedToken.user.isActive || storedToken.user.deletedAt) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const expiresIn = this.getAccessTokenExpiresIn();
    const accessPayload: JwtPayload = {
      sub: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role,
      tokenType: "access"
    };

    const accessToken = await this.jwtService.signAsync(accessPayload, { expiresIn });

    return {
      accessToken,
      tokenType: "Bearer",
      expiresIn: this.toSeconds(expiresIn)
    };
  }

  async logout(refreshToken: string): Promise<{ success: true }> {
    const payload = await this.verifyRefreshToken(refreshToken);
    const storedToken = await this.refreshTokensRepository.findOne({
      where: { tokenId: payload.jti, user: { id: payload.sub } },
      relations: { user: true }
    });
    if (!storedToken) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    if (!storedToken.revokedAt) {
      storedToken.revokedAt = new Date();
      await this.refreshTokensRepository.save(storedToken);
    }

    return { success: true };
  }

  async getProfile(userId: string): Promise<{ user: AuthUserResponse }> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user || !user.isActive || user.deletedAt) {
      throw new UnauthorizedException("User not found");
    }

    return {
      user: this.toAuthUser(user)
    };
  }

  private async issueTokenPair(user: UserEntity): Promise<LoginResponse> {
    const accessPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tokenType: "access"
    };

    const refreshTokenId = randomUUID();
    const refreshPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tokenType: "refresh",
      jti: refreshTokenId
    };

    const accessExpiresIn = this.getAccessTokenExpiresIn();
    const refreshExpiresIn = this.getRefreshTokenExpiresIn();
    const accessToken = await this.jwtService.signAsync(accessPayload, { expiresIn: accessExpiresIn });
    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      expiresIn: refreshExpiresIn,
      secret: this.getRefreshTokenSecret()
    });

    await this.refreshTokensRepository.save(
      this.refreshTokensRepository.create({
        tokenId: refreshTokenId,
        expiresAt: new Date(Date.now() + this.toMilliseconds(refreshExpiresIn)),
        revokedAt: null,
        user
      })
    );

    return {
      accessToken,
      refreshToken,
      tokenType: "Bearer",
      expiresIn: this.toSeconds(accessExpiresIn),
      refreshExpiresIn: this.toSeconds(refreshExpiresIn),
      user: this.toAuthUser(user)
    };
  }

  private async validateCredentials(email: string, password: string): Promise<UserEntity> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.usersRepository.findOne({ where: { email: normalizedEmail } });
    if (!user || !user.isActive || user.deletedAt) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid email or password");
    }

    return user;
  }

  private async verifyRefreshToken(token: string): Promise<Required<Pick<JwtPayload, "sub" | "jti">> & JwtPayload> {
    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.getRefreshTokenSecret()
      });
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }

    if (payload.tokenType !== "refresh" || !payload.jti || !payload.sub) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    return payload as Required<Pick<JwtPayload, "sub" | "jti">> & JwtPayload;
  }

  private toAuthUser(user: UserEntity): AuthUserResponse {
    return {
      id: user.id,
      email: user.email,
      role: user.role
    };
  }

  private getAccessTokenExpiresIn(): JwtExpiresIn {
    const configured = this.configService.get<string>("JWT_ACCESS_EXPIRES_IN");
    if (!configured || configured.trim().length === 0) {
      return DEFAULT_ACCESS_EXPIRES_IN;
    }

    const numeric = Number(configured);
    return Number.isFinite(numeric) && numeric > 0 ? numeric : configured;
  }

  private getRefreshTokenExpiresIn(): JwtExpiresIn {
    const configured = this.configService.get<string>("JWT_REFRESH_EXPIRES_IN");
    if (!configured || configured.trim().length === 0) {
      return DEFAULT_REFRESH_EXPIRES_IN;
    }

    const numeric = Number(configured);
    return Number.isFinite(numeric) && numeric > 0 ? numeric : configured;
  }

  private getRefreshTokenSecret(): string {
    return this.configService.get<string>("JWT_REFRESH_SECRET") ?? this.configService.get<string>("JWT_SECRET", "hyperz-dev-jwt-secret");
  }

  private toSeconds(expiresIn: JwtExpiresIn): number {
    if (typeof expiresIn === "number") {
      return expiresIn;
    }

    if (/^\d+$/.test(expiresIn)) {
      return Number(expiresIn);
    }

    const matches = /^(\d+)([smhd])$/i.exec(expiresIn.trim());
    if (!matches) {
      return 3600;
    }

    const value = Number(matches[1]);
    const unit = matches[2].toLowerCase();

    if (unit === "s") {
      return value;
    }

    if (unit === "m") {
      return value * 60;
    }

    if (unit === "h") {
      return value * 60 * 60;
    }

    return value * 60 * 60 * 24;
  }

  private toMilliseconds(expiresIn: JwtExpiresIn): number {
    return this.toSeconds(expiresIn) * 1000;
  }

  private shouldSeedUser(): boolean {
    if (process.env.AUTH_SEED_ENABLED) {
      return process.env.AUTH_SEED_ENABLED.toLowerCase() === "true";
    }

    const appEnv = process.env.APP_ENV ?? "local";
    return appEnv === "local" || appEnv === "development" || appEnv === "test";
  }

  private async ensureLocalSeedUser(): Promise<void> {
    if (!this.shouldSeedUser()) {
      return;
    }

    const email = (process.env.AUTH_SEED_EMAIL ?? DEFAULT_SEED_EMAIL).trim().toLowerCase();
    const password = process.env.AUTH_SEED_PASSWORD ?? DEFAULT_SEED_PASSWORD;
    const role = process.env.AUTH_SEED_ROLE === UserRole.USER ? UserRole.USER : UserRole.ADMIN;

    const existingUser = await this.usersRepository.findOne({ where: { email } });
    if (existingUser) {
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await this.usersRepository.save(
      this.usersRepository.create({
        email,
        passwordHash,
        role,
        isActive: true
      })
    );
  }
}
