import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  Matches,
} from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: '유효한 이메일 주소를 입력해주세요.' })
  email: string;

  @IsString()
  @MinLength(4, { message: '아이디는 4자 이상이어야 합니다.' })
  @MaxLength(30, { message: '아이디는 30자 이하이어야 합니다.' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: '아이디는 영문자, 숫자, 밑줄(_)만 사용할 수 있습니다.',
  })
  username: string;

  @IsString()
  @MinLength(10, { message: '비밀번호는 10자 이상이어야 합니다.' })
  @MaxLength(100)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]+$/, {
    message: '비밀번호는 영문자, 숫자, 특수문자를 각각 1자 이상 포함해야 합니다.',
  })
  password: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  nickname?: string;

  @IsString({ message: '성명을 입력해주세요.' })
  @MinLength(2, { message: '성명은 2자 이상이어야 합니다.' })
  @MaxLength(50)
  name: string;

  @IsString({ message: '연락처를 입력해주세요.' })
  @Matches(/^[0-9-]+$/, { message: '연락처는 숫자와 하이픈(-)만 입력 가능합니다.' })
  phone: string;

  @IsString({ message: '주소를 입력해주세요.' })
  @MinLength(5, { message: '주소를 정확히 입력해주세요.' })
  @MaxLength(200)
  address: string;
}
