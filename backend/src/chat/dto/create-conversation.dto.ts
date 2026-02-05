import { IsArray, IsNotEmpty, IsOptional, IsString, ArrayMinSize } from 'class-validator';

export class CreateConversationDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  participantIds: string[];

  @IsOptional()
  @IsString()
  name?: string;
}

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  content: string;
}

export class AddParticipantsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  participantIds: string[];
}
