import { z } from "zod"

const fieldSchema = z.object({
  fieldId: z.string(),
  type: z.enum(["text", "textarea", "number", "date", "dropdown", "checkbox", "radio", "rating", "email"]),
  label: z.string().min(1, "Label is required"),
  placeholder: z.string().default(""),
  required: z.boolean().default(false),
  order: z.number(),
  options: z.array(z.string()).optional(),
})

export const createFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().default(""),
  status: z.enum(["draft", "published"]).optional(),
  allowResubmission: z.boolean().optional(),
  deadline: z.string().optional().nullable(),
  fields: z.array(fieldSchema).default([]),
})

export const updateFormSchema = createFormSchema.partial()

export const assignFormSchema = z.object({
  userIds: z.array(z.string()).min(1, "At least one user must be selected"),
})

export type CreateFormInput = z.infer<typeof createFormSchema>
export type UpdateFormInput = z.infer<typeof updateFormSchema>
export type AssignFormInput = z.infer<typeof assignFormSchema>