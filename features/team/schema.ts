import { z } from "zod";

/** Mirrors BE InviteReq (extra="forbid"): OWNER is never invitable. */
export const inviteSchema = z
  .object({
    email: z.string().email("Enter a valid email"),
    role: z.enum(["ADMIN", "MEMBER"], { message: "Role must be ADMIN or MEMBER" }),
  })
  .strict();

export type InviteInput = z.infer<typeof inviteSchema>;
