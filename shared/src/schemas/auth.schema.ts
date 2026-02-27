import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  username: z.string().min(2).max(30),
});

export const LoginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export const AuthResponseSchema = z.object({
  accessToken: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string(),
    username: z.string(),
    createdAt: z.string(),
  }),
});

export type RegisterDto = z.infer<typeof RegisterSchema>;
export type LoginDto = z.infer<typeof LoginSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type User = AuthResponse['user'];
