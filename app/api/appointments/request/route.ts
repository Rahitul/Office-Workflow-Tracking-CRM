import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { connectDB } from "@/lib/db"
import { Appointment } from "@/models/Appointment"
import { AppointmentForm } from "@/models/AppointmentForm"
import { verifyAccessToken } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    await connectDB()
    
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("accessToken")?.value
    
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const payload = await verifyAccessToken(accessToken)
    if (!payload || payload.role !== "user") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    
    const body = await request.json()
    const {
      customerName, industry, industryOther, customerSize, customerHeadOffice,
      iomAccountOwner, accountOwnerDesignation, relationshipStartYear,
      proposedAttendees, decisionMaker, influencers, priorRelationship, priorRelationshipOther,
      totalRevenue, productsSupplied, productsSuppliedOther, contractType,
      totalBusinessValue, currentYearBusiness, currentOutstanding, overdueAmount,
      paymentCycle, creditRisk, creditRiskOther, installedBase, serviceStatus,
      openServiceIssues, escalations, escalationsOther, meetingPurpose,
      expectedOpportunityValue, keyNewSolutions, competingVendors, threatLevel,
      riskFactors, keyTalkingPoints, supportRequired, expectedOutcome,
      informationVerified, declaration, requestedDate, requestedTime, requestedEndTime, requestedLocation
    } = body
    
    const formData = new AppointmentForm({
      customerName,
      industry,
      industryOther,
      customerSize,
      customerHeadOffice,
      iomAccountOwner,
      accountOwnerDesignation,
      relationshipStartYear,
      proposedAttendees,
      decisionMaker,
      influencers,
      priorRelationship,
      priorRelationshipOther,
      totalRevenue,
      productsSupplied,
      productsSuppliedOther,
      contractType,
      totalBusinessValue,
      currentYearBusiness,
      currentOutstanding,
      overdueAmount,
      paymentCycle,
      creditRisk,
      creditRiskOther,
      installedBase,
      serviceStatus,
      openServiceIssues,
      escalations,
      escalationsOther,
      meetingPurpose,
      expectedOpportunityValue,
      keyNewSolutions,
      competingVendors,
      threatLevel,
      riskFactors,
      keyTalkingPoints,
      supportRequired,
      expectedOutcome,
      informationVerified,
      declaration,
      submittedBy: payload.userId
    })
    
    await formData.save()
    
    const appointment = new Appointment({
      customerName: iomAccountOwner || customerName,
      companyName: customerName,
      designation: accountOwnerDesignation || "",
      location: requestedLocation || "",
      date: new Date(requestedDate || new Date()),
      time: requestedTime || "09:00",
      endTime: requestedEndTime || "",
      visitPurpose: meetingPurpose?.join(", ") || "",
      createdBy: payload.userId,
      isRequested: true,
      requestedBy: payload.userId,
      status: "pending",
      formData: formData._id,
    })
    
    await appointment.save()
    
    return NextResponse.json(
      { message: "Appointment request submitted successfully", appointment, formData },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Create appointment request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}