"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Download, FileText, BarChart } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ReportGeneratorProps {
  extractedFeatures: any[]
  reviewData: any[]
}

export function ReportGenerator({ extractedFeatures, reviewData }: ReportGeneratorProps) {
  const [reportContent, setReportContent] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  const generateReport = async () => {
    if (extractedFeatures.length === 0) return

    setIsGenerating(true)

    try {
      const response = await fetch("/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          extractedFeatures,
          totalReviews: reviewData.length,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate report")
      }

      const result = await response.json()
      setReportContent(result.report)
    } catch (error) {
      console.error("Error generating report:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadReport = () => {
    if (!reportContent) return

    const blob = new Blob([reportContent], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `product-feature-analysis-${new Date().toISOString().split("T")[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadCSV = () => {
    if (extractedFeatures.length === 0) return

    // Aggregate features for CSV export
    const featureMap = new Map()
    extractedFeatures.forEach((item) => {
      item.features.forEach((feature: string) => {
        const key = feature.toLowerCase().trim()
        if (!featureMap.has(key)) {
          featureMap.set(key, { feature: key, count: 0, totalRating: 0, mentions: [] })
        }
        const current = featureMap.get(key)
        current.count += 1
        current.totalRating += Number.parseFloat(item.rating) || 5
        current.mentions.push(item.reviewText.substring(0, 100))
      })
    })

    const csvData = Array.from(featureMap.values()).map((item) => ({
      feature: item.feature,
      mention_count: item.count,
      average_rating: (item.totalRating / item.count).toFixed(2),
      sample_mention: item.mentions[0],
    }))

    const headers = Object.keys(csvData[0])
    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => headers.map((header) => `"${row[header as keyof typeof row]}"`).join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `extracted-features-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (extractedFeatures.length === 0) {
    return (
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>Extract features from reviews first to generate reports.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button onClick={generateReport} disabled={isGenerating} className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          {isGenerating ? "Generating..." : "Generate AI Report"}
        </Button>

        <Button variant="outline" onClick={downloadCSV} className="flex items-center gap-2 bg-transparent">
          <BarChart className="h-4 w-4" />
          Download CSV Data
        </Button>

        <Button
          variant="outline"
          onClick={downloadReport}
          disabled={!reportContent}
          className="flex items-center gap-2 bg-transparent"
        >
          <Download className="h-4 w-4" />
          Download Report
        </Button>
      </div>

      {reportContent && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Analysis Report</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={reportContent}
              onChange={(e) => setReportContent(e.target.value)}
              className="min-h-[400px] font-mono text-sm"
              placeholder="Generated report will appear here..."
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Quick Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{extractedFeatures.length}</div>
              <div className="text-sm text-blue-800">Reviews Processed</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {new Set(extractedFeatures.flatMap((item) => item.features)).size}
              </div>
              <div className="text-sm text-green-800">Unique Features</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {extractedFeatures.reduce((sum, item) => sum + item.features.length, 0)}
              </div>
              <div className="text-sm text-purple-800">Total Mentions</div>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {(
                  extractedFeatures.reduce((sum, item) => sum + Number.parseFloat(item.rating), 0) /
                  extractedFeatures.length
                ).toFixed(1)}
              </div>
              <div className="text-sm text-orange-800">Avg Rating</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
