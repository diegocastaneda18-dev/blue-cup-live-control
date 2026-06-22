import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, MinLength } from "class-validator";

const ASSIGNABLE_ROLES = ["admin", "committee", "captain", "team_member"] as const;

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(2)
  displayName!: string;

  @IsIn(ASSIGNABLE_ROLES)
  role!: (typeof ASSIGNABLE_ROLES)[number];

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  teamId?: string;
}
