import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema(
  {
    customerGST: {
      type: String,
      required: true,
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
        description: {
          type: String,
          required: true,
        },
        unit: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        discountPercentage: {
          type: Number,
        },
        amount: {
          type: Number,
          required: true,
        },
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
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice;
