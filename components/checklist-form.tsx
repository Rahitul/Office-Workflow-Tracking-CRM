"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Loader2, Camera, X } from "lucide-react"

interface ChecklistFormProps {
  open: boolean
  onClose: () => void
  taskId: string
  customerName: string
  serviceTaskId: string
  onSuccess: () => void
}

const mfpStatusOptions = [
  { value: "", label: "Select status..." },
  { value: "completed", label: "Completed" },
  { value: "estimate needed", label: "Estimate Needed" },
  { value: "not completed", label: "Not Completed" },
]

export default function ChecklistForm({ open, onClose, taskId, customerName, serviceTaskId, onSuccess }: ChecklistFormProps) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [serialNumber, setSerialNumber] = useState("")
  const [mfpStatus, setMfpStatus] = useState("")
  const [partsProblem, setPartsProblem] = useState("")
  const [remarks, setRemarks] = useState("")
  const [image, setImage] = useState("")
  const [cameraActive, setCameraActive] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (!open) {
      stopCamera()
    }
    return () => { stopCamera() }
  }, [open])

  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
    }
  }, [cameraActive])

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }

  const startCamera = async () => {
    try {
      const constraints: MediaStreamConstraints[] = [
        { video: { facingMode: "environment" }, audio: false },
        { video: { facingMode: "user" }, audio: false },
        { video: true, audio: false },
      ]
      let stream: MediaStream | null = null
      for (const c of constraints) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(c)
          break
        } catch {
          continue
        }
      }
      if (!stream) throw new Error("No camera available")
      streamRef.current = stream
      setCameraActive(true)
    } catch {
      alert("Could not access camera. Please allow camera permission and try again.")
    }
  }

  const capturePhoto = () => {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext("2d")?.drawImage(video, 0, 0)
    setImage(canvas.toDataURL("image/jpeg", 0.8))
    stopCamera()
  }

  const removeImage = () => {
    setImage("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!date || !serialNumber || !mfpStatus) return
    setSubmitting(true)
    try {
      let imageUrl = image
      if (image && image.startsWith("data:")) {
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image }),
          credentials: "include",
        })
        const uploadData = await uploadRes.json()
        if (!uploadData.success) {
          alert(uploadData.error || "Failed to upload image")
          setSubmitting(false)
          return
        }
        imageUrl = uploadData.url
      }

      const payload: Record<string, unknown> = {
        taskId: serviceTaskId,
        date: new Date(date),
        customerName,
        serialNumber,
        mfpStatus,
        remarks,
        image: imageUrl,
      }

      if (mfpStatus === "not completed") {
        payload.partsProblem = partsProblem
      }

      const res = await fetch("/api/checklists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      })

      const data = await res.json()
      if (!data.success) {
        alert(data.error || "Failed to submit checklist")
        setSubmitting(false)
        return
      }

      const statusRes = await fetch(`/api/service-tasks/${serviceTaskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Checklist Submitted" }),
        credentials: "include",
      })

      const statusData = await statusRes.json()
      if (!statusData.success) {
        alert(statusData.error || "Failed to update call/case status")
        setSubmitting(false)
        return
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error submitting checklist:", error)
      alert("Failed to submit checklist")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={`Checklist Form - #${taskId}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="checklist-date">Date</Label>
            <Input id="checklist-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="checklist-customer">Customer Name</Label>
            <Input id="checklist-customer" value={customerName} disabled />
          </div>
          <div>
            <Label htmlFor="serial-number">Serial Number</Label>
            <Input id="serial-number" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} placeholder="Enter serial number" required />
          </div>
        </div>

        <div>
          <Label htmlFor="mfp-status">Machine Status</Label>
          <Select
            id="mfp-status"
            options={mfpStatusOptions}
            value={mfpStatus}
            onChange={(e) => setMfpStatus(e.target.value)}
            required
          />
        </div>

        {mfpStatus === "not completed" && (
          <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4 space-y-4">
            <p className="text-sm font-semibold text-yellow-800">Not Completed Details</p>
            <div>
              <Label htmlFor="not-completed-reason">Reason</Label>
              <Select
                id="not-completed-reason"
                options={[
                  { value: "", label: "Select reason..." },
                  { value: "Parts Needed to Check", label: "Parts Needed to Check" },
                  { value: "Senior Engineer Required", label: "Senior Engineer Required" },
                  { value: "Parts Problem", label: "Parts Problem" },
                ]}
                value={partsProblem}
                onChange={(e) => setPartsProblem(e.target.value)}
              />
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="remarks">Remarks</Label>
          <Textarea id="remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Any additional remarks..." />
        </div>

        <div>
          <Label>Picture</Label>
          <div className="mt-1">
            {image ? (
              <div className="relative inline-block">
                <img src={image} alt="Captured" className="h-40 w-auto rounded-lg object-cover border" />
                <button type="button" onClick={removeImage} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : cameraActive ? (
              <div className="space-y-2">
                <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-lg border bg-black" style={{ maxHeight: "300px" }} />
                <div className="flex gap-2">
                  <Button type="button" size="sm" onClick={capturePhoto}>
                    <Camera className="w-4 h-4 mr-1" />
                    Capture
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={stopCamera}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button type="button" variant="outline" onClick={startCamera} className="w-full h-32 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-gray-400 bg-gray-50">
                <Camera className="h-8 w-8 text-gray-400 mb-1" />
                <span className="text-sm text-gray-500">Capture Photo</span>
              </Button>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={submitting || !date || !serialNumber || !mfpStatus}>
            {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</> : "Submit Checklist"}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
