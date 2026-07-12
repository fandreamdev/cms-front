import { hasPermission } from '../../api/auth'
import { useAuth } from '../../contexts/authContextValue'

export const usePermission = () => {
  const { user } = useAuth()
  return (permission: string) => hasPermission(user, permission)
}
