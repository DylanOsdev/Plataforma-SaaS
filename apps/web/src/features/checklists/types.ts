export type QuestionType = 'text' | 'number' | 'boolean' | 'selection'

export interface ChecklistQuestion {
  id?: string
  text: string
  type: QuestionType
  weight: number
  required: boolean
  order: number
  options?: string[] // only for 'selection' type
}

export interface ChecklistSection {
  id?: string
  name: string
  order: number
  isRequired: boolean
  questions: ChecklistQuestion[]
}

export interface ChecklistTemplate {
  id: string
  name: string
  description?: string
  isActive: boolean
  sections: ChecklistSection[]
  createdAt: string
  updatedAt: string
}

export interface ListTemplatesParams {
  search?: string
  isActive?: boolean
  page?: number
  limit?: number
}

export interface ChecklistExecution {
  id: string
  workOrderId: string
  templateId: string
  templateName: string
  mechanicId: string
  mechanicName: string
  status: 'pending' | 'in_progress' | 'completed'
  sections: ChecklistSection[]
  answers: Record<string, string | number | boolean>
  score?: number
  passed?: boolean
  createdAt: string
  completedAt?: string
}
