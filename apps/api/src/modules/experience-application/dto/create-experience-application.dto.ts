import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested
} from "class-validator";

export enum TransportTypeDto {
  vessel = "vessel",
  aircraft = "aircraft",
  both = "both",
  none = "none"
}

export class ApplicantDto {
  @IsString()
  @MinLength(2)
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  phone!: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  nationality?: string;
}

export class TransportDto {
  @IsEnum(TransportTypeDto)
  type!: TransportTypeDto;

  @IsOptional()
  @IsString()
  vesselName?: string;

  @IsOptional()
  @IsString()
  vesselRegistration?: string;

  @IsOptional()
  @IsNumber()
  vesselLengthM?: number;

  @IsOptional()
  @IsString()
  aircraftType?: string;

  @IsOptional()
  @IsString()
  aircraftRegistration?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ItineraryDto {
  @IsISO8601({ strict: false })
  arrivalDate!: string;

  @IsOptional()
  @IsISO8601({ strict: false })
  departureDate?: string;

  @IsOptional()
  @IsString()
  entryPort?: string;

  @IsOptional()
  @IsString()
  exitPort?: string;

  @IsOptional()
  @IsString()
  summary?: string;
}

export class PeopleOnBoardDto {
  @IsInt()
  @Min(1)
  total!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  adults?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  children?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  crew?: number;

  @IsOptional()
  @IsString()
  guestNames?: string;
}

export class ActivityItemDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  place?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsISO8601({ strict: false })
  scheduledDate?: string;
}

export class ActivitiesDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  experienceTypes!: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActivityItemDto)
  items!: ActivityItemDto[];
}

export class LodgingDto {
  @IsOptional()
  @IsString()
  preference?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  nights?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  rooms?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class FoodDto {
  @IsOptional()
  @IsString()
  dietaryRestrictions?: string;

  @IsOptional()
  @IsString()
  preferences?: string;

  @IsOptional()
  @IsString()
  specialRequests?: string;
}

export class RoutePointDto {
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;
}

export class RequestedRouteDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoutePointDto)
  coordinates?: RoutePointDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}

export class AttachmentDto {
  @IsString()
  fileName!: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sizeBytes?: number;
}

export class CreateExperienceApplicationDto {
  @ValidateNested()
  @Type(() => ApplicantDto)
  applicant!: ApplicantDto;

  @ValidateNested()
  @Type(() => TransportDto)
  transport!: TransportDto;

  @ValidateNested()
  @Type(() => ItineraryDto)
  itinerary!: ItineraryDto;

  @ValidateNested()
  @Type(() => PeopleOnBoardDto)
  peopleOnBoard!: PeopleOnBoardDto;

  @ValidateNested()
  @Type(() => ActivitiesDto)
  activities!: ActivitiesDto;

  @ValidateNested()
  @Type(() => LodgingDto)
  lodging!: LodgingDto;

  @ValidateNested()
  @Type(() => FoodDto)
  food!: FoodDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RequestedRouteDto)
  requestedRoutes!: RequestedRouteDto[];

  @IsOptional()
  @IsString()
  observations?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];

  @IsBoolean()
  termsAccepted!: boolean;

  @IsString()
  @MinLength(2)
  responsibleSignature!: string;

  @IsOptional()
  @IsString()
  budgetRange?: string;
}
