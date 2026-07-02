// evaluation/dto/create-phase.dto.ts
import { IsString, IsNotEmpty, IsNumber, IsDateString } from 'class-validator';

export class CreatePhaseDto {
  @IsString()
  @IsNotEmpty()
  name: string; // e.g., "Phase 1: Proposal"

  @IsNumber()
  @IsNotEmpty()
  weight: number; // e.g., 10, 30, 60, 100

  @IsDateString()
  @IsNotEmpty()
  deadline: Date;
}