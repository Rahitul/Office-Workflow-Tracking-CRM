import mongoose, { Schema, Document } from "mongoose"

export interface IProductModel {
  modelName: string
  quantity: number
}

export interface IProduct {
  productName: string
  models: IProductModel[]
}

export interface IStatusHistoryEntry {
  status: string
  changedAt: Date
  byName: string
  remarks?: string
}

export interface IProjectTender extends Document {
  _id: mongoose.Types.ObjectId
  type: "project" | "tender"
  createdBy: mongoose.Types.ObjectId
  date: Date
  username: string
  category: string
  address: string
  locationDistrict: string
  tentativeCloseDate?: Date
  projectName: string
  companyName: string
  contactPersonName: string
  contactPersonNumber: string
  products: IProduct[]
  requiresSupport: boolean
  supportRequirements: string[]
  requestedPrice: number
  businessPromotionAmount: number
  documentPurchaseAmount?: number
  securityDepositAmount?: number
  adminStatus: "pending" | "approved" | "revised"
  adminRemarks?: string
  status: string
  negotiablePrice?: number
  negotiablePriceApproved?: boolean
  billNumber?: string
  billDate?: Date
  lostRemarks?: string
  statusHistory: IStatusHistoryEntry[]
  createdAt: Date
  updatedAt: Date
}

const ProductModelSchema = new Schema<IProductModel>(
  {
    modelName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
)

const ProductSchema = new Schema<IProduct>(
  {
    productName: { type: String, required: true },
    models: { type: [ProductModelSchema], required: true, validate: (v: IProductModel[]) => v.length > 0 },
  },
  { _id: false }
)

const ProjectTenderSchema = new Schema<IProjectTender>(
  {
    type: {
      type: String,
      enum: ["project", "tender"],
      required: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    username: { type: String, required: true },
    category: {
      type: String,
      enum: [
        "Machine",
        "Consumable",
        "Solution",
        "Machine + Consumable",
        "Machine + Solution",
        "Consumable + Solution",
        "All",
      ],
      required: true,
    },
    address: { type: String, default: "" },
    locationDistrict: { type: String, required: true },
    tentativeCloseDate: { type: Date },
    projectName: { type: String, required: true },
    companyName: { type: String, required: true },
    contactPersonName: { type: String, required: true },
    contactPersonNumber: { type: String, required: true },
    products: { type: [ProductSchema], required: true, validate: (v: IProduct[]) => v.length > 0 },
    requiresSupport: { type: Boolean, default: false },
    supportRequirements: { type: [String], default: [] },
    requestedPrice: { type: Number, required: true, min: 0 },
    businessPromotionAmount: { type: Number, required: true, min: 0 },
    documentPurchaseAmount: { type: Number, min: 0 },
    securityDepositAmount: { type: Number, min: 0 },
    adminStatus: {
      type: String,
      enum: ["pending", "approved", "revised"],
      default: "pending",
    },
    adminRemarks: { type: String },
    status: { type: String, default: "pending" },
    negotiablePrice: { type: Number, min: 0 },
    negotiablePriceApproved: { type: Boolean, default: false },
    billNumber: { type: String },
    billDate: { type: Date },
    lostRemarks: { type: String },
    statusHistory: {
      type: [
        {
          status: { type: String, required: true },
          changedAt: { type: Date, required: true },
          byName: { type: String, required: true },
          remarks: { type: String },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
)

if (mongoose.models.ProjectTender) {
  delete mongoose.models.ProjectTender
}

export const ProjectTender = mongoose.model<IProjectTender>("ProjectTender", ProjectTenderSchema)
