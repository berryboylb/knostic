import React, { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/provider/query";
import { useDropzone } from "react-dropzone";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  File,
  CheckCircle,
  AlertTriangle,
  X,
  FileText,
  Database,
} from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";
import { toast } from "sonner";
// import { index } from '../../../../backend/src/controllers/index';

// interface FileWithPreview extends File {
//   preview?: string;
//   id: string;
// }

export function UploadSection() {
  const [files, setFiles] = useState<File[]>([]);
  const navigate = useNavigate();

  const uploadMutation = useMutation({
    mutationFn: async (uploadFiles: { [key: string]: File }) => {
      return api.uploadFiles(uploadFiles);
    },
    onSuccess: (data) => {
      toast.success("Files uploaded successfully!", {
        description: `Uploaded ${
          Object.keys(data).filter((k) => k !== "message").length
        } file(s)`,
      });

      // Invalidate queries to refresh dashboard
      queryClient.invalidateQueries({ queryKey: ["all-data"] });
      queryClient.invalidateQueries({ queryKey: ["validation-status"] });

      // Navigate to results page after successful upload
      navigate("/results");

      // Clear files
      setFiles([]);
    },
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      toast.error("Upload failed", {
        description: error.details || error.message || "Failed to upload files",
      });
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    console.log(">> acceptedFiles", acceptedFiles);
    //   setFiles(acceptedFiles);
    setFiles((prev) => [...prev, ...acceptedFiles]);

    // const newFiles = acceptedFiles.map((file) => ({
    //   ...file,
    //   id: Math.random().toString(36).substr(2, 9),
    // }));
    // console.log(">> newFiles", newFiles);
    // setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles: File[]) => {
      onDrop(acceptedFiles); // your callback
    },
    maxFiles: 2,
    accept: {
      "text/csv": [".csv"], // or "text/csv": [".csv"] as const
    } as const,
    multiple: true,
  });

  const removeFile = (id: number) => {
    setFiles((files) => files.filter((file, index) => index !== id));
  };

  const handleUpload = () => {
    if (files.length === 0) return;

    const uploadFiles: { [key: string]: File } = {};
    files.forEach((file, index) => {
      uploadFiles[`file${index + 1}`] = file;
    });

    uploadMutation.mutate(uploadFiles);
  };

  const getFileIcon = (fileName: string) => {
    const name = fileName?.toLowerCase();

    if (!name) return <File className="h-4 w-4" />;
    if (name.includes("string") || name.includes("prompt")) {
      return <Database className="h-4 w-4" />;
    }
    if (name.includes("classification") || name.includes("class")) {
      return <FileText className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Upload Error */}
      {uploadMutation.isError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {uploadMutation.error?.details ||
              uploadMutation.error?.message ||
              "Upload failed"}
          </AlertDescription>
        </Alert>
      )}

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
          uploadMutation.isPending && "pointer-events-none opacity-50"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
        <div className="space-y-2">
          <p className="text-lg font-medium">
            {isDragActive
              ? "Drop your CSV files here"
              : "Drag & drop CSV files here"}
          </p>
          <p className="text-sm text-muted-foreground">
            Upload your strings and classifications CSV files (up to 2 files)
          </p>
          <Button
            variant="outline"
            size="sm"
            disabled={uploadMutation.isPending}
          >
            Browse Files
          </Button>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium">Selected Files</h4>
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                {getFileIcon(file.name)}
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {/* {(file.size / 1024).toFixed(1)} KB */}
                    {formatBytes(file.size / 1024)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">CSV</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  disabled={uploadMutation.isPending}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Progress */}
      {uploadMutation.isPending && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Uploading files...</span>
            <span className="text-sm text-muted-foreground">Processing</span>
          </div>
          <Progress value={50} className="h-2" />
        </div>
      )}

      {/* Upload Button */}
      {files.length > 0 && !uploadMutation.isPending && (
        <div className="flex justify-end">
          <Button onClick={handleUpload} className="gap-2">
            <Upload className="h-4 w-4" />
            Upload {files.length} File{files.length > 1 ? "s" : ""}
          </Button>
        </div>
      )}

      {/* Success State */}
      {uploadMutation.isSuccess && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Files uploaded successfully! Redirecting to data view...
          </AlertDescription>
        </Alert>
      )}

      {/* Instructions */}
      <div className="text-sm text-muted-foreground space-y-1">
        <p>
          <strong>Expected CSV formats:</strong>
        </p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>
            <strong>Strings CSV:</strong> Tier, Industry, Topic, Subtopic,
            Prefix, Fuzzing-Idx, Prompt, Risks, Keywords
          </li>
          <li>
            <strong>Classifications CSV:</strong> Topic, SubTopic, Industry,
            Classification
          </li>
        </ul>
      </div>
    </div>
  );
}
