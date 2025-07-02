"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Play, RotateCcw, AlertCircle, CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface FeatureExtractorProps {
  reviewData: any[]
  onFeaturesExtracted: (features: any[]) => void
  isProcessing: boolean
  setIsProcessing: (processing: boolean) => void
}

export function FeatureExtractor({
  reviewData,
  onFeaturesExtracted,
  isProcessing,
  setIsProcessing,
}: FeatureExtractorProps) {
  const [progress, setProgress] = useState(0)
  const [currentReview, setCurrentReview] = useState(0)
  const [extractedCount, setExtractedCount] = useState(0)
  const [error, setError] = useState("")

  const extractFeatures = async () => {
    if (reviewData.length === 0) {
      setError("Please upload review data first")
      return
    }

    setIsProcessing(true)
    setError("")
    setProgress(0)
    setCurrentReview(0)
    setExtractedCount(0)

    try {
      const features: any[] = []
      const reviewColumn = findReviewColumn(reviewData[0])

      if (!reviewColumn) {
        throw new Error("Could not find review text column")
      }

      for (let i = 0; i < Math.min(reviewData.length, 50); i++) {
        const review = reviewData[i]
        const reviewText = review[reviewColumn]

        if (!reviewText || reviewText.trim().length === 0) continue

        setCurrentReview(i + 1)

        try {
          const response = await fetch("/api/extract-features", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              reviewText,
              reviewIndex: i,
              rating: review.rating || review.score || 5,
            }),
          })

          if (!response.ok) {
            throw new Error(`API request failed: ${response.statusText}`)
          }

          const result = await response.json()

          if (result.features && result.features.length > 0) {
            features.push({
              reviewIndex: i,
              reviewText: reviewText.substring(0, 200) + "...",
              rating: review.rating || review.score || 5,
              features: result.features,
              sentiment: result.sentiment || "neutral",
            })
            setExtractedCount((prev) => prev + 1)
          }
        } catch (err) {
          console.error(`Error processing review ${i}:`, err)
        }

        setProgress(((i + 1) / Math.min(reviewData.length, 50)) * 100)

        // Add small delay to prevent rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      onFeaturesExtracted(features)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to extract features")
    } finally {
      setIsProcessing(false)
    }
  }

  const findReviewColumn = (sampleRow: any): string | null => {
    const keys = Object.keys(sampleRow)
    return (
      keys.find(
        (key) =>
          key.toLowerCase().includes("review") ||
          key.toLowerCase().includes("text") ||
          key.toLowerCase().includes("comment"),
      ) || null
    )
  }

  const resetExtraction = () => {
    setProgress(0)
    setCurrentReview(0)
    setExtractedCount(0)
    setError("")
    onFeaturesExtracted([])
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Feature Extraction Settings
            <Badge variant="outline">FLAN-T5 Model</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="font-medium text-blue-900">Total Reviews</div>
              <div className="text-2xl font-bold text-blue-700">{reviewData.length}</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="font-medium text-green-900">Processing Limit</div>
              <div className="text-2xl font-bold text-green-700">{Math.min(reviewData.length, 50)}</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="font-medium text-purple-900">Features Extracted</div>
              <div className="text-2xl font-bold text-purple-700">{extractedCount}</div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={extractFeatures}
              disabled={isProcessing || reviewData.length === 0}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Start Feature Extraction
            </Button>

            <Button
              variant="outline"
              onClick={resetExtraction}
              disabled={isProcessing}
              className="flex items-center gap-2 bg-transparent"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {isProcessing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>
                  Processing Review {currentReview} of {Math.min(reviewData.length, 50)}
                </span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} className="w-full" />
              <div className="text-xs text-gray-500">Extracting product features and analyzing sentiment...</div>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {extractedCount > 0 && !isProcessing && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Successfully extracted features from {extractedCount} reviews! Switch to the Results tab to view the
            analysis.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
