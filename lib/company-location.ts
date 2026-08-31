export interface CompanyLocationInput {
  location?: string
  address?: string
  district?: string
  area?: string
  contactPerson?: string
  contactNumber?: string
  contacts?: Array<{ name?: string; phone?: string; email?: string; designation?: string }>
}

export interface NormalizedLocation {
  location: string
  address: string
  district: string
  area: string
  contactPerson: string
  contactNumber: string
  contacts: Array<{ name: string; phone: string; email: string; designation: string }>
}

export function normalizeLocation(loc: CompanyLocationInput): NormalizedLocation {
  const location = (loc.location || "").trim()
  const address = (loc.address || "").trim()
  const district = (loc.district || "").trim()
  const area = (loc.area || "").trim()

  let contacts: Array<{ name: string; phone: string; email: string; designation: string }> = []
  if (Array.isArray(loc.contacts)) {
    contacts = loc.contacts
      .filter((c) => (c.name && c.name.trim()) || (c.phone && c.phone.trim()) || (c.email && c.email.trim()) || (c.designation && c.designation.trim()))
      .map((c) => ({ name: (c.name || "").trim(), phone: (c.phone || "").trim(), email: (c.email || "").trim(), designation: (c.designation || "").trim() }))
  }

  const primaryName = contacts[0]?.name || (loc.contactPerson || "").trim()
  const primaryPhone = contacts[0]?.phone || (loc.contactNumber || "").trim()

  return {
    location: location || area,
    address,
    district,
    area,
    contactPerson: primaryName,
    contactNumber: primaryPhone,
    contacts,
  }
}

export function firstLocationFields(loc: NormalizedLocation) {
  return {
    location: loc.location,
    contactPerson: loc.contactPerson,
    contactNumber: loc.contactNumber,
  }
}
