export type UserRole = "admin" | "user"

export interface User {
  _id: string
  name: string
  email: string
  role: UserRole
  createdAt: string
  updatedAt: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AuthResponse extends AuthTokens {
  user: Omit<User, "passwordHash">
}

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "dropdown"
  | "checkbox"
  | "radio"
  | "rating"
  | "email"

export interface FormField {
  fieldId: string
  type: FieldType
  label: string
  placeholder: string
  required: boolean
  order: number
  options?: string[]
}

export interface Form {
  _id: string
  title: string
  description: string
  createdBy: string
  status: "draft" | "published"
  assignedTo: string[]
  allowResubmission: boolean
  deadline: string | null
  fields: FormField[]
  createdAt: string
  updatedAt: string
}

export interface FormSummary {
  _id: string
  title: string
  description: string
  status: "draft" | "published"
  assignedTo: string[]
  createdAt: string
}

export interface Answer {
  fieldId: string
  label: string
  value: string | number | string[]
}

export interface Response {
  _id: string
  formId: string
  userId: string
  submittedAt: string
  completionTimeSeconds: number
  answers: Answer[]
}

export interface FieldAggregation {
  fieldId: string
  label: string
  type: FieldType
  aggregation: Record<string, number>
}

export interface AnalyticsData {
  formId: string
  totalResponses: number
  completionRate: number
  avgCompletionTime: number
  fields: FieldAggregation[]
}

export interface FilterState {
  fieldId: string
  value: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}