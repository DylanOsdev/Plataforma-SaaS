import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import type React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Paper,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import {
  useGetChecklistExecutionQuery,
  useSubmitAnswerMutation,
  useCompleteExecutionMutation,
} from '../checklistsApi'
import QuestionInput from '../components/QuestionInput'
import ExecutionSummary from '../components/ExecutionSummary'

type AnswerMap = Record<string, string | number | boolean>

export default function ExecutionPage(): React.JSX.Element {
  const { id: workOrderId, executionId } = useParams<
    { id: string; executionId: string }
  >()
  const navigate = useNavigate()

  const {
    data: execution,
    isLoading,
    isError,
    error,
  } = useGetChecklistExecutionQuery(executionId!)

  const [submitAnswer] = useSubmitAnswerMutation()
  const [completeExecution, { isLoading: isCompleting }] =
    useCompleteExecutionMutation()

  // Local answer overrides — when null, falls back to execution.answers
  const [localAnswers, setLocalAnswers] = useState<AnswerMap | null>(null)
  const [showSummary, setShowSummary] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [completedResult, setCompletedResult] = useState<{
    score: number
    passed: boolean
    completedAt: string
  } | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const answers = useMemo(
    () => localAnswers ?? (execution?.answers as AnswerMap | undefined) ?? {},
    [localAnswers, execution?.answers],
  )

  const isCompleted = execution?.status === 'completed'

  const handleAnswerChange = useCallback(
    (questionId: string, value: string | number | boolean) => {
      setLocalAnswers((prev) => ({ ...prev, [questionId]: value }))
      setValidationError(null)

      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
      debounceRef.current = setTimeout(() => {
        submitAnswer({
          executionId: executionId!,
          questionId,
          answer: value,
        })
      }, 1500)
    },
    [executionId, submitAnswer],
  )

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const handleComplete = useCallback(async () => {
    // Validate all required questions have answers
    const missingRequired: string[] = []
    execution?.sections.forEach((section) => {
      section.questions.forEach((q) => {
        if (
          q.required &&
          (answers[q.id!] === undefined || answers[q.id!] === '')
        ) {
          missingRequired.push(q.text)
        }
      })
    })

    if (missingRequired.length > 0) {
      setValidationError(
        `Please answer all required questions: ${missingRequired.join(', ')}`,
      )
      return
    }

    try {
      const result = await completeExecution(executionId!).unwrap()
      setCompletedResult({
        score: result.score ?? 0,
        passed: result.passed ?? false,
        completedAt: result.completedAt ?? new Date().toISOString(),
      })
      setShowSummary(true)
    } catch {
      setValidationError(
        'Failed to complete execution. Please try again.',
      )
    }
  }, [execution, answers, executionId, completeExecution])

  // ── Loading state ──
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    )
  }

  // ── Error state ──
  if (isError) {
    return (
      <Alert severity="error">
        Failed to load checklist execution.{' '}
        {(error as { data?: { message?: string } })?.data?.message ??
          'Please try again.'}
      </Alert>
    )
  }

  // ── Not found state ──
  if (!execution) {
    return (
      <Box>
        <Alert severity="warning">Execution not found.</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/work-orders/${workOrderId}`)}
          sx={{ mt: 2 }}
        >
          Back to Work Order
        </Button>
      </Box>
    )
  }

  // ── Summary overlay (after completion) ──
  if (showSummary || isCompleted) {
    const summary = completedResult ?? {
      score: execution.score ?? 0,
      passed: execution.passed ?? false,
      completedAt: execution.completedAt ?? new Date().toISOString(),
    }
    return (
      <Box>
        <Paper sx={{ p: 3 }}>
          <ExecutionSummary
            score={summary.score}
            passed={summary.passed}
            completedAt={summary.completedAt}
            onBackToWorkOrder={() =>
              navigate(`/work-orders/${workOrderId}`)
            }
          />
        </Paper>
      </Box>
    )
  }

  // ── Execution form ──
  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(`/work-orders/${workOrderId}`)}
        sx={{ mb: 2 }}
      >
        Back to Work Order
      </Button>

      <Typography variant="h4" gutterBottom>
        {execution.templateName}
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Work Order: {execution.workOrderId}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Mechanic: {execution.mechanicName}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Status: {execution.status}
        </Typography>
      </Paper>

      {validationError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {validationError}
        </Alert>
      )}

      {execution.sections.map((section) => (
        <Paper key={section.id} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {section.name}
            {section.isRequired && (
              <Typography component="span" color="error">
                {' '}
                *
              </Typography>
            )}
          </Typography>

          {section.questions.map((question) => (
            <QuestionInput
              key={question.id}
              question={question}
              value={answers[question.id!]}
              onChange={(value) =>
                handleAnswerChange(question.id!, value)
              }
              disabled={isCompleted}
            />
          ))}
        </Paper>
      ))}

      {!isCompleted && (
        <Box display="flex" justifyContent="flex-end">
          <Button
            variant="contained"
            color="primary"
            onClick={handleComplete}
            disabled={isCompleting}
          >
            {isCompleting ? 'Completing...' : 'Complete'}
          </Button>
        </Box>
      )}
    </Box>
  )
}
