import mongoose from 'mongoose';

const quotationSchema = new mongoose.Schema(
  {
    quotationNumber: {
      type: String,
      required: true,
      unique: true,
    },
    quotationDate: {
      type: Date,
      required: true,
    },
    validUntil: {
      type: Date,
      required: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    customerEmail: {
      type: String,
      default: '',
    },
    customerPhone: {
      type: String,
      required: true,
    },
    customerAddress: {
      type: String,
      required: true,
    },
    customerGST: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired'],
      default: 'Draft',
    },
    notes: {
      type: String,
      default: '',
    },
    termsAndConditions: {
      type: String,
      default: '',
    },
    isGSTQuotation: {
      type: Boolean,
      default: true,
    },
    gstPercentage: {
      type: Number,
      default: 18,
    },
    discountOnTotal: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    items: [
      {
        description: { 
          type: String, 
          required: true 
        },
        unit: { 
          type: String, 
          required: true 
        },
        quantity: { 
          type: Number, 
          required: true,
          min: 1 
        },
        price: { 
          type: Number, 
          required: true,
          min: 0 
        },
        discountPercentage: { 
          type: Number, 
          default: 0,
          min: 0,
          max: 100 
        },
        amount: { 
          type: Number, 
          required: true,
          min: 0 
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Index on createdAt (descending) for efficient latest quotation lookup
quotationSchema.index({ createdAt: -1 });

// Index on quotationNumber for quick searches
quotationSchema.index({ quotationNumber: 1 });

// Index on status for filtering
quotationSchema.index({ status: 1 });

const Quotation = mongoose.model('Quotation', quotationSchema);
export default Quotation;