import {setGlobalOptions} from "firebase-functions/v2";
import {defineSecret} from "firebase-functions/params";
import {
  onDocumentUpdated,
  onDocumentCreated,
} from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import {Timestamp} from "firebase-admin/firestore";
import * as nodemailer from "nodemailer";
import PDFDocument from "pdfkit";

admin.initializeApp();
setGlobalOptions({maxInstances: 10, region: "us-east1"});

// --- SMTP Secrets ---
const smtpUser = defineSecret("SMTP_USER");
const smtpPass = defineSecret("SMTP_PASS");

// --- Types (Mirrored from src/types/index.ts) ---

enum QuoteStatus {
  Pending = "pending",
  Drafting = "drafting",
  Sent = "sent",
  Accepted = "accepted",
  Expired = "expired",
}

interface BusinessSettings {
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  addressStreet: string;
  addressCity: string;
  addressState: string;
  addressZip: string;
}

interface QuoteItem {
  name?: string;
  description?: string;
  quantity?: number;
  price?: number;
  priceAtTime?: number;
}

interface Quote {
  id: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  total: number;
  status: QuoteStatus;
  items?: QuoteItem[];
  createdAt: Timestamp | Date;
  expirationDate: Timestamp | Date;
  notes?: string;
}

interface InvoiceLineItem {
  description: string;
  quantity: number;
  subtotal: number;
}

interface Invoice {
  invoiceNumber: string;
  customerName?: string;
  customerEmail?: string;
  clientId?: string;
  total: number;
  subtotal: number;
  tax: number;
  balanceDue?: number;
  createdAt: Timestamp | Date;
  dueDate: Timestamp | Date;
  lineItems: InvoiceLineItem[];
}

// --- Email Configuration ---

/**
 * Creates a Nodemailer transporter using defined secrets.
 * @return {nodemailer.Transporter} The transporter.
 */
function getTransporter(): nodemailer.Transporter {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: smtpUser.value(),
      pass: smtpPass.value(),
    },
  });
}

/**
 * Triggered when a quote is updated.
 * If status changes to 'sent', generate PDF and email the client.
 */
