import { IsBoolean, IsEnum, IsOptional, IsString } from "class-validator";
import { ExperienceApplicationStatusDto } from "./experience-application-status.enum";

export class UpdateExperienceApplicationStatusDto {
  @IsEnum(ExperienceApplicationStatusDto)
  status!: ExperienceApplicationStatusDto;

  @IsOptional()
  @IsString()
  internalNote?: string;

  @IsOptional()
  @IsBoolean()
  adminOverride?: boolean;
}
