"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, BarChart3, FileText, TrendingUp } from "lucide-react"
import { FileUploader } from "@/components/file-uploader"
import { FeatureExtractor } from "@/components/feature-extractor"
import { ResultsDashboard } from "@/components/results-dashboard"
import { ReportGenerator } from "@/components/report-generator"

export default function ProductFeatureExtractorPage() {
  const [uploadedData, setUploadedData] = useState<any[]>([])
  const [extractedFeatures, setExtractedFeatures] = useState<any[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Product Feature Extractor</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Automatically extract and analyze product features from customer reviews to understand what customers
            appreciate most and least about your products.
          </p>
        </div>

        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Data
            </TabsTrigger>
            <TabsTrigger value="extract" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Extract Features
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              View Results
            </TabsTrigger>
            <TabsTrigger value="report" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Generate Report
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <Card>
              <CardHeader>
                <CardTitle>Upload Product Reviews Dataset</CardTitle>
                <CardDescription>
                  Upload a CSV file containing product reviews. The file should have columns for review text and
                  ratings.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUploader onDataUploaded={setUploadedData} uploadedData={uploadedData} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="extract">
            <Card>
              <CardHeader>
                <CardTitle>Feature Extraction</CardTitle>
                <CardDescription>Process reviews to extract product features and analyze sentiment.</CardDescription>
              </CardHeader>
              <CardContent>
                <FeatureExtractor
                  reviewData={uploadedData}
                  onFeaturesExtracted={setExtractedFeatures}
                  isProcessing={isProcessing}
                  setIsProcessing={setIsProcessing}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results">
            <ResultsDashboard extractedFeatures={extractedFeatures} reviewData={uploadedData} />
          </TabsContent>

          <TabsContent value="report">
            <Card>
              <CardHeader>
                <CardTitle>Generate Comprehensive Report</CardTitle>
                <CardDescription>Create detailed reports and export analysis results.</CardDescription>
              </CardHeader>
              <CardContent>
                <ReportGenerator extractedFeatures={extractedFeatures} reviewData={uploadedData} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
