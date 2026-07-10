import { IsNotEmpty, IsNumber, IsString, IsEnum, Min } from 'class-validator';
import { CreditNoteType } from '@prisma/client';

export class CreateCreditNoteDto {
  @IsNotEmpty()
  @IsEnum(CreditNoteType)
  type: CreditNoteType;

  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsNotEmpty()
  @IsString()
  reason: string;
}
