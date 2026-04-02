import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema(
  {
    isGSTInvoice: {
      type: Boolean,
      default: true,
    },
    customerGST: {
      type: String,
      required: function() {
        return this.isGSTInvoice === true;
      },
    },
    invoiceDate: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    customerAddress: {
      type: String,
      required: true,
    },
    customerPhone: {
      type: String,
      required: true,
    },
    customerEmail: {
      type: String,
      required: true,
    },
    dispatchThrough: {
      type: String,
      default: '',
    },
    customerAadhar: {
      type: String,
    },
    productDetails: [
      {
        description: { type: String },
        unit: { type: String },
        quantity: { type: Number },
        price: { type: Number },
        discountPercentage: { type: Number },
        amount: { type: Number },
      },
    ],
    amountDetails: {
      gstPercentage: {
        type: Number,
      },
      discountOnTotal: {
        type: Number,
      },
      totalAmount: {
        type: Number,
        required: true,
      },
      advancePayment: {
        type: Number,
        default: 0,
      },
      advancePaymentMode: {
        type: String,
        enum: ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Card', 'Other'],
        default: 'Cash',
      },
      dueAmount: {
        type: Number,
        default: 0,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    paymentMode: {
      type: String,
      enum: ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Card', 'Other'],
      default: 'Cash',
    },
    notes: {
      type: String,
      default: '',
    },
    lastInvoiceId: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Invoice',
      default: [],
    },
  },
  { timestamps: true }
);

// Index on createdAt (descending) for efficient latest invoice lookup
invoiceSchema.index({ createdAt: -1 });

const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice;
