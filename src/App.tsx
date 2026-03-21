import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QuoteProvider } from './contexts/QuoteContext'
import { ContentProvider } from './contexts/ContentContext'
import { UserRole } from './types'
import Layout from './components/layout/Layout'
import HomePage from './pages/public/HomePage'
import CatalogPage from './pages/public/CatalogPage'
import CateringPage from './pages/public/CateringPage'
import RequestQuotePage from './pages/public/RequestQuotePage'
import DashboardPage from './pages/admin/DashboardPage'
import QuotesAdminPage from './pages/admin/QuotesAdminPage'
import InventoryAdminPage from './pages/admin/InventoryAdminPage'
import CalendarPage from './pages/admin/CalendarPage'
import CustomersPage from './pages/admin/CustomersPage'
import InvoicesPage from './pages/admin/InvoicesPage'
import LoginPage from './pages/admin/LoginPage'
import AdminSetup from './pages/admin/AdminSetup'
import AdminRoute from './components/auth/AdminRoute'
import AdminLayout from './components/layout/AdminLayout'
import TimeclockPage from './pages/staff/TimeclockPage'
import PayrollPage from './pages/admin/PayrollPage'
import ContentManagerPage from './pages/admin/ContentManagerPage'
import CustomerPortalPage from './pages/customer/CustomerPortalPage'
import SettingsPage from './pages/admin/SettingsPage'

function App() {
    return (
        <ContentProvider>
            <QuoteProvider>
                <BrowserRouter>
                <Routes>
                    <Route element={<Layout />}>
                        {/* Public Routes */}
                        <Route path="/" element={<HomePage />} />
                        <Route path="/catalog" element={<CatalogPage />} />
                        <Route path="/catering" element={<CateringPage />} />
                        <Route path="/request-quote" element={<RequestQuotePage />} />
                        
                        {/* Protected Customer Routes */}
                        <Route element={<AdminRoute allowedRoles={[UserRole.Client]} />}>
                            <Route path="/my-account" element={<CustomerPortalPage />} />
                        </Route>
                    </Route>

                    {/* Admin Setup / Login - Unprotected for now */}
                    <Route path="/admin/setup" element={<AdminSetup />} />
                    <Route path="/admin/login" element={<LoginPage />} />

                    {/* Protected Admin Routes */}
                    <Route element={<AdminRoute allowedRoles={[UserRole.Owner, UserRole.Admin, UserRole.Marketing, UserRole.Accountant, UserRole.Staff]} />}>
                        <Route element={<AdminLayout />}>
                            {/* Dashboard - accessible to Admin, Marketing, Accountant */}
                            <Route element={<AdminRoute allowedRoles={[UserRole.Owner, UserRole.Admin, UserRole.Marketing, UserRole.Accountant]} />}>
                                <Route path="/admin" element={<DashboardPage />} />
                            </Route>

                            {/* Quotes & Invoices - Admin, Accountant */}
                            <Route element={<AdminRoute allowedRoles={[UserRole.Owner, UserRole.Admin, UserRole.Accountant]} />}>
                                <Route path="/admin/quotes" element={<QuotesAdminPage />} />
                                <Route path="/admin/invoices" element={<InvoicesPage />} />
                            </Route>

                            {/* Inventory - Admin, Marketing */}
                            <Route element={<AdminRoute allowedRoles={[UserRole.Owner, UserRole.Admin, UserRole.Marketing]} />}>
                                <Route path="/admin/inventory" element={<InventoryAdminPage />} />
                            </Route>

                            {/* Calendar, Customers, Settings - Admin only (for now) */}
                            <Route element={<AdminRoute allowedRoles={[UserRole.Owner, UserRole.Admin]} />}>
                                <Route path="/admin/calendar" element={<CalendarPage />} />
                                <Route path="/admin/customers" element={<CustomersPage />} />
                                <Route path="/admin/settings" element={<SettingsPage />} />
                            </Route>

                            {/* Staff */}
                            <Route element={<AdminRoute allowedRoles={[UserRole.Owner, UserRole.Admin, UserRole.Marketing, UserRole.Accountant, UserRole.Staff]} />}>
                                <Route path="/staff/timeclock" element={<TimeclockPage />} />
                            </Route>

                            {/* Payroll - Admin, Accountant */}
                            <Route element={<AdminRoute allowedRoles={[UserRole.Owner, UserRole.Admin, UserRole.Accountant]} />}>
                                <Route path="/admin/payroll" element={<PayrollPage />} />
                            </Route>

                            {/* Content Manager - Admin, Marketing */}
                            <Route element={<AdminRoute allowedRoles={[UserRole.Owner, UserRole.Admin, UserRole.Marketing]} />}>
                                <Route path="/admin/content" element={<ContentManagerPage />} />
                            </Route>
                        </Route>
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </QuoteProvider>
        </ContentProvider>
    )
}
export default App
