import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "@/services/api";
import { cn, downloadBlob } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Database,
  FileText,
  AlertTriangle,
  CheckCircle,
  Download,
  RefreshCw,
  BarChart3,
  Loader2,
  Eye,
  Edit,
} from "lucide-react";
import type { StringsCSVRow, ClassificationsCSVRow } from "@/types";
import { toast } from "sonner";
import { queryClient } from "@/provider/query";
import { useState } from "react";
import { EditableTable } from "@/components/tables/EditableTable";
export function Results() {
  const [editingTab, setEditingTab] = useState<
    "strings" | "classifications" | null
  >(null);
  const [currentTab, setCurrentTab] = useState("strings");
  const {
    data: allData,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ["all-data"],
    queryFn: api.getAllData,
  });

  const { data: validationStatus } = useQuery({
    queryKey: ["validation-status"],
    queryFn: api.getValidationStatus,
  });

  // Export mutations
  const downloadStringsMutation = useMutation({
    mutationFn: () => api.downloadFile("strings"),
    onSuccess: ({ blob, filename }) => {
      downloadBlob(blob, filename);
      toast.success("Strings CSV downloaded successfully");
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      toast.error("Download failed", {
        description: error.details || "Failed to download strings CSV",
      });
    },
  });

  const downloadClassificationsMutation = useMutation({
    mutationFn: () => api.downloadFile("classifications"),
    onSuccess: ({ blob, filename }) => {
      downloadBlob(blob, filename);
      toast.success("Classifications CSV downloaded successfully");
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      toast.error("Download failed", {
        description: error.details || "Failed to download classifications CSV",
      });
    },
  });

  const downloadBothMutation = useMutation({
    mutationFn: async () => {
      const results = await Promise.allSettled([
        api.downloadFile("strings"),
        api.downloadFile("classifications"),
      ]);
      return results;
    },
    onSuccess: (results) => {
      let successCount = 0;
      results.forEach((result) => {
        if (result.status === "fulfilled") {
          downloadBlob(result.value.blob, result.value.filename);
          successCount++;
        }
      });
      toast.success(`Downloaded ${successCount} file(s) successfully`);
    },
    onError: () => {
      toast.error("Download failed", {
        description: "Failed to download files",
      });
    },
  });

  const updateClassificationsMutation = useMutation({
    mutationFn: (data: ClassificationsCSVRow[]) =>
      api.updateData("classifications", data, false),
    onSuccess: () => {
      toast.success("Classifications data updated successfully");
      queryClient.invalidateQueries({ queryKey: ["all-data"] });
      queryClient.invalidateQueries({ queryKey: ["validation-status"] });
      setEditingTab(null);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      toast.error("Update failed", {
        description: error.details || "Failed to update classifications data",
      });
    },
  });

  // Update mutations
  const updateStringsMutation = useMutation({
    mutationFn: (data: StringsCSVRow[]) =>
      api.updateData("strings", data, true), // Enable cross-reference validation
    onSuccess: () => {
      toast.success("Strings data updated successfully");
      queryClient.invalidateQueries({ queryKey: ["all-data"] });
      queryClient.invalidateQueries({ queryKey: ["validation-status"] });
      setEditingTab(null);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      toast.error("Update failed", {
        description: error.details || "Failed to update strings data",
      });
    },
  });

  if (
    error ||
    (!isLoading &&
      !allData?.responseObject?.strings &&
      !allData?.responseObject?.classifications)
  ) {
    return (
      <div className="space-y-6">
        {JSON.stringify(allData, null, 2)}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Upload
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Results</h1>
            <p className="text-muted-foreground">View your uploaded data</p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No data found. Please upload your CSV files first.
          </AlertDescription>
        </Alert>

        <div className="flex justify-center">
          <Button asChild>
            <Link to="/">
              <FileText className="h-4 w-4 mr-2" />
              Upload Files
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const stringsData = allData?.responseObject?.strings?.data as
    | StringsCSVRow[]
    | undefined;
  const classificationsData = allData?.responseObject?.classifications?.data as
    | ClassificationsCSVRow[]
    | undefined;

  return (
    <div className="space-y-6  lg:my-20 container mx-auto p-5 xl:p-0">
      {/* Header */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <Button variant="outline" size="sm" asChild className="w-fit">
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Back to Upload</span>
              <span className="sm:hidden">Back</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Data Results</h1>
            <p className="text-sm text-muted-foreground sm:text-base">
              Your uploaded CSV data
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => await refetch()}
            className="w-full sm:w-auto"
          >
            <RefreshCw
              className={cn(
                "h-4 w-4 mr-2",
                isLoading || (isFetching && "animate-spin")
              )}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rows</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {(
                  (allData?.responseObject?.strings?.rowCount || 0) +
                  (allData?.responseObject?.classifications?.rowCount || 0)
                ).toLocaleString()}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Across all datasets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Strings</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {(
                  allData?.responseObject?.strings?.rowCount || 0
                ).toLocaleString()}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {allData?.responseObject?.strings?.originalFilename ||
                "Not loaded"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Classifications
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {(
                  allData?.responseObject?.classifications?.rowCount || 0
                ).toLocaleString()}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {allData?.responseObject?.classifications?.originalFilename ||
                "Not loaded"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Validation</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <Badge
                variant={
                  validationStatus?.canValidate ? "default" : "secondary"
                }
              >
                {validationStatus?.canValidate ? "Ready" : "Pending"}
              </Badge>
            )}
            <p className="text-xs text-muted-foreground">
              Cross-reference status
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Data Tables */}

      {(allData?.responseObject?.strings ||
        allData?.responseObject?.classifications) && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Data Editing:</strong> Click "Edit Mode" to modify data
            directly in the tables. Changes to strings data will be validated
            against classifications to ensure data integrity.
          </AlertDescription>
        </Alert>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Uploaded Data</CardTitle>
          <CardDescription>
            View your strings and classifications datasets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            defaultValue="strings"
            className="w-full"
            onValueChange={setCurrentTab}
          >
            <TabsList className="lg:grid w-full lg:grid-cols-2 overflow-x-scroll">
              <TabsTrigger value="strings" disabled={!stringsData}>
                Strings Data ({allData?.responseObject?.strings?.rowCount || 0})
              </TabsTrigger>
              <TabsTrigger
                value="classifications"
                disabled={!classificationsData}
              >
                Classifications (
                {allData?.responseObject?.classifications?.rowCount || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="strings"
              forceMount
              className="space-y-4"
              hidden={currentTab !== "strings"}
            >
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : stringsData ? (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Strings Dataset</h3>
                    <Button
                      onClick={() =>
                        setEditingTab(
                          editingTab === "strings" ? null : "strings"
                        )
                      }
                      size="sm"
                      variant={editingTab === "strings" ? "default" : "outline"}
                    >
                      {editingTab === "strings" ? (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          View Mode
                        </>
                      ) : (
                        <>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Mode
                        </>
                      )}
                    </Button>
                  </div>
                  {editingTab === "strings" ? (
                    <EditableTable
                      data={stringsData}
                      type="strings"
                      validationData={classificationsData}
                      onSave={(data) =>
                        updateStringsMutation.mutateAsync(
                          data as StringsCSVRow[]
                        )
                      }
                      onCancel={() => setEditingTab(null)}
                      isLoading={updateStringsMutation.isPending}
                    />
                  ) : (
                    <div className="border rounded-lg overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">#</TableHead>
                            <TableHead>Tier</TableHead>
                            <TableHead>Industry</TableHead>
                            <TableHead>Topic</TableHead>
                            <TableHead>Subtopic</TableHead>
                            <TableHead>Prefix</TableHead>
                            <TableHead>Fuzzing-Idx</TableHead>
                            <TableHead className="max-w-xs">Prompt</TableHead>
                            <TableHead>Risks</TableHead>
                            <TableHead>Keywords</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {stringsData.map((row, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">
                                {index + 1}
                              </TableCell>
                              <TableCell>{row.Tier}</TableCell>
                              <TableCell>{row.Industry}</TableCell>
                              <TableCell>{row.Topic}</TableCell>
                              <TableCell>{row.Subtopic}</TableCell>
                              <TableCell>{row.Prefix}</TableCell>
                              <TableCell>{row["Fuzzing-Idx"]}</TableCell>
                              <TableCell className="max-w-xs">
                                <div className="truncate" title={row.Prompt}>
                                  {row.Prompt}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    row?.Risks?.toLowerCase() === "low"
                                      ? "default"
                                      : row?.Risks?.toLowerCase() === "medium"
                                      ? "secondary"
                                      : "destructive"
                                  }
                                >
                                  {row.Risks}
                                </Badge>
                              </TableCell>
                              <TableCell className="max-w-xs">
                                <div className="truncate" title={row.Keywords}>
                                  {row.Keywords}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No strings data uploaded
                </div>
              )}
            </TabsContent>

            <TabsContent
              value="classifications"
              forceMount
              className="space-y-4"
              hidden={currentTab !== "classifications"}
            >
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : classificationsData ? (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Classifications Dataset</h3>
                    <Button
                      onClick={() =>
                        setEditingTab(
                          editingTab === "classifications"
                            ? null
                            : "classifications"
                        )
                      }
                      size="sm"
                      variant={
                        editingTab === "classifications" ? "default" : "outline"
                      }
                    >
                      {editingTab === "classifications" ? (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          View Mode
                        </>
                      ) : (
                        <>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Mode
                        </>
                      )}
                    </Button>
                  </div>
                  {editingTab === "classifications" ? (
                    <EditableTable
                      data={classificationsData}
                      type="classifications"
                      onSave={(data) =>
                        updateClassificationsMutation.mutateAsync(
                          data as ClassificationsCSVRow[]
                        )
                      }
                      onCancel={() => setEditingTab(null)}
                      isLoading={updateClassificationsMutation.isPending}
                    />
                  ) : (
                    <div className="border rounded-lg overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">#</TableHead>
                            <TableHead>Topic</TableHead>
                            <TableHead>SubTopic</TableHead>
                            <TableHead>Industry</TableHead>
                            <TableHead>Classification</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {classificationsData.map((row, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">
                                {index + 1}
                              </TableCell>
                              <TableCell className="font-medium">
                                {row.Topic}
                              </TableCell>
                              <TableCell>{row.SubTopic}</TableCell>
                              <TableCell>{row.Industry}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    row?.Classification?.toLowerCase()?.includes(
                                      "safe"
                                    )
                                      ? "default"
                                      : row?.Classification?.toLowerCase()?.includes(
                                          "medium"
                                        )
                                      ? "secondary"
                                      : row?.Classification?.toLowerCase()?.includes(
                                          "high"
                                        ) ||
                                        row?.Classification?.toLowerCase()?.includes(
                                          "restricted"
                                        )
                                      ? "destructive"
                                      : "outline"
                                  }
                                >
                                  {row.Classification}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No classifications data uploaded
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Export Section */}
      {(allData?.responseObject?.strings ||
        allData?.responseObject?.classifications) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Data
            </CardTitle>
            <CardDescription>Download your processed CSV files</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Download Strings */}
              {allData?.responseObject?.strings && (
                <div className="space-y-2">
                  <h4 className="font-medium">Strings Data</h4>
                  <p className="text-sm text-muted-foreground">
                    {allData?.responseObject?.strings.rowCount} rows •{" "}
                    {allData?.responseObject?.strings.originalFilename}
                  </p>
                  <Button
                    onClick={() => downloadStringsMutation.mutate()}
                    disabled={downloadStringsMutation.isPending}
                    className="w-full"
                    variant="outline"
                  >
                    {downloadStringsMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Download Strings
                  </Button>
                </div>
              )}

              {/* Download Classifications */}
              {allData?.responseObject?.classifications && (
                <div className="space-y-2">
                  <h4 className="font-medium">Classifications Data</h4>
                  <p className="text-sm text-muted-foreground">
                    {allData?.responseObject?.classifications.rowCount} rows •{" "}
                    {allData?.responseObject?.classifications.originalFilename}
                  </p>
                  <Button
                    onClick={() => downloadClassificationsMutation.mutate()}
                    disabled={downloadClassificationsMutation.isPending}
                    className="w-full"
                    variant="outline"
                  >
                    {downloadClassificationsMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Download Classifications
                  </Button>
                </div>
              )}

              {/* Download Both */}
              {allData?.responseObject?.strings &&
                allData?.responseObject?.classifications && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Download All</h4>
                    <p className="text-sm text-muted-foreground">
                      {allData?.responseObject?.strings.rowCount +
                        allData?.responseObject?.classifications.rowCount}{" "}
                      total rows
                    </p>
                    <Button
                      onClick={() => downloadBothMutation.mutate()}
                      disabled={downloadBothMutation.isPending}
                      className="w-full"
                    >
                      {downloadBothMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      Download Both Files
                    </Button>
                  </div>
                )}
            </div>

            {/* Export Options */}
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-medium mb-3">Export Options</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">File Format</p>
                  <p className="text-muted-foreground">
                    CSV files with original headers and data
                  </p>
                </div>
                <div>
                  <p className="font-medium">File Names</p>
                  <p className="text-muted-foreground">
                    Original filename with timestamp
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
