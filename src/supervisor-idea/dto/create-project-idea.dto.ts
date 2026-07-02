import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateProjectIdeaDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;
}