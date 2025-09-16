import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UploadSection } from "@/components/upload/UploadSection";
import { Database } from "lucide-react";

export function Dashboard() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Welcome Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <Database className="h-16 w-16 text-primary" />
        </div>
        <h1 className="text-4xl font-bold">CSV Data Manager</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Upload your strings and classifications CSV files to validate data
          integrity and manage your datasets
        </p>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Upload Your CSV Files</CardTitle>
          <CardDescription>
            Select or drag your strings and classifications CSV files to get
            started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UploadSection />
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Expected File Formats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Strings CSV</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Required columns:
            </p>
            <code className="text-xs bg-muted p-2 rounded block">
              Tier, Industry, Topic, Subtopic, Prefix, Fuzzing-Idx, Prompt,
              Risks, Keywords
            </code>
          </div>
          <div>
            <h4 className="font-medium mb-2">Classifications CSV</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Required columns:
            </p>
            <code className="text-xs bg-muted p-2 rounded block">
              Topic, SubTopic, Industry, Classification
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
