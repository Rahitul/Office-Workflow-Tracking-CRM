import { z } from "zod"

export const companySchema = z.object({
  name: z.string().min(1, "Company name is required").max(100, "Company name too long"),
})

export const productSchema = z.object({
  name: z.string().min(1, "Product name is required").max(100, "Product name too long"),
  companyId: z.string().min(1, "Company is required"),
})

export const trainingSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().max(1000, "Description too long").optional(),
  content: z.string().min(1, "Content is required"),
  companyId: z.string().min(1, "Company is required"),
  productId: z.string().min(1, "Product is required"),
})

export const trainingAssignmentSchema = z.object({
  trainingId: z.string().min(1, "Training is required"),
  assignedTo: z.array(z.string()).min(1, "At least one user must be selected"),
  priority: z.enum(["high", "medium", "low"]).optional(),
})

export type CompanyInput = z.infer<typeof companySchema>
export type ProductInput = z.infer<typeof productSchema>
export type TrainingInput = z.infer<typeof trainingSchema>
export type TrainingAssignmentInput = z.infer<typeof trainingAssignmentSchema>