import mongoose, { Schema, Document } from "mongoose"

export interface IProductModel {
  modelName: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface IProductEntry {
  productName: string
  models: IProductModel[]
}

export interface IQuotation extends Document {
  _id: mongoose.Types.ObjectId
  quotationId: string
  quotationDate: Date
  customerName: string
  engineerName: string
  engineer?: mongoose.Types.ObjectId
  amount: number
  quotationType: string
  category: "sales" | "service" | "consumable"
  products: IProductEntry[]
  contactPerson: string
  contactNumber: string
  department?: string
  billDate?: Date
  status: string
  approvedAt?: Date
  cancelledAt?: Date
  revisedAt?: Date
  lostAt?: Date
  lostRemarks?: string
  followUpAt: Date[]
  followUpLogs?: Array<{
    date: Date
    userId: mongoose.Types.ObjectId
    userName: string
    remarks: string
  }>
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const ProductModelSchema = new Schema<IProductModel>({
  modelName: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
  unitPrice: { type: Number, required: true, default: 0 },
  totalPrice: { type: Number, required: true, default: 0 },
})

const ProductEntrySchema = new Schema<IProductEntry>({
  productName: { type: String, required: true },
  models: { type: [ProductModelSchema], default: [] },
})

const QuotationSchema = new Schema<IQuotation>(
  {
    quotationId: { type: String, required: true, unique: true },
    quotationDate: { type: Date, required: true },
    customerName: { type: String, required: true },
    engineerName: { type: String, required: true },
    engineer: { type: Schema.Types.ObjectId, ref: "User" },
    amount: { type: Number, required: true },
    quotationType: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ["sales", "service", "consumable"],
      default: "service",
    },
    products: { type: [ProductEntrySchema], default: [] },
    contactPerson: { type: String, required: true },
    contactNumber: { type: String, required: true },
    department: { type: String, default: "" },
    billDate: { type: Date },
    status: { type: String, default: "Pending" },
    approvedAt: { type: Date },
    cancelledAt: { type: Date },
    revisedAt: { type: Date },
    lostAt: { type: Date },
    lostRemarks: { type: String },
    followUpAt: { type: [Date], default: [] },
    followUpLogs: [{
      date: { type: Date },
      userId: { type: Schema.Types.ObjectId, ref: "User" },
      userName: { type: String },
      remarks: { type: String },
    }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
  }
)

export const Quotation =
  mongoose.models.Quotation || mongoose.model<IQuotation>("Quotation", QuotationSchema)
