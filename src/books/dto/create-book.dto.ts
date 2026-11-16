import { Transform } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateBookDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  author?: string;

  @IsInt()
  @Min(1)
  pages?: number;

  @IsOptional() // si no llega, el libro empieza con 0 ejemplares
  @IsInt()
  @Min(0)
  stock?: number;
}
