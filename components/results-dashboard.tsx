"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, Star, MessageSquare } from "lucide-react"

interface ResultsDashboardProps {
  extractedFeatures: any[]
  reviewData: any[]
}

export function ResultsDashboard({ extractedFeatures, reviewData }: ResultsDashboardProps) {
  const analysis = useMemo(() => {
    if (extractedFeatures.length === 0) return null

    // Aggregate features
    const featureMap = new Map<string, { count: number; totalRating: number; sentiments: string[] }>()

    extractedFeatures.forEach((item) => {
      item.features.forEach((feature: string) => {
        const normalizedFeature = feature.toLowerCase().trim()
        if (!featureMap.has(normalizedFeature)) {
          featureMap.set(normalizedFeature, { count: 0, totalRating: 0, sentiments: [] })
        }
        const current = featureMap.get(normalizedFeature)!
        current.count += 1
        current.totalRating += Number.parseFloat(item.rating) || 5
        current.sentiments.push(item.sentiment)
      })
    })

    // Convert to array and calculate averages
    const features = Array.from(featureMap.entries()).map(([feature, data]) => ({
      feature,
      count: data.count,
      averageRating: data.totalRating / data.count,
      sentiments: data.sentiments,
      positiveRatio: data.sentiments.filter((s) => s === "positive").length / data.sentiments.length,
    }))

    // Sort by frequency
    features.sort((a, b) => b.count - a.count)

    const mostAppreciated = features
      .filter((f) => f.averageRating >= 4)
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, 10)

    const leastAppreciated = features
      .filter((f) => f.averageRating < 3.5)
      .sort((a, b) => a.averageRating - b.averageRating)
      .slice(0, 10)

    const topFeatures = features.slice(0, 15)

    return {
      totalFeatures: features.length,
      totalMentions: features.reduce((sum, f) => sum + f.count, 0),
      mostAppreciated,
      leastAppreciated,
      topFeatures,
    }
  }, [extractedFeatures])

  if (extractedFeatures.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Features Extracted Yet</h3>
          <p className="text-gray-500 text-center">
            Upload review data and run feature extraction to see results here.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Reviews Processed</p>
                <p className="text-2xl font-bold">{extractedFeatures.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Unique Features</p>
                <p className="text-2xl font-bold">{analysis?.totalFeatures || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Mentions</p>
                <p className="text-2xl font-bold">{analysis?.totalMentions || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <TrendingDown className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                <p className="text-2xl font-bold">
                  {extractedFeatures.length > 0
                    ? (
                        extractedFeatures.reduce((sum, item) => sum + Number.parseFloat(item.rating), 0) /
                        extractedFeatures.length
                      ).toFixed(1)
                    : "0.0"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Most Appreciated Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Most Appreciated Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analysis?.mostAppreciated.slice(0, 8).map((feature, index) => (
              <div key={feature.feature} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium capitalize">{feature.feature}</span>
                    <Badge variant="secondary">{feature.count} mentions</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={feature.averageRating * 20} className="flex-1 h-2" />
                    <span className="text-sm font-medium text-green-600">{feature.averageRating.toFixed(1)}/5.0</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Least Appreciated Features */}
      {analysis && analysis.leastAppreciated.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              Areas for Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysis.leastAppreciated.slice(0, 8).map((feature, index) => (
                <div key={feature.feature} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium capitalize">{feature.feature}</span>
                      <Badge variant="destructive">{feature.count} mentions</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={feature.averageRating * 20} className="flex-1 h-2" />
                      <span className="text-sm font-medium text-red-600">{feature.averageRating.toFixed(1)}/5.0</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle>All Extracted Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analysis?.topFeatures.map((feature, index) => (
              <div key={feature.feature} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium capitalize text-sm">{feature.feature}</span>
                  <Badge variant="outline" className="text-xs">
                    {feature.count}x
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={feature.averageRating * 20} className="flex-1 h-1" />
                  <span className="text-xs text-gray-600">{feature.averageRating.toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
