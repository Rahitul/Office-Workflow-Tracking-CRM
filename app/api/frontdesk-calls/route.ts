import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { FrontdeskCall } from "@/models/FrontdeskCall"
import { User } from "@/models/User"
import { verifyAccessToken } from "@/lib/auth"
import mongoose from "mongoose"

export async function POST(request: Request) {
  try {
    await connectDB()
    
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("accessToken")?.value
    
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const payload = await verifyAccessToken(accessToken)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }
    
    const body = await request.json()
    console.log("Frontdesk Call Request Body:", JSON.stringify(body, null, 2))
    
    const { callType } = body
    
    if (!callType || !["incoming", "outgoing", "visit"].includes(callType)) {
      return NextResponse.json({ error: "Invalid call type" }, { status: 400 })
    }

    let frontdeskCall: any

    if (callType === "incoming") {
      const { date, customerName, contactNumber, inquiryType, productType, consumableType, serviceType, issue, callTransferTo, priority } = body
      
      if (!date || !customerName || !contactNumber || !inquiryType || !issue) {
        return NextResponse.json({ error: "All required fields must be filled" }, { status: 400 })
      }
      
      frontdeskCall = new FrontdeskCall({
        callType: "incoming",
        date,
        customerName,
        contactNumber,
        inquiryType,
        productType: inquiryType === "Product" ? productType : undefined,
        consumableType: inquiryType === "Consumable" ? consumableType : undefined,
        serviceType: inquiryType === "Service" ? serviceType : undefined,
        issue,
        callTransferTo: callTransferTo ? new mongoose.Types.ObjectId(callTransferTo) : undefined,
        priority: priority || "Normal",
        createdBy: new mongoose.Types.ObjectId(payload.userId),
      })
    } else if (callType === "outgoing") {
      const { date, companyName, contactPersonName, contactPersonPhone, product, causeForCall, outcomeFromCall, isLeadSearch, leadFound, outgoingCallType, feedbackType } = body
      
      if (!date || !companyName || !contactPersonName || !contactPersonPhone) {
        return NextResponse.json({ error: "All required fields must be filled" }, { status: 400 })
      }
      
      frontdeskCall = new FrontdeskCall({
        callType: "outgoing",
        date,
        companyName,
        contactPersonName,
        contactPersonPhone,
        product,
        causeForCall: isLeadSearch ? undefined : causeForCall,
        outcomeFromCall,
        isLeadSearch: isLeadSearch || false,
        leadFound: leadFound || undefined,
        outgoingCallType: outgoingCallType || undefined,
        feedbackType: feedbackType || undefined,
        createdBy: new mongoose.Types.ObjectId(payload.userId),
      })
    } else if (callType === "visit") {
      const { date, visitorName, fromLocation, toLocation, purpose, phoneNumber } = body
      
      if (!date || !visitorName || !phoneNumber) {
        return NextResponse.json({ error: "All required fields must be filled" }, { status: 400 })
      }
      
      frontdeskCall = new FrontdeskCall({
        callType: "visit",
        date,
        visitorName,
        fromLocation,
        toLocation,
        purpose,
        phoneNumber,
        inTime: new Date(),
        createdBy: new mongoose.Types.ObjectId(payload.userId),
      })
    }
    
    await frontdeskCall.save()
    
    return NextResponse.json(
      { message: "Record saved successfully", frontdeskCall },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Save frontdesk call error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    await connectDB()
    
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("accessToken")?.value
    
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const payload = await verifyAccessToken(accessToken)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const userId = searchParams.get("userId")
    const callType = searchParams.get("callType")
    const priority = searchParams.get("priority")
    const search = searchParams.get("search")
    const visitorName = searchParams.get("visitorName")
    const companyName = searchParams.get("companyName")
    const purpose = searchParams.get("purpose")
    const incomingCustomerName = searchParams.get("incomingCustomerName")
    const incomingInquiryType = searchParams.get("incomingInquiryType")
    const incomingTransferredTo = searchParams.get("incomingTransferredTo")
    const incomingTransferredToId = searchParams.get("incomingTransferredToId")
    const incomingTransferredToRole = searchParams.get("incomingTransferredToRole")
    const outgoingCompanyName = searchParams.get("outgoingCompanyName")
    const outgoingProduct = searchParams.get("outgoingProduct")
    const outgoingIsLeadSearch = searchParams.get("outgoingIsLeadSearch")
    const outgoingLeadFound = searchParams.get("outgoingLeadFound")
    const outgoingCallType = searchParams.get("outgoingCallType")
    const outgoingFeedbackType = searchParams.get("outgoingFeedbackType")
    const inTimeStart = searchParams.get("inTimeStart")
    const inTimeEnd = searchParams.get("inTimeEnd")
    const outTimeStart = searchParams.get("outTimeStart")
    const outTimeEnd = searchParams.get("outTimeEnd")
    
    const query: Record<string, unknown> = {}
    
    if (startDate && endDate) {
      query.date = {
        $gte: startDate,
        $lte: endDate,
      }
    }
    
    if (callType && callType !== "all") {
      query.callType = callType
    }
    
    if (priority) {
      query.priority = priority
    }
    
    if (visitorName) {
      query.visitorName = { $regex: visitorName, $options: "i" }
    }
    
    if (companyName) {
      query.fromLocation = { $regex: companyName, $options: "i" }
    }
    
    if (purpose) {
      query.purpose = { $regex: purpose, $options: "i" }
    }

    if (incomingCustomerName) {
      query.customerName = { $regex: incomingCustomerName, $options: "i" }
    }

    if (incomingInquiryType) {
      query.inquiryType = incomingInquiryType
    }

    const transferredToFilters: Record<string, unknown>[] = []
    if (incomingTransferredToRole) {
      transferredToFilters.push({ role: incomingTransferredToRole })
    }
    if (incomingTransferredTo) {
      transferredToFilters.push({ name: { $regex: incomingTransferredTo, $options: "i" } })
    }
    if (incomingTransferredToId) {
      transferredToFilters.push({ _id: incomingTransferredToId })
    }
    if (transferredToFilters.length > 0) {
      const match = transferredToFilters.length === 1 ? transferredToFilters[0] : { $and: transferredToFilters }
      const users = await User.find(match).select("_id")
      const userIds = users.map(u => u._id)
      query.callTransferTo = userIds.length > 0 ? { $in: userIds } : null
    }

    if (outgoingCompanyName) {
      query.companyName = { $regex: outgoingCompanyName, $options: "i" }
    }

    if (outgoingProduct) {
      query.product = { $regex: outgoingProduct, $options: "i" }
    }

    if (outgoingIsLeadSearch === "true") {
      query.isLeadSearch = true
    } else if (outgoingIsLeadSearch === "false") {
      query.isLeadSearch = { $ne: true }
    }

    if (outgoingLeadFound) {
      query.leadFound = outgoingLeadFound
    }

    if (outgoingCallType) {
      query.outgoingCallType = outgoingCallType
    }

    if (outgoingFeedbackType) {
      query.feedbackType = outgoingFeedbackType
    }
    
    if (inTimeStart || inTimeEnd) {
      const inTimeFilter: Record<string, Date> = {}
      if (inTimeStart) inTimeFilter.$gte = new Date(inTimeStart)
      if (inTimeEnd) inTimeFilter.$lte = new Date(inTimeEnd)
      query.inTime = inTimeFilter
    }
    
    if (outTimeStart || outTimeEnd) {
      const outTimeFilter: Record<string, Date> = {}
      if (outTimeStart) outTimeFilter.$gte = new Date(outTimeStart)
      if (outTimeEnd) outTimeFilter.$lte = new Date(outTimeEnd)
      query.outTime = outTimeFilter
    }
    
    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: "i" } },
        { contactNumber: { $regex: search, $options: "i" } },
        { issue: { $regex: search, $options: "i" } },
        { companyName: { $regex: search, $options: "i" } },
        { contactPersonName: { $regex: search, $options: "i" } },
        { visitorName: { $regex: search, $options: "i" } },
      ]
    }
    
    // Admin gets all calls, non-admin roles get only their own calls
    const selfOnlyRoles = ["frontdesk", "branch_manager", "branch_manager_juniors", "branch_service", "branch_service_juniors", "branch_sales", "branch_sales_juniors", "branch_consumable", "branch_consumable_juniors", "branch_accounts", "branch_accounts_juniors"]
    if (selfOnlyRoles.includes(payload.role)) {
      query.createdBy = new mongoose.Types.ObjectId(payload.userId)
    } else if (userId) {
      query.createdBy = new mongoose.Types.ObjectId(userId)
    }
    
    const calls = await FrontdeskCall.find(query)
      .populate("createdBy", "name email")
      .populate("callTransferTo", "name email")
      .sort({ createdAt: -1 })
    
    return NextResponse.json({ calls })
  } catch (error: any) {
    console.error("Get frontdesk calls error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    await connectDB()
    
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("accessToken")?.value
    
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const payload = await verifyAccessToken(accessToken)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }
    
    const body = await request.json()
    const { id, outTime } = body
    
    if (!id) {
      return NextResponse.json({ error: "Record ID is required" }, { status: 400 })
    }
    
    const updateData: Record<string, unknown> = {}
    if (outTime !== undefined) {
      updateData.outTime = new Date(outTime)
    }
    
    const updated = await FrontdeskCall.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    )
    
    if (!updated) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 })
    }
    
    return NextResponse.json({ message: "Record updated successfully", record: updated })
  } catch (error: any) {
    console.error("Update frontdesk call error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}