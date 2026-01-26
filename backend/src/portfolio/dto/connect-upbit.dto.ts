import { IsString, MinLength } from 'class-validator';

export class ConnectUpbitDto {
  @IsString()
  @MinLength(1)
  accessKey: string;

  @IsString()
  @MinLength(1)
  secretKey: string;
}
