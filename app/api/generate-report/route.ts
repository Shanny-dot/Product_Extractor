import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { extractedFeatures, totalReviews } = await request.json()

    if (!extractedFeatures || extractedFeatures.length === 0) {
      return NextResponse.json({ error: "No extracted features provided" }, { status: 400 })
    }

    const report = generateAnalysisReport(extractedFeatures, totalReviews)

    return NextResponse.json({ report })
  } catch (error) {
    console.error("Report generation error:", error)
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 })
  }
}

function generateAnalysisReport(extractedFeatures: any[], totalReviews: number): string {
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

  // Convert to array and calculate metrics
  const features = Array.from(featureMap.entries()).map(([feature, data]) => ({
    feature,
    count: data.count,
    averageRating: data.totalRating / data.count,
    sentiments: data.sentiments,
    positiveRatio: data.sentiments.filter((s) => s === "positive").length / data.sentiments.length,
    negativeRatio: data.sentiments.filter((s) => s === "negative").length / data.sentiments.length,
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

  const overallRating =
    extractedFeatures.reduce((sum, item) => sum + Number.parseFloat(item.rating), 0) / extractedFeatures.length

  // Generate comprehensive report
  const report = `
PRODUCT FEATURE ANALYSIS REPORT
Generated on: ${new Date().toLocaleDateString()}

EXECUTIVE SUMMARY
================
• Total Reviews Analyzed: ${extractedFeatures.length} out of ${totalReviews}
• Unique Features Identified: ${features.length}
• Total Feature Mentions: ${features.reduce((sum, f) => sum + f.count, 0)}
• Overall Average Rating: ${overallRating.toFixed(2)}/5.0

KEY FINDINGS
============

MOST APPRECIATED FEATURES (Strengths to Maintain)
${
  mostAppreciated.length > 0
    ? mostAppreciated
        .map(
          (f, i) =>
            `${i + 1}. ${f.feature.toUpperCase()}
     • Average Rating: ${f.averageRating.toFixed(2)}/5.0
     • Mentioned in ${f.count} reviews (${((f.count / extractedFeatures.length) * 100).toFixed(1)}%)
     • Positive Sentiment: ${(f.positiveRatio * 100).toFixed(1)}%`,
        )
        .join("\n\n")
    : "No highly rated features identified."
}

AREAS FOR IMPROVEMENT (Priority Focus Areas)
${
  leastAppreciated.length > 0
    ? leastAppreciated
        .map(
          (f, i) =>
            `${i + 1}. ${f.feature.toUpperCase()}
     • Average Rating: ${f.averageRating.toFixed(2)}/5.0
     • Mentioned in ${f.count} reviews (${((f.count / extractedFeatures.length) * 100).toFixed(1)}%)
     • Negative Sentiment: ${(f.negativeRatio * 100).toFixed(1)}%`,
        )
        .join("\n\n")
    : "No significant areas for improvement identified."
}

DETAILED FEATURE BREAKDOWN
==========================
${features
  .slice(0, 20)
  .map(
    (f, i) =>
      `${i + 1}. ${f.feature}
     Mentions: ${f.count} | Avg Rating: ${f.averageRating.toFixed(2)} | Positive: ${(f.positiveRatio * 100).toFixed(1)}%`,
  )
  .join("\n")}

RECOMMENDATIONS
===============
${generateRecommendations(mostAppreciated, leastAppreciated, features)}

METHODOLOGY
===========
This analysis was performed using AI-powered feature extraction on customer reviews.
Features were identified using natural language processing techniques and sentiment analysis.
Ratings and sentiment scores were calculated based on review text and numerical ratings.

---
Report generated by Product Feature Extractor v1.0
  `.trim()

  return report
}

function generateRecommendations(mostAppreciated: any[], leastAppreciated: any[], allFeatures: any[]): string {
  const recommendations = []

  if (mostAppreciated.length > 0) {
    recommendations.push(
      `1. LEVERAGE STRENGTHS: Continue to emphasize and market your top-performing features: ${mostAppreciated
        .slice(0, 3)
        .map((f) => f.feature)
        .join(", ")}.`,
    )
  }

  if (leastAppreciated.length > 0) {
    recommendations.push(
      `2. IMMEDIATE IMPROVEMENTS: Focus development resources on addressing: ${leastAppreciated
        .slice(0, 3)
        .map((f) => f.feature)
        .join(", ")}.`,
    )
  }

  const highVolumeFeatures = allFeatures.filter((f) => f.count >= 5).slice(0, 5)
  if (highVolumeFeatures.length > 0) {
    recommendations.push(
      `3. MONITOR KEY FEATURES: Pay close attention to frequently mentioned features: ${highVolumeFeatures.map((f) => f.feature).join(", ")}.`,
    )
  }

  const mixedSentimentFeatures = allFeatures.filter((f) => f.positiveRatio > 0.3 && f.positiveRatio < 0.7)
  if (mixedSentimentFeatures.length > 0) {
    recommendations.push(
      `4. INVESTIGATE MIXED FEEDBACK: Features with polarized opinions need deeper analysis: ${mixedSentimentFeatures
        .slice(0, 3)
        .map((f) => f.feature)
        .join(", ")}.`,
    )
  }

  recommendations.push(
    "5. CONTINUOUS MONITORING: Implement regular review analysis to track feature performance over time.",
  )

  return recommendations.join("\n\n")
}
