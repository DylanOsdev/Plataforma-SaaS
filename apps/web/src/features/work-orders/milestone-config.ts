export const MILESTONE_LABELS: Record<string, string> = {
  created: 'Creada',
  assigned: 'Asignada',
  in_progress: 'En Progreso',
  in_review: 'En Revisión',
  completed: 'Completada',
  invoiced: 'Facturada',
  paid: 'Pagada',
  delivered: 'Entregada',
}

export const MILESTONE_COLORS: Record<string, 'default' | 'info' | 'primary' | 'warning' | 'success' | 'secondary' | 'error'> = {
  created: 'default',
  assigned: 'info',
  in_progress: 'primary',
  in_review: 'warning',
  completed: 'success',
  invoiced: 'secondary',
  paid: 'success',
  delivered: 'success',
}