import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, MinLength } from "class-validator";

const ASSIGNABLE_ROLES = ["admin", "committee", "captain", "team_member"] as const;

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  displayName?: string;

  @IsOptional()
  @IsIn(ASSIGNABLE_ROLES)
  role?: (typeof ASSIGNABLE_ROLES)[number];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  teamId?: string | null;
}
