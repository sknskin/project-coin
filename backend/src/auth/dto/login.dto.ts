import { IsString } from 'class-validator';

export class LoginDto {
  @IsString({ message: '이메일 또는 아이디를 입력해주세요.' })
  emailOrUsername: string;

  @IsString({ message: '비밀번호를 입력해주세요.' })
  password: string;
}
