import { z } from "zod";

export const UpdateUsernameSchema = z.object({
    username: z
        .string()
        .min(3, "Username must be at least 3 characters")
        .max(10, "Username must be at most 10 characters"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

export type UpdateUsernameInput = z.infer<typeof UpdateUsernameSchema>;
