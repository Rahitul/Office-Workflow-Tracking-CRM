import { z } from "zod"

export const submitResponseSchema = z.object({
  formId: z.string(),
  startTime: z.number().optional(),
  answers: z.array(
    z.object({
      fieldId: z.string(),
      label: z.string(),
      value: z.union([z.string(), z.number(), z.array(z.string())]),
    })
  ),
})

export type SubmitResponseInput = z.infer<typeof submitResponseSchema>