export const onQuoteUpdate = onDocumentUpdated(
  {
    document: "booking_requests/{quoteId}",
    secrets: [smtpUser, smtpPass],
  },
  async (event) => {
    const beforeData = event.data?.before.data() as Quote | undefined;
    const afterData = event.data?.after.data() as Quote | undefined;

    if (!beforeData || !afterData) {
      return;
    }

    // Only trigger if status changed to 'sent'
    if (beforeData.status !== QuoteStatus.Sent &&
        afterData.status === QuoteStatus.Sent) {
      logger.info(`Quote ${event.params.quoteId} SENT. Emailing client.`);

      try {
        const settings = await getBusinessSettings();
        const pdfBuffer = await generateQuotePDF(afterData, settings);

        // Upload PDF to Storage
        const bucket = admin.storage().bucket();
        const fileName = `quotes/${event.params.quoteId}_${Date.now()}.pdf`;
        const file = bucket.file(fileName);

        await file.save(pdfBuffer, {
          metadata: {contentType: "application/pdf"},
        });

        const [url] = await file.getSignedUrl({
          action: "read",
          expires: "03-01-2500",
        });

        // Update quote
        await admin.firestore()
          .collection("booking_requests")
          .doc(event.params.quoteId)
          .update({
            pdfUrl: url,
            lastContactedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

        // Send Email
        await getTransporter().sendMail({
          from: `"${settings.companyName}" <${settings.contactEmail}>`,
          to: afterData.customerEmail,
          subject: `Your Quote from ${settings.companyName}`,
          text: `Hello ${afterData.customerName},\n\n` +
                "Please find your quote attached for the upcoming event.\n\n" +
                `Best regards,\n${settings.companyName}`,
          attachments: [
            {
              filename: `Quote_${event.params.quoteId}.pdf`,
              content: pdfBuffer,
            },
          ],
        });

        logger.info(`Successfully processed Quote ${event.params.quoteId}`);
      } catch (error) {
        logger.error(`Error processing Quote ${event.params.quoteId}:`, error);
      }
    }
  }
);

/**
 * Triggered when a new invoice is created.
 * Generate PDF and email the client.
 */
export const onInvoiceCreate = onDocumentCreated(
  {
    document: "invoices/{invoiceId}",
    secrets: [smtpUser, smtpPass],
  },
  async (event) => {
    const data = event.data?.data() as Invoice | undefined;
    if (!data) {
      return;
    }

    logger.info(`New Invoice ${event.params.invoiceId}. Emailing client.`);

    try {
      const settings = await getBusinessSettings();

      let clientEmail = data.customerEmail;
      let clientName = data.customerName;

      if (!clientEmail && data.clientId) {
        const clientSnap = await admin.firestore()
          .collection("clients")
          .doc(data.clientId)
          .get();
        if (clientSnap.exists) {
          const clientData = clientSnap.data();
          clientEmail = clientData?.email;
          clientName = clientData?.contactName;
        }
      }

      if (!clientEmail) {
        logger.warn(`No email found for Invoice ${event.params.invoiceId}`);
        return;
      }

      const pdfBuffer = await generateInvoicePDF(data, settings);
      const bucket = admin.storage().bucket();
      const fileName = `invoices/${event.params.invoiceId}_${Date.now()}.pdf`;
      const file = bucket.file(fileName);

      await file.save(pdfBuffer, {
        metadata: {contentType: "application/pdf"},
      });

      const [url] = await file.getSignedUrl({
        action: "read",
        expires: "03-01-2500",
      });

      await admin.firestore()
        .collection("invoices")
        .doc(event.params.invoiceId)
        .update({pdfUrl: url});

      // Send Email
      await getTransporter().sendMail({
        from: `"${settings.companyName}" <${settings.contactEmail}>`,
        to: clientEmail,
        subject: `Invoice ${data.invoiceNumber} from ${settings.companyName}`,
        text: `Hello ${clientName || "Customer"},\n\n` +
              `Please find your invoice ${data.invoiceNumber} attached.\n\n` +
              `Total Due: $${data.total}\n\n` +
              `Best regards,\n${settings.companyName}`,
        attachments: [
          {
            filename: `Invoice_${data.invoiceNumber}.pdf`,
            content: pdfBuffer,
          },
        ],
      });

      logger.info(`Processed Invoice ${event.params.invoiceId}`);
    } catch (error) {
      logger.error(
        `Error processing Invoice ${event.params.invoiceId}:`,
        error
      );
    }
  }
);

// --- Helpers ---

/**
 * Fetches business settings from Firestore.
 * @return {Promise<BusinessSettings>} The business settings.
 */
async function getBusinessSettings(): Promise<BusinessSettings> {
  const snap = await admin.firestore()
    .collection("settings")
    .doc("business")
    .get();
  const data = snap.data();
  return {
    companyName: data?.companyName || "Facey's Party Rentals",
    contactEmail: data?.contactEmail || "info@faceysrentals.com",
    contactPhone: data?.contactPhone || "",
    addressStreet: data?.addressStreet || "",
    addressCity: data?.addressCity || "",
    addressState: data?.addressState || "",
    addressZip: data?.addressZip || "",
  };
}

/**
 * Generates a PDF buffer for a quote.
 * @param {Quote} quote The quote data.
 * @param {BusinessSettings} settings The business settings.
 * @return {Promise<Buffer>} The PDF buffer.
 */
async function generateQuotePDF(
  quote: Quote,
  settings: BusinessSettings
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({margin: 50});
    const buffers: Buffer[] = [];
    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", (err) => reject(err));

    // Header
    doc.fontSize(20).text(settings.companyName, {align: "right"});
    doc.fontSize(10).text(settings.addressStreet, {align: "right"});
    const addr = `${settings.addressCity}, ${settings.addressState} ` +
                 `${settings.addressZip}`;
    doc.text(addr, {align: "right"});
    doc.text(settings.contactPhone, {align: "right"});
    doc.text(settings.contactEmail, {align: "right"});
    doc.moveDown();

    doc.fontSize(25).text("QUOTE", {align: "left"});
    const qDate = quote.createdAt instanceof Timestamp ?
      quote.createdAt.toDate() : new Date(quote.createdAt);
    const eDate = quote.expirationDate instanceof Timestamp ?
      quote.expirationDate.toDate() : new Date(quote.expirationDate);

    doc.fontSize(10).text(`Date: ${qDate.toLocaleDateString()}`);
    doc.text(`Expires: ${eDate.toLocaleDateString()}`);
    doc.moveDown();

    // Client Info
    doc.fontSize(12).text("Bill To:", {underline: true});
    doc.fontSize(10).text(quote.customerName || "Customer");
    doc.text(quote.customerEmail || "");
    doc.text(quote.customerPhone || "");
    doc.moveDown();

    // Items Table
    doc.fontSize(12).text("Items & Services", {underline: true});
    doc.moveDown(0.5);

    const items = quote.items || [];
    items.forEach((item) => {
      const name = item.name || item.description || "Item";
      const qty = item.quantity || 1;
      const price = item.priceAtTime || item.price || 0;
      doc.fontSize(10).text(`${name} x ${qty}`, {continued: true});
      doc.text(` $${price.toFixed(2)}`, {align: "right"});
    });

    doc.moveDown();
    doc.fontSize(12).text(`Total: $${(quote.total || 0).toFixed(2)}`, {
      align: "right",
    });

    if (quote.notes) {
      doc.moveDown();
      doc.fontSize(10).text("Notes:", {underline: true});
      doc.text(quote.notes);
    }

    doc.end();
  });
}

