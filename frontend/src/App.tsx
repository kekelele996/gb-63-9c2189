import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Spin } from 'antd'
import PrivateRoute from './components/PrivateRoute'
import AppLayout from './components/AppLayout'
import LoginPage from './pages/Login'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Greenhouses = lazy(() => import('./pages/Greenhouses'))
const Devices = lazy(() => import('./pages/Devices'))
const Alarms = lazy(() => import('./pages/Alarms'))
const PlantBatches = lazy(() => import('./pages/PlantBatches'))
const Tasks = lazy(() => import('./pages/Tasks'))
const Reports = lazy(() => import('./pages/Reports'))
const Users = lazy(() => import('./pages/Users'))

const LoadingFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <Spin size="large" />
  </div>
)

const AppRoutes = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <AppLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="greenhouses" element={<Greenhouses />} />
          <Route path="devices" element={<Devices />} />
          <Route path="alarms" element={<Alarms />} />
          <Route path="plant-batches" element={<PlantBatches />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="reports" element={<Reports />} />
          <Route
            path="users"
            element={
              <PrivateRoute roles={['admin']}>
                <Users />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default AppRoutes
