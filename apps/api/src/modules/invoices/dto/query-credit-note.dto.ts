import { IsEnum, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { CreditNoteStatus, CreditNoteType } from '@prisma/client';

export class QueryCreditNoteDto {
  @IsOptional()
  @IsEnum(CreditNoteType)
  type?: CreditNoteType;

  @IsOptional()
  @IsEnum(CreditNoteStatus)
  status?: CreditNoteStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
