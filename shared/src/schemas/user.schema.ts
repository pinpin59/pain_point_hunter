// packages/shared/src/schemas/user.schema.ts
import { z } from "zod"

export const UserRoleSchema = z.enum(["admin", "user"])

export const UserResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: UserRoleSchema,
  createdAt: z.string(), // ISO string côté API
})

export type UserResponse = z.infer<typeof UserResponseSchema>
export type UserRole = z.infer<typeof UserRoleSchema>