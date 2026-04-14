# Facey's Party Rentals & Catering - Project Handover & Sales Agreement Draft

This document outlines the capabilities developed for the Facey's Party Rentals & Catering custom web application and details the prerequisites required from the business owner, Patrick Facey, to successfully launch, host, and manage the platform independently.

---

## Part 1: Web Application Capabilities & Delivery Summary

The following features have been completely built and integrated into the bespoke web application, providing an end-to-end digital transformation for the business:

### 1. Customer Portal & Online Booking
*   **Dynamic Inventory Catalog**: Customers can seamlessly browse rental and catering inventory.
*   **Quote Requests & Cart System**: Customers can add items to their cart and submit detailed quote requests for their events.
*   **Responsive Design**: A premium, modern, and fully responsive UI built to work perfectly on mobile, tablet, and desktop devices.

### 2. Comprehensive Admin Dashboard
*   **Business Analytics**: Intuitive charts and tracking of sales, quotes, and inventory movements.
*   **Role-Based Access Control (RBAC)**: Secure admin environment with scoped permissions for different staff members.
*   **Calendar Integration**: Built-in event calendar to track upcoming rentals, pick-ups, and catering dates.

### 3. Order & Quote Management
*   **Quote-to-Invoice Workflow**: Complete lifecycle management. Admins can review online quote requests, finalize pricing, and convert them seamlessly into professional email invoices.

### 4. Advanced Inventory Management
*   **Mass CSV Uploads**: Features to quickly export, update, and import massive inventory catalogs via CSV, mitigating tedious manual entry.
*   **Real-time Stock Management**: Keep track of available items and prevent double-booking.

### 5. Backend Infrastructure & Automations
*   **Cloud Database & Secure Authentication**: Powered by Firebase Firestore for real-time database syncing and encrypted user authentication.
*   **Cloud Functions**: Serverless functions handling automated tasks like email notifications and payment verifications.

---

## Part 2: Owner Requirements & Handover Checklist

Since Patrick entirely owns the final product and currently only possesses a GoDaddy domain, the following items must be structurally set up by him (or with our assistance) to transition the application from the development environment to a live, scalable production environment:

### 1. Web Hosting & Domain Connection
*   [ ] **GoDaddy Account Access**: Access to modify the GoDaddy DNS (Domain Name System) settings. This is required to point `faceysrentals.com` (or the equivalent domain) to the final hosting server.
*   [ ] **Frontend Hosting Platform**: The application will be deployed (recommended to use **Firebase Hosting** or **Vercel**). No heavy ongoing fees are required for standard traffic, but an account must be established.

### 2. Database & Cloud Computing Infrastructure (Firebase)
*   [ ] **Google / Firebase Account**: Patrick needs to create or use a dedicated Google Account for the business. This account will legally "own" the Firebase Project (where the customer data, user accounts, and inventory images live).
*   [ ] **Firebase "Blaze" Plan Upgrade**: To enable Cloud Functions (which automatically send emails and process payments), Firebase requires a credit card on file. *Note: Firebase has an extremely generous free tier, so monthly charges will be effectively $0 or only a few cents during early operations.*

### 3. Payment Gateway Integration
*   [ ] **PayPal Business / Stripe Account**: Patrick needs an activated business PayPal or Stripe account to receive funds globally.
*   [ ] **Developer API Keys**: Once the account is created, we will need the **Client ID** and **Secret API Keys** (for both Sandbox/Testing and Production) to securely wire the payment portal into the application's checkout and invoice screens.

### 4. Email Operations & Automation
*   [ ] **Official Business Email**: Sending automated invoices from `@gmail.com` drops trust. A business email address is required (e.g., `info@faceysrentals.com`). GoDaddy offers Microsoft 365 or Google Workspace integrations.
*   [ ] **SMTP / Mail Service Credentials**: If using a dedicated transactional email service (like SendGrid or Mailgun) to guarantee invoices don't go to spam, Patrick will need to set up a free account and provide the API keys. *We will also need GoDaddy access to add DNS records preventing spam flags.*

### 5. Final Operational Onboarding
*   [ ] **Master Admin Email**: The chosen email address Patrick will use to log into the system as the Root Administrator.
*   [ ] **Starting Inventory Matrix**: The finalized CSV file of inventory items, accurate pictures, and prices, ready for the initial production database import.

---

## Next Steps
Once these accounts and credentials are created, they can be handed over via a secure channel (like 1Password, Bitwarden, or a secure temporary file) so the codebase can be populated with Patrick's final production keys. Upon integration, the domain will be pointed, and the site will officially go live.
