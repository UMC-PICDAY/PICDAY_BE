import { z } from "zod";

export const createStudioSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  address: z.string().min(1),
});

export type CreateStudioDto = z.infer<typeof createStudioSchema>;
