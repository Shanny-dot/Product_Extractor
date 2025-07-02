import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { reviewText, reviewIndex, rating } = await request.json()

    if (!reviewText) {
      return NextResponse.json({ error: "Review text is required" }, { status: 400 })
    }

    // Simulate feature extraction using prompt-based approach
    // In a real implementation, this would call FLAN-T5 or similar model
    const features = await extractFeaturesFromText(reviewText)
    const sentiment = await analyzeSentiment(reviewText, rating)

    return NextResponse.json({
      features,
      sentiment,
      reviewIndex,
    })
  } catch (error) {
    console.error("Feature extraction error:", error)
    return NextResponse.json({ error: "Failed to extract features" }, { status: 500 })
  }
}

async function extractFeaturesFromText(text: string): Promise<string[]> {
  // Common product features to look for
  const featurePatterns = [
    // Electronics
    /\b(battery|battery life|power|charging)\b/gi,
    /\b(camera|photo|picture|image quality)\b/gi,
    /\b(screen|display|monitor)\b/gi,
    /\b(sound|audio|speaker|music)\b/gi,
    /\b(design|look|appearance|style)\b/gi,
    /\b(performance|speed|fast|slow)\b/gi,
    /\b(price|cost|value|expensive|cheap)\b/gi,
    /\b(size|weight|portable)\b/gi,
    /\b(durability|build quality|sturdy)\b/gi,
    /\b(user interface|UI|ease of use|usability)\b/gi,

    // General product features
    /\b(quality|material|construction)\b/gi,
    /\b(comfort|comfortable|ergonomic)\b/gi,
    /\b(delivery|shipping|packaging)\b/gi,
    /\b(customer service|support)\b/gi,
    /\b(warranty|guarantee)\b/gi,
  ]

  const extractedFeatures: string[] = []

  featurePatterns.forEach((pattern) => {
    const matches = text.match(pattern)
    if (matches) {
      matches.forEach((match) => {
        const normalized = normalizeFeature(match.toLowerCase())
        if (normalized && !extractedFeatures.includes(normalized)) {
          extractedFeatures.push(normalized)
        }
      })
    }
  })

  // Extract noun phrases that might be features
  const words = text.toLowerCase().split(/\s+/)
  const productTerms = ["phone", "laptop", "camera", "headphones", "watch", "tablet", "device", "product"]

  for (let i = 0; i < words.length - 1; i++) {
    const bigram = `${words[i]} ${words[i + 1]}`
    if (
      productTerms.some((term) => bigram.includes(term)) ||
      bigram.match(/\b(good|bad|great|poor|excellent|terrible)\s+\w+/)
    ) {
      const feature = bigram.replace(/\b(good|bad|great|poor|excellent|terrible)\s+/, "")
      const normalized = normalizeFeature(feature)
      if (normalized && normalized.length > 2 && !extractedFeatures.includes(normalized)) {
        extractedFeatures.push(normalized)
      }
    }
  }

  return extractedFeatures.slice(0, 5) // Limit to top 5 features per review
}

function normalizeFeature(feature: string): string {
  const featureMap: { [key: string]: string } = {
    battery: "battery life",
    power: "battery life",
    charging: "battery life",
    camera: "camera quality",
    photo: "camera quality",
    picture: "camera quality",
    screen: "display",
    monitor: "display",
    sound: "audio quality",
    audio: "audio quality",
    speaker: "audio quality",
    music: "audio quality",
    look: "design",
    appearance: "design",
    style: "design",
    speed: "performance",
    fast: "performance",
    slow: "performance",
    cost: "price",
    expensive: "price",
    cheap: "price",
    value: "price",
    portable: "portability",
    weight: "portability",
    sturdy: "build quality",
    construction: "build quality",
    material: "build quality",
    comfortable: "comfort",
    ergonomic: "comfort",
    shipping: "delivery",
    packaging: "delivery",
    support: "customer service",
    guarantee: "warranty",
  }

  return featureMap[feature] || feature
}

async function analyzeSentiment(text: string, rating: number): Promise<string> {
  // Simple sentiment analysis based on rating and keywords
  const positiveWords = ["good", "great", "excellent", "amazing", "love", "perfect", "awesome", "fantastic"]
  const negativeWords = ["bad", "terrible", "awful", "hate", "worst", "horrible", "disappointing", "poor"]

  const lowerText = text.toLowerCase()
  const positiveCount = positiveWords.filter((word) => lowerText.includes(word)).length
  const negativeCount = negativeWords.filter((word) => lowerText.includes(word)).length

  if (rating >= 4 || positiveCount > negativeCount) {
    return "positive"
  } else if (rating <= 2 || negativeCount > positiveCount) {
    return "negative"
  } else {
    return "neutral"
  }
}
