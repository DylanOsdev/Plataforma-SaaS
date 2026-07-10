import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Stack,
  Typography,
  Chip,
  Alert,
} from '@mui/material'
import { DataTable, type Column } from '../../../shared/components/DataTable'
import { SearchBar } from '../../../shared/components/SearchBar'
import { useListMechanicsQuery } from '../mechanicsApi'
import type { Mechanic, ListMechanicsParams } from '../types'

const columns: Column<Mechanic>[] = [
  {
    id: 'name',
    label: 'Name',
    render: (row) => row.name,
    sortable: true,
  },
  {
    id: 'email',
    label: 'Email',
    render: (row) => row.email,
    sortable: true,
  },
  {
    id: 'phone',
    label: 'Phone',
    render: (row) => row.phone,
  },
  {
    id: 'specializations',
    label: 'Specializations',
    render: (row) => row.specializations?.join(', ') || '—',
  },
  {
    id: 'status',
    label: 'Status',
    render: (row) => <Chip label={row.status} color={row.status === 'active' ? 'success' : 'default'} size="small" />,
    sortable: true,
  },
]

export type MechanicsPageProps = {
  initialParams?: Partial<ListMechanicsParams>
}

export default function MechanicsPage({ initialParams }: MechanicsPageProps) {
  const navigate = useNavigate()
  const [page, setPage] = useState(initialParams?.page ?? 0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [search, setSearch] = useState('')

  const params: ListMechanicsParams = {
    page: page + 1,
    limit: rowsPerPage,
  }
  if (search) params.search = search

  const { data, isLoading, isError, error } = useListMechanicsQuery(params)

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

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Mechanics</Typography>
      </Box>

      <Stack direction="row" spacing={2} mb={2}>
        <SearchBar
          value={search}
          onSearch={handleSearch}
          placeholder="Search mechanics..."
        />
      </Stack>

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load mechanics. {(error as { data?: { message?: string } })?.data?.message ?? 'Please try again.'}
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
        emptyMessage="No mechanics yet"
        getRowId={(row) => row.id}
        onRowClick={(row) => navigate(`/mechanics/${row.id}`)}
      />
    </Box>
  )
}