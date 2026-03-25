import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QuoteProvider } from './contexts/QuoteContext'
import { ContentProvider } from './contexts/ContentContext'
import { UserRole } from './types'
const Layout = lazy(() => import('./components/layout/Layout'))
const HomePage = lazy(() => import('./pages/public/HomePage'))
const CatalogPage = lazy(() => import('./pages/public/CatalogPage'))
const CateringPage = lazy(() => import('./pages/public/CateringPage'))
const RequestQuotePage = lazy(() => import('./pages/public/RequestQuotePage'))
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'))
const QuotesAdminPage = lazy(() => import('./pages/admin/QuotesAdminPage'))
const InventoryAdminPage = lazy(() => import('./pages/admin/InventoryAdminPage'))
const CalendarPage = lazy(() => import('./pages/admin/CalendarPage'))
const CustomersPage = lazy(() => import('./pages/admin/CustomersPage'))
const InvoicesPage = lazy(() => import('./pages/admin/InvoicesPage'))
const LoginPage = lazy(() => import('./pages/admin/LoginPage'))
const AdminSetup = lazy(() => import('./pages/admin/AdminSetup'))
const AdminRoute = lazy(() => import('./components/auth/AdminRoute'))
const AdminLayout = lazy(() => import('./components/layout/AdminLayout'))
const TimeclockPage = lazy(() => import('./pages/staff/TimeclockPage'))
const PayrollPage = lazy(() => import('./pages/admin/PayrollPage'))
const ContentManagerPage = lazy(() => import('./pages/admin/ContentManagerPage'))
const CustomerPortalPage = lazy(() => import('./pages/customer/CustomerPortalPage'))
const SettingsPage = lazy(() => import('./pages/admin/SettingsPage'))

function RouteLoader() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-background-dark">
            <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
    )
}

function App() {
    return (
        <ContentProvider>
            <QuoteProvider>
                <BrowserRouter>
                    <Suspense fallback={<RouteLoader />}>
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

                            {/* Admin Setup */}
                            <Route element={<AdminRoute allowedRoles={[UserRole.Owner, UserRole.Admin]} />}>
                                <Route path="/admin/setup" element={<AdminSetup />} />
                            </Route>
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
                    </Suspense>
                </BrowserRouter>
            </QuoteProvider>
        </ContentProvider>
    )
}
export default App
