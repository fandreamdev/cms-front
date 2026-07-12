import RequireAuth from '../components/RequireAuth'
import AdminLayout from '../layout/AdminLayout'
import PermissionRoute from '../components/PermissionRoute'

const AdminRoute = () => (
  <RequireAuth>
    <PermissionRoute>
      <AdminLayout />
    </PermissionRoute>
  </RequireAuth>
)

export default AdminRoute
