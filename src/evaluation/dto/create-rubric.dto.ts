// evaluation/dto/create-rubric.dto.ts
import { IsString, IsNotEmpty, IsNumber, IsEnum } from 'class-validator';

export class CreateRubricDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsNumber()
  @IsNotEmpty()
  maxMarks: number;

  @IsEnum(['supervisor', 'committee'])
  @IsNotEmpty()
  evaluatorRole: 'supervisor' | 'committee';

  @IsNumber()
  @IsNotEmpty()
  phaseId: number;
}