import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";

import { AdminAuditLogEntity } from "../database/entities/admin-audit-log.entity";
import { ExecutionHistoryEntity } from "../database/entities/execution-history.entity";
import { UserEntity } from "../database/entities/user.entity";
import { UpdateAdminUserDto } from "./dto/update-admin-user.dto";

export interface AdminUserListItem {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: Date;
  lastLoginAt: Date | null;
}

export interface AdminUserMutationResponse {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
  deletedAt: Date | null;
}

export interface ToolUsageItem {
  slug: string;
  count: number;
}

export interface AdminUsersPageResponse {
  data: AdminUserListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminStatsResponse {
  totalUsers: number;
  totalExecutions: number;
  toolUsage: ToolUsageItem[];
}

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(ExecutionHistoryEntity)
    private readonly executionHistoryRepository: Repository<ExecutionHistoryEntity>,
    @InjectRepository(AdminAuditLogEntity)
    private readonly adminAuditLogsRepository: Repository<AdminAuditLogEntity>
  ) {}

  async listUsers(adminId: string, page: number, limit: number): Promise<AdminUsersPageResponse> {
    const [users, total] = await this.usersRepository.findAndCount({
      where: { deletedAt: IsNull() },
      order: { createdAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit
    });

    await this.logAdminAction(adminId, "admin.users.list");

    return {
      data: users.map((user) => this.toUserListItem(user)),
      total,
      page,
      limit
    };
  }

  async updateUser(adminId: string, userId: string, dto: UpdateAdminUserDto): Promise<AdminUserMutationResponse> {
    if (dto.role === undefined && dto.isActive === undefined) {
      throw new BadRequestException("At least one field must be provided");
    }

    if (adminId === userId && dto.isActive === false) {
      throw new BadRequestException("Admins cannot deactivate themselves");
    }

    const user = await this.usersRepository.findOne({
      where: { id: userId, deletedAt: IsNull() }
    });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (dto.role !== undefined) {
      user.role = dto.role;
    }

    if (dto.isActive !== undefined) {
      user.isActive = dto.isActive;
    }

    const saved = await this.usersRepository.save(user);
    await this.logAdminAction(adminId, "admin.users.update", saved.id);

    return this.toMutationResponse(saved);
  }

  async softDeleteUser(adminId: string, userId: string): Promise<{ id: string; deletedAt: Date }> {
    if (adminId === userId) {
      throw new BadRequestException("Admins cannot delete themselves");
    }

    const user = await this.usersRepository.findOne({
      where: { id: userId, deletedAt: IsNull() }
    });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    const deletedAt = new Date();
    user.deletedAt = deletedAt;
    user.isActive = false;
    await this.usersRepository.save(user);

    await this.logAdminAction(adminId, "admin.users.delete", user.id);

    return {
      id: user.id,
      deletedAt
    };
  }

  async getStats(adminId: string): Promise<AdminStatsResponse> {
    const [totalUsers, totalExecutions, toolUsageRows] = await Promise.all([
      this.usersRepository.count({ where: { deletedAt: IsNull() } }),
      this.executionHistoryRepository.count(),
      this.executionHistoryRepository
        .createQueryBuilder("execution")
        .select("execution.toolSlug", "slug")
        .addSelect("COUNT(*)", "count")
        .groupBy("execution.toolSlug")
        .orderBy("COUNT(*)", "DESC")
        .getRawMany<{ slug: string; count: string }>()
    ]);

    await this.logAdminAction(adminId, "admin.stats.get");

    return {
      totalUsers,
      totalExecutions,
      toolUsage: toolUsageRows.map((row) => ({
        slug: row.slug,
        count: Number(row.count)
      }))
    };
  }

  private async logAdminAction(adminId: string, action: string, targetId?: string): Promise<void> {
    await this.adminAuditLogsRepository.save(
      this.adminAuditLogsRepository.create({
        adminId,
        action,
        targetId: targetId ?? null
      })
    );
  }

  private toUserListItem(user: UserEntity): AdminUserListItem {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt
    };
  }

  private toMutationResponse(user: UserEntity): AdminUserMutationResponse {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      deletedAt: user.deletedAt
    };
  }
}
