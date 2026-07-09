import { lazy, Suspense } from 'react'
import type React from 'react'
import { Routes, Route } from 'react-router-dom'
import { CircularProgress, Box } from '@mui/material'
import { PublicRoute } from '../features/auth/components/PublicRoute'
import { PrivateRoute } from '../features/auth/components/PrivateRoute'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { SignupPage } from '../features/auth/pages/SignupPage'
import { VerifyEmailPage } from '../features/auth/pages/VerifyEmailPage'
import { VerifyEmailSentPage } from '../features/auth/pages/VerifyEmailSentPage'
import { AppLayout } from './AppLayout'

// Each feature module is lazy-loaded so its code only loads when the user visits that route
const DashboardPage = lazy(() => import('../features/dashboard/pages/DashboardPage'))
const ClientsPage = lazy(() => import('../features/clients/pages/ClientsPage'))
const VehiclesPage = lazy(() => import('../features/vehicles/pages/VehiclesPage'))
const MechanicsPage = lazy(() => import('../features/mechanics/pages/MechanicsPage'))
const SparePartsPage = lazy(() => import('../features/spare-parts/pages/SparePartsPage'))
const ClientDetailPage = lazy(() => import('../features/clients/pages/ClientDetailPage'))
const VehicleDetailPage = lazy(() => import('../features/vehicles/pages/VehicleDetailPage'))
const MechanicDetailPage = lazy(() => import('../features/mechanics/pages/MechanicDetailPage'))
const SparePartDetailPage = lazy(() => import('../features/spare-parts/pages/SparePartDetailPage'))
const WorkOrdersPage = lazy(() => import('../features/work-orders/pages/WorkOrdersPage'))

function LoadingFallback() {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
      <CircularProgress />
    </Box>
  )
}

export function AppRouter(): React.JSX.Element {
  return (
    <Routes>
      {/* Public auth routes — no layout */}
      <Route
        path="/login"
        element={<PublicRoute><LoginPage /></PublicRoute>}
      />
      <Route
        path="/signup"
        element={<PublicRoute><SignupPage /></PublicRoute>}
      />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/verify-email-sent" element={<VerifyEmailSentPage />} />

      {/* Private routes — wrapped in AppLayout */}
      <Route
        element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }
      >
        <Route
          path="/"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <DashboardPage />
            </Suspense>
          }
        />
        <Route
          path="/clients"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <ClientsPage />
            </Suspense>
          }
        />
        <Route
          path="/clients/:id"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <ClientDetailPage />
            </Suspense>
          }
        />
        <Route
          path="/vehicles"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <VehiclesPage />
            </Suspense>
          }
        />
        <Route
          path="/vehicles/:id"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <VehicleDetailPage />
            </Suspense>
          }
        />
        <Route
          path="/mechanics"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <MechanicsPage />
            </Suspense>
          }
        />
        <Route
          path="/mechanics/:id"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <MechanicDetailPage />
            </Suspense>
          }
        />
        <Route
          path="/inventory"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <SparePartsPage />
            </Suspense>
          }
        />
        <Route
          path="/inventory/:id"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <SparePartDetailPage />
            </Suspense>
          }
        />
        <Route
          path="/work-orders"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <WorkOrdersPage />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  )
}
