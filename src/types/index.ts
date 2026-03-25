// ============================================================
// Facey's Party Rentals & Catering - Core Entity Types
// ============================================================

// --- Enums ---

export enum UserRole {
    Owner = 'OWNER',
    Admin = 'ADMIN',
    Staff = 'STAFF',
    Marketing = 'MARKETING',
    Accountant = 'ACCOUNTANT',
    Client = 'CLIENT',
}

export enum EventStatus {
    Inquiry = 'inquiry',
    Quoted = 'quoted',
    Confirmed = 'confirmed',
    Completed = 'completed',
    Cancelled = 'cancelled',
}

export enum EventType {
    Rental = 'rental',
    Catering = 'catering',
    Both = 'both',
}

export enum DeliveryStatus {
    Scheduled = 'scheduled',
    OutForDelivery = 'out_for_delivery',
    Delivered = 'delivered',
    PickupScheduled = 'pickup',
    Returned = 'returned',
}

export enum QuoteStatus {
    Sent = 'sent',
    Reviewed = 'reviewed',
    Accepted = 'accepted',
    Expired = 'expired',
}

export enum InvoiceStatus {
    Unpaid = 'unpaid',
    Partial = 'partial',
    Paid = 'paid',
    Overdue = 'overdue',
}

export enum PaymentMethod {
    Cash = 'cash',
    Card = 'card',
    BankTransfer = 'bank_transfer',
    Stripe = 'stripe',
    Other = 'other',
}

export enum DepositType {
    None = 'none',
    Fixed = 'fixed',
    Percentage = 'percentage',
}

export enum ItemCategory {
    Tent = 'tent',
    Table = 'table',
    Chair = 'chair',
    Linen = 'linen',
    Lighting = 'lighting',
    Backdrop = 'backdrop',
    Decoration = 'decoration',
    CateringEquipment = 'catering_equipment',
    Dinnerware = 'dinnerware',
    Other = 'other',
}

export enum PricingModel {
    PerDay = 'per_day',
    PerEvent = 'per_event',
    PerHead = 'per_head',
}

export enum WorkLogContext {
    Setup = 'setup',
    Delivery = 'delivery',
    EventDuty = 'event_duty',
    Breakdown = 'breakdown',
    General = 'general'
}

// --- Entities ---

export interface User {
    id: string;
    role: UserRole;
    name: string;
    email: string;
    phone: string;
    status: 'active' | 'inactive';
    hourlyRate?: number;
    createdAt: Date;
}

export interface Client {
    id: string;
    businessName?: string;
    contactName: string;
    email: string;
    phone: string;
    billingAddress: string;
    billingCity?: string;
    billingState?: string;
    billingZip?: string;
    preferredContact?: 'email' | 'phone' | 'text';
    referralSource?: string;
    specialNotes?: string;
    internalNotes?: string;
    specialDiscount?: number;
    status?: 'active' | 'inactive' | 'lead';
    notes: string;
    lifetimeValue: number; // auto-calculated
    createdAt: Date;
    quickbooksCustomerId?: string;
}

export interface InventoryItem {
    id: string;
    name: string;
    category: ItemCategory;
    description: string;
    images: string[];
    totalQuantity: number;
    internalCost: number;
    rentalPrice: number;
    cateringPrice?: number;
    pricingModel: PricingModel;
    status: 'active' | 'inactive';
    allowOverbooking: boolean;
    maintenanceStatus?: string;
    notes: string;
    createdAt: Date;
    quickbooksItemId?: string;
}

export interface Event {
    id: string;
    clientId: string;
    eventDate: Date;
    startTime: string;
    endTime: string;
    venueAddress: string;
    eventType: EventType;
    status: EventStatus;
    deliveryStatus: DeliveryStatus;
    assignedStaffIds: string[];
    internalNotes: string;
    createdAt: Date;
}

export interface EventItem {
    id: string;
    eventId: string;
    inventoryItemId: string;
    quantity: number;
    priceAtTime: number;
    subtotal: number;
    costBasis: number;
    overbookWarning: boolean;
}

export interface Quote {
    id: string;
    eventId: string;
    clientId?: string;
    total: number;
    tax: number;
    discount: number;
    depositRequired: number;
    expirationDate: Date;
    status: QuoteStatus;
    pdfUrl?: string;
    createdAt: Date;
    // Inquiry details from web form
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    eventDate?: string;
    eventType?: string;
    guestCount?: number;
    venue?: string;
    notes?: string;
    items?: any[];
    followUpCount?: number;
    lastContactedAt?: Date;
}

export interface Invoice {
    id: string;
    eventId: string;
    quoteId?: string;
    invoiceNumber: string; // auto-incremented
    lineItems: InvoiceLineItem[];
    subtotal: number;
    tax: number;
    total: number;
    depositType: DepositType;
    depositAmount: number;
    balanceDue: number;
    dueDate: Date;
    status: InvoiceStatus;
    createdAt: Date;
    quickbooksInvoiceId?: string;
}

export interface InvoiceLineItem {
    itemId: string;
    description: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
}

export interface Payment {
    id: string;
    invoiceId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    stripeId?: string;
    reference?: string;
    paymentDate: Date;
    recordedBy: string;
    createdAt: Date;
    quickbooksPaymentId?: string;
}

export interface AuditLog {
    id: string;
    entityType: string;
    entityId: string;
    action: string;
    changedBy: string;
    timestamp: Date;
    beforeState?: Record<string, unknown>;
    afterState?: Record<string, unknown>;
}

export interface Employee {
    id: string;
    fullName: string;
    email: string;
    role: string;
    phone: string;
    hourlyRate: number;
    isActive: boolean;
}

export interface WorkLogEntry {
    id: string;
    employeeId: string;
    bookingId?: string;
    context: WorkLogContext;
    clockInTime: Date;
    clockOutTime?: Date;
    totalHours?: number;
    notes?: string;
    status: 'pending' | 'approved' | 'rejected' | 'paid';
    approvedBy?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface PayPeriod {
    id: string;
    startDate: Date;
    endDate: Date;
    status: 'open' | 'processing' | 'closed'; // processing=reviewing hours, closed=stubs generated and paid
    paymentDate?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface PayStub {
    id: string;
    employeeId: string;
    payPeriodId: string;
    totalHours: number;
    hourlyRate: number;
    grossPay: number;      // totalHours * hourlyRate
    deductions: number;    // manual adjustments
    bonuses: number;       // manual adjustments
    netPay: number;        // grossPay - deductions + bonuses
    status: 'draft' | 'paid';
    paymentDate?: Date;
    workLogIds: string[];  // The work entries that make up this stub
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface SiteContent {
    id: string;
    siteName: string;
    contactEmail: string;
    contactPhone: string;
    contactAddress: string;
    
    heroTitle: string;
    heroSubtitle: string;
    heroImage: string;
    
    aboutUsText: string;
    aboutUsImage?: string;
 
    ctaTitle: string;
    ctaSubtitle: string;
    ctaImage?: string;

    seoTitle: string;
    seoDescription: string;
    seoKeywords: string;
    ogImage?: string;

    socialLinks: {
        facebook?: string;
        instagram?: string;
        twitter?: string;
    };
    
    services: {
        title: string;
        description: string;
        image: string;
        linkText: string;
        linkUrl: string;
    }[];

    recentEvents: {
        image: string;
        alt: string;
    }[];
}
