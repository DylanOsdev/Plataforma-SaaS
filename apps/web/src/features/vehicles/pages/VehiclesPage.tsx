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
import { useListVehiclesQuery } from '../vehiclesApi'
import type { Vehicle, ListVehiclesParams } from '../types'

const columns: Column<Vehicle>[] = [
  {
    id: 'clientName',
    label: 'Client',
    render: (row) => row.client.name,
    sortable: true,
  },
  {
    id: 'make',
    label: 'Make',
    render: (row) => row.make,
    sortable: true,
  },
  {
    id: 'model',
    label: 'Model',
    render: (row) => row.model,
    sortable: true,
  },
  {
    id: 'plate',
    label: 'Plate',
    render: (row) => row.plate,
    sortable: true,
  },
  {
    id: 'year',
    label: 'Year',
    render: (row) => row.year,
    sortable: true,
  },
  {
    id: 'status',
    label: 'Status',
    render: (row) => <Chip label={row.status} color={row.status === 'active' ? 'success' : 'default'} size="small" />,
    sortable: true,
  },
]

export type VehiclesPageProps = {
  initialParams?: Partial<ListVehiclesParams>
}

export default function VehiclesPage({ initialParams }: VehiclesPageProps) {
  const navigate = useNavigate()
  const [page, setPage] = useState(initialParams?.page ?? 0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [search, setSearch] = useState('')

  const params: ListVehiclesParams = {
    page: page + 1,
    limit: rowsPerPage,
  }
  if (search) params.search = search

  const { data, isLoading, isError, error } = useListVehiclesQuery(params)

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
        <Typography variant="h4">Vehicles</Typography>
      </Box>

      <Stack direction="row" spacing={2} mb={2}>
        <SearchBar
          value={search}
          onSearch={handleSearch}
          placeholder="Search vehicles..."
        />
      </Stack>

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load vehicles. {(error as { data?: { message?: string } })?.data?.message ?? 'Please try again.'}
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
        emptyMessage="No vehicles yet"
        getRowId={(row) => row.id}
        onRowClick={(row) => navigate(`/vehicles/${row.id}`)}
      />
    </Box>
  )
}