/**
 * Generates a PDF buffer for an invoice.
 * @param {Invoice} invoice The invoice data.
 * @param {BusinessSettings} settings The business settings.
 * @return {Promise<Buffer>} The PDF buffer.
 */
async function generateInvoicePDF(
  invoice: Invoice,
  settings: BusinessSettings
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({margin: 50});
    const buffers: Buffer[] = [];
    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", (err) => reject(err));

    // Header
    doc.fontSize(20).text(settings.companyName, {align: "right"});
    doc.fontSize(10).text(settings.addressStreet, {align: "right"});
    const addr = `${settings.addressCity}, ${settings.addressState} ` +
                 `${settings.addressZip}`;
    doc.text(addr, {align: "right"});
    doc.moveDown();

    doc.fontSize(25).text(`INVOICE ${invoice.invoiceNumber}`, {align: "left"});
    const iDate = invoice.createdAt instanceof Timestamp ?
      invoice.createdAt.toDate() : new Date(invoice.createdAt);
    const dDate = invoice.dueDate instanceof Timestamp ?
      invoice.dueDate.toDate() : new Date(invoice.dueDate);

    doc.fontSize(10).text(`Date: ${iDate.toLocaleDateString()}`);
    doc.text(`Due Date: ${dDate.toLocaleDateString()}`);
    doc.moveDown();

    // Items
    doc.fontSize(12).text("Items", {underline: true});
    doc.moveDown(0.5);

    const items = invoice.lineItems || [];
    items.forEach((item) => {
      doc.fontSize(10).text(`${item.description} x ${item.quantity}`, {
        continued: true,
      });
      doc.text(` $${(item.subtotal || 0).toFixed(2)}`, {align: "right"});
    });

    doc.moveDown();
    doc.fontSize(12).text(`Subtotal: $${(invoice.subtotal || 0).toFixed(2)}`, {
      align: "right",
    });
    doc.text(`Tax: $${(invoice.tax || 0).toFixed(2)}`, {align: "right"});
    doc.fontSize(14).text(`Total: $${(invoice.total || 0).toFixed(2)}`, {
      align: "right",
    });

    if (invoice.balanceDue !== undefined) {
      doc.text(`Balance Due: $${invoice.balanceDue.toFixed(2)}`, {
        align: "right",
      });
    }

    doc.end();
  });
}

