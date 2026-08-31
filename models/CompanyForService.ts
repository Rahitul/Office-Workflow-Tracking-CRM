import mongoose, { Schema, Document } from "mongoose"

export interface ICompanyForService extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  group: string
  category: string
  location: string
  contactPerson: string
  contactNumber: string
  locations: Array<{
    location: string
    address: string
    district: string
    area: string
    contactPerson: string
    contactNumber: string
    contacts: Array<{
      name: string
      phone: string
      email: string
      designation: string
    }>
  }>
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const CompanyForServiceSchema = new Schema<ICompanyForService>(
  {
    name: { type: String, required: true },
    group: { type: String, default: "Not a group of company" },
    category: { type: String, default: "" },
    location: { type: String, default: "" },
    contactPerson: { type: String, default: "" },
    contactNumber: { type: String, default: "" },
    locations: {
      type: [{
        location: { type: String, default: "" },
        address: { type: String, default: "" },
        district: { type: String, default: "" },
        area: { type: String, default: "" },
        contactPerson: { type: String, default: "" },
        contactNumber: { type: String, default: "" },
        contacts: {
          type: [{
            name: { type: String, default: "" },
            phone: { type: String, default: "" },
            email: { type: String, default: "" },
            designation: { type: String, default: "" }
          }],
          default: []
        }
      }],
      default: []
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  {
    timestamps: true,
    collection: "companiesforservice",
  }
)

CompanyForServiceSchema.index({ name: 1, location: 1 }, { unique: true })

const CompanyForServiceModel = mongoose.models.CompanyForService || mongoose.model<ICompanyForService>("CompanyForService", CompanyForServiceSchema)

if (process.env.NODE_ENV !== "production") {
  CompanyForServiceModel.syncIndexes().catch((err) => console.error("Index sync error:", err))
}

export const CompanyForService = CompanyForServiceModel
