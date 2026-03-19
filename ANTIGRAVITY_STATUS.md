# ANTIGRAVITY HANDOFF: Facey's Party Rentals

> [!IMPORTANT]
> **HANDOFF STATUS**: MAINTENANCE & BUG FIXING
> This platform is in the final stages of role-based security and layout optimization.

## 🎯 Current Objective
Stabilizing the **Admin Dashboard** and **POS System** for staff use.

## 🛠️ Recent Fixes (Done)
1. **User Role Discrepancy**: Fixed the bug where the owner (Eleanor) appeared as a 'customer' in edit modals. Role is now consistently 'owner' globally.
2. **POS Scrolling**: Fixed a layout constraint in the product grid. Large inventories are now scrollable on desktop/PC views.
3. **Redirect Loop**: Resolved the "client is offline" error during admin login which was causing infinite redirects to the homepage.
4. **DNS/Email Configuration**: Completed the SPF record merge to allow simultaneous use of **Google Workspace** and **Resend** for transactional emails.

## 📊 Where We Are
- [x] Firebase/Firestore Integration
- [x] Auth Role Management (Admin/Staff/Customer)
- [x] Product Inventory Grid
- [/] **ACTIVE WORKING BRANCH**: Staff Management Module
- [ ] Time Tracking (Clock-in/Clock-out)
- [ ] Final Content Audit (Marketing roles)

## ⚠️ Known Issues / Blockers
- **Staff Creation**: There was a bug preventing the creation of new staff accounts via the Admin UI. This is high priority.
- **Role Assignment**: Need to verify if "Marketing Manager" and "Accountant" roles have restricted access to sensitive financial data.

## 🛠️ Next Steps (Priority Order)
1. **Debug Staff Creation**: Inspect the `createStaff` function in `src/services/adminService.ts`. Check for Firestore permission errors.
2. **Implement Time Tracking**: Create the basic UI toggle for staff to "Clock In".
3. **Role Testing**: Log in as a "Staff" user to ensure they CANNOT access the Settings or User Management pages.

## 📂 Key Files to Open
- `src/hooks/useAuth.ts`: For role-based redirects.
- `src/pages/admin/StaffManagement.tsx`: To fix the staff creation bug.
- `firestore.rules`: To verify if roles have correct CRUD permissions.

---
*Created by Antigravity on 2026-03-10.*
