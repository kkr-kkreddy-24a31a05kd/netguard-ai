import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import LoadingState from '../feedback/LoadingState'
import Alert from './Alert'
import Button from './Button'
import { ShieldAlert, ArrowLeft } from 'lucide-react'

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, loading, isAuthenticated } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-cyber-950 flex items-center justify-center">
        <LoadingState variant="radar" text="Verifying cryptographic session credentials..." />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="min-h-screen bg-cyber-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full space-y-4">
          <Alert
            variant="critical"
            title="403 Forbidden: Insufficient Privileges"
            message={`This SOC view is restricted to '${requiredRole}' privileges. Your current role is '${user?.role}'.`}
          />
          <div className="pt-2">
            <Button
              variant="secondary"
              icon={ArrowLeft}
              onClick={() => window.history.back()}
            >
              Return to Previous View
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return children
}
