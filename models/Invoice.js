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
        return this.isGSTInvoice !== false;
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

// Auto-generate invoice number using atomic counter
invoiceSchema.pre('save', async function(next) {
  if (this.isNew && !this.invoiceNumber) {
    const Counter = mongoose.model('Counter', new mongoose.Schema({
      _id: String,
      seq: { type: Number, default: 0 }
    }));
    
    const counter = await Counter.findByIdAndUpdate(
      'invoice_number',
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    
    this.invoiceNumber = `INV-${counter.seq}`;
  }
  next();
});

const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice;
