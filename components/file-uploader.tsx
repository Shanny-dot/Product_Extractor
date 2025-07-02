"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface FileUploaderProps {
  onDataUploaded: (data: any[]) => void
  uploadedData: any[]
}

export function FileUploader({ onDataUploaded, uploadedData }: FileUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const parseCSV = (text: string) => {
    const lines = text.split("\n").filter((line) => line.trim())
    if (lines.length < 2) throw new Error("CSV must have at least a header and one data row")

    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
    const data = lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim().replace(/"/g, ""))
      const row: any = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || ""
      })
      return row
    })

    return data
  }

  const handleFileUpload = useCallback(
    async (file: File) => {
      try {
        setUploadStatus("idle")
        setErrorMessage("")

        if (!file.name.endsWith(".csv")) {
          throw new Error("Please upload a CSV file")
        }

        const text = await file.text()
        const data = parseCSV(text)

        // Validate required columns
        const sampleRow = data[0]
        const hasReviewColumn = Object.keys(sampleRow).some(
          (key) =>
            key.toLowerCase().includes("review") ||
            key.toLowerCase().includes("text") ||
            key.toLowerCase().includes("comment"),
        )

        if (!hasReviewColumn) {
          throw new Error('CSV must contain a column with review text (e.g., "review", "text", "comment")')
        }

        onDataUploaded(data)
        setUploadStatus("success")
      } catch (error) {
        setUploadStatus("error")
        setErrorMessage(error instanceof Error ? error.message : "Failed to upload file")
      }
    },
    [onDataUploaded],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        handleFileUpload(files[0])
      }
    },
    [handleFileUpload],
  )

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  return (
    <div className="space-y-4">
      <Card
        className={`border-2 border-dashed transition-colors ${
          isDragOver
            ? "border-blue-400 bg-blue-50"
            : uploadStatus === "success"
              ? "border-green-400 bg-green-50"
              : "border-gray-300 hover:border-gray-400"
        }`}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragOver(true)
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        <CardContent className="flex flex-col items-center justify-center py-12">
          {uploadStatus === "success" ? (
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
          ) : (
            <Upload className="h-12 w-12 text-gray-400 mb-4" />
          )}

          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">
              {uploadStatus === "success" ? "File Uploaded Successfully!" : "Upload CSV File"}
            </h3>
            <p className="text-gray-600 mb-4">
              {uploadStatus === "success"
                ? `Loaded ${uploadedData.length} reviews`
                : "Drag and drop your CSV file here, or click to browse"}
            </p>

            <input type="file" accept=".csv" onChange={handleFileSelect} className="hidden" id="file-upload" />
            <label htmlFor="file-upload">
              <Button variant="outline" className="cursor-pointer bg-transparent">
                <FileText className="h-4 w-4 mr-2" />
                Choose File
              </Button>
            </label>
          </div>
        </CardContent>
      </Card>

      {uploadStatus === "error" && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {uploadedData.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h4 className="font-semibold mb-2">Data Preview</h4>
            <div className="text-sm text-gray-600 mb-2">
              Showing first 3 rows of {uploadedData.length} total reviews
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {Object.keys(uploadedData[0]).map((header) => (
                      <th key={header} className="text-left p-2 font-medium">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {uploadedData.slice(0, 3).map((row, index) => (
                    <tr key={index} className="border-b">
                      {Object.values(row).map((value: any, cellIndex) => (
                        <td key={cellIndex} className="p-2 max-w-xs truncate">
                          {String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
