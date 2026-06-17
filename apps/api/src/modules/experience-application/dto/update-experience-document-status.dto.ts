import { IsIn, IsOptional, IsString } from "class-validator";

export class UpdateExperienceDocumentStatusDto {
  @IsIn(["pendiente", "aprobado", "rechazado", "incompleto"])
  status!: "pendiente" | "aprobado" | "rechazado" | "incompleto";

  @IsOptional()
  @IsString()
  adminNote?: string;
}
