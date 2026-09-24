import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './context/AuthContext'
import LandingPage from './pages/LandingPage'
import DesignSystemPage from './pages/DesignSystemPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import NetworkTrafficPage from './pages/NetworkTrafficPage'
import MachineLearningPage from './pages/MachineLearningPage'
import ThreatAnalyticsPage from './pages/ThreatAnalyticsPage'
import AlertsPage from './pages/AlertsPage'
import AdminPage from './pages/AdminPage'
import LiveMonitoringPage from './pages/LiveMonitoringPage'
import AdvancedAnalyticsPage from './pages/AdvancedAnalyticsPage'
import ProtectedRoute from './components/common/ProtectedRoute'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/design" element={<DesignSystemPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/traffic"
              element={
                <ProtectedRoute>
                  <NetworkTrafficPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/models"
              element={
                <ProtectedRoute>
                  <MachineLearningPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <ThreatAnalyticsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/alerts"
              element={
                <ProtectedRoute>
                  <AlertsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/live"
              element={
                <ProtectedRoute>
                  <LiveMonitoringPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/advanced"
              element={
                <ProtectedRoute>
                  <AdvancedAnalyticsPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
