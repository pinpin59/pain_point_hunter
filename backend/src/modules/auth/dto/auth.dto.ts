import { createZodDto } from 'nestjs-zod';
import { RegisterSchema, LoginSchema } from '@pain-point-hunter/shared';

export class RegisterDto extends createZodDto(RegisterSchema) {}
export class LoginDto extends createZodDto(LoginSchema) {}
