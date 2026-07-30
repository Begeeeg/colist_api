import { z } from "zod";

export const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8, "Password is incorrect"),
});

export type LoginInput = z.infer<typeof LoginSchema>;
