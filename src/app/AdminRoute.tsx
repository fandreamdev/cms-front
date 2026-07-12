import RequireAuth from '../components/RequireAuth'
import AdminLayout from '../layout/AdminLayout'

const AdminRoute = () => (
  <RequireAuth>
    <AdminLayout />
  </RequireAuth>
)

export default AdminRoute
