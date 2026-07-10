import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Stack,
  Typography,
  Chip,
  Alert,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  IconButton,
  Tooltip,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { DataTable, type Column } from '../../../shared/components/DataTable'
import { SearchBar } from '../../../shared/components/SearchBar'
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog'
import {
  useListChecklistTemplatesQuery,
  useDeleteChecklistTemplateMutation,
} from '../checklistsApi'
import type { ChecklistTemplate, ListTemplatesParams } from '../types'

type ActiveFilter = 'all' | 'active' | 'inactive'

const columns: Column<ChecklistTemplate>[] = [
  {
    id: 'name',
    label: 'Name',
    render: (row) => row.name,
  },
  {
    id: 'description',
    label: 'Description',
    render: (row) => row.description ?? '—',
  },
  {
    id: 'isActive',
    label: 'Status',
    render: (row) => (
      <Chip
        label={row.isActive ? 'Active' : 'Inactive'}
        color={row.isActive ? 'success' : 'default'}
        size="small"
      />
    ),
  },
  {
    id: 'sections',
    label: 'Sections',
    render: (row) => `${row.sections.length} sections`,
  },
]

export default function TemplateListPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all')
  const [deleteTarget, setDeleteTarget] = useState<ChecklistTemplate | null>(null)

  const params: ListTemplatesParams = {
    page: page + 1,
    limit: rowsPerPage,
  }
  if (search) params.search = search
  if (activeFilter === 'active') params.isActive = true
  if (activeFilter === 'inactive') params.isActive = false

  const { data, isLoading, isError, error } =
    useListChecklistTemplatesQuery(params)
  const [deleteTemplate] =
    useDeleteChecklistTemplateMutation()

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage)
  }, [])

  const handleRowsPerPageChange = useCallback((newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage)
    setPage(0)
  }, [])

  const handleSearch = useCallback((value: string) => {
    setSearch(value)
    setPage(0)
  }, [])

  const handleFilterChange = useCallback(
    (_event: React.MouseEvent<HTMLElement>, newFilter: ActiveFilter | null) => {
      if (newFilter !== null) {
        setActiveFilter(newFilter)
        setPage(0)
      }
    },
    [],
  )

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return
    try {
      await deleteTemplate(deleteTarget.id).unwrap()
    } catch {
      // Error handling is done by RTK Query's cache invalidation
    } finally {
      setDeleteTarget(null)
    }
  }, [deleteTarget, deleteTemplate])

  const renderActions = useCallback(
    (row: ChecklistTemplate) => (
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
        <Tooltip title="Edit">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/checklist-templates/${row.id}/edit`)
            }}
            aria-label="Edit"
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton
            size="small"
            color="error"
            onClick={(e) => {
              e.stopPropagation()
              setDeleteTarget(row)
            }}
            aria-label="Delete"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    ),
    [navigate],
  )

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Checklist Templates</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/checklist-templates/new')}
        >
          Create Template
        </Button>
      </Box>

      <Stack direction="row" spacing={2} mb={2} alignItems="center">
        <SearchBar
          value={search}
          onSearch={handleSearch}
          placeholder="Search templates..."
        />
        <ToggleButtonGroup
          value={activeFilter}
          exclusive
          onChange={handleFilterChange}
          size="small"
        >
          <ToggleButton value="all">All</ToggleButton>
          <ToggleButton value="active">Active</ToggleButton>
          <ToggleButton value="inactive">Inactive</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load templates.{' '}
          {(error as { data?: { message?: string } })?.data?.message ??
            'Please try again.'}
        </Alert>
      )}

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        totalCount={data?.meta?.total ?? 0}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        isLoading={isLoading}
        emptyMessage="No checklist templates yet"
        getRowId={(row) => row.id}
        renderActions={renderActions}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete Template"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        confirmLabel="Delete"
        confirmColor="error"
      />
    </Box>
  )
}
