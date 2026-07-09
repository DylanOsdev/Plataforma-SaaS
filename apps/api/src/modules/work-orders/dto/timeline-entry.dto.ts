import { ApiProperty } from '@nestjs/swagger';

export class TimelineEntryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fromStatus: string | null;

  @ApiProperty()
  toStatus: string;

  @ApiProperty()
  actorName: string;

  @ApiProperty()
  timestamp: Date;

  @ApiProperty()
  action: string;
}
