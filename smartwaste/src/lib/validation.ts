import { z } from "zod";
const email = z.string().trim().min(1, "Enter your email address").email("Enter a valid email address");
export const loginSchema = z.object({ email, password: z.string().min(1, "Enter your password") });
export const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(80, "Name is too long"),
  email,
  password: z.string().min(8, "Use at least 8 characters").regex(/[A-Za-z]/, "Include at least one letter").regex(/\d/, "Include at least one number"),
  confirmPassword: z.string().min(1, "Re-enter your password"),
}).refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords don’t match" });
export const forgotSchema = z.object({ email });
export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type ForgotValues = z.infer<typeof forgotSchema>;
