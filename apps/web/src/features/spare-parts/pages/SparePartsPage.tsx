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
import { useListSparePartsQuery } from '../sparePartsApi'
import type { SparePart, ListSparePartsParams } from '../types'

const columns: Column<SparePart>[] = [
  {
    id: 'code',
    label: 'Code',
    render: (row) => row.code,
    sortable: true,
  },
  {
    id: 'name',
    label: 'Name',
    render: (row) => row.name,
    sortable: true,
  },
  {
    id: 'category',
    label: 'Category',
    render: (row) => row.category,
    sortable: true,
  },
  {
    id: 'currentStock',
    label: 'Current Stock',
    render: (row) => {
      const isLow = row.currentStock < row.minStock
      return (
        <Typography
          component="span"
          sx={{ color: isLow ? 'error.main' : 'text.primary', fontWeight: isLow ? 600 : 400 }}
        >
          {row.currentStock}
        </Typography>
      )
    },
    sortable: true,
  },
  {
    id: 'minStock',
    label: 'Min Stock',
    render: (row) => row.minStock,
  },
  {
    id: 'status',
    label: 'Status',
    render: (row) => <Chip label={row.status} color={row.status === 'active' ? 'success' : 'default'} size="small" />,
    sortable: true,
  },
]

export type SparePartsPageProps = {
  initialParams?: Partial<ListSparePartsParams>
}

export default function SparePartsPage({ initialParams }: SparePartsPageProps) {
  const navigate = useNavigate()
  const [page, setPage] = useState(initialParams?.page ?? 0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [search, setSearch] = useState('')

  const params: ListSparePartsParams = {
    page: page + 1,
    limit: rowsPerPage,
  }
  if (search) params.search = search

  const { data, isLoading, isError, error } = useListSparePartsQuery(params)

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
        <Typography variant="h4">Spare Parts</Typography>
      </Box>

      <Stack direction="row" spacing={2} mb={2}>
        <SearchBar
          value={search}
          onSearch={handleSearch}
          placeholder="Search spare parts..."
        />
      </Stack>

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load spare parts. {(error as { data?: { message?: string } })?.data?.message ?? 'Please try again.'}
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
        emptyMessage="No spare parts yet"
        getRowId={(row) => row.id}
        onRowClick={(row) => navigate(`/inventory/${row.id}`)}
      />
    </Box>
  )
}