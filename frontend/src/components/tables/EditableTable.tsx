import React, { useState, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StringsCSVRow, ClassificationsCSVRow } from "@/types";

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface EditableTableProps {
  data: StringsCSVRow[] | ClassificationsCSVRow[];
  type: "strings" | "classifications";
  validationData?: ClassificationsCSVRow[]; // For cross-reference validation
  onSave: (data: StringsCSVRow[] | ClassificationsCSVRow[]) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function EditableTable({
  data,
  type,
  validationData,
  onSave,
  onCancel,
  isLoading = false,
}: EditableTableProps) {
  const [editedData, setEditedData] = useState(data);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );
  const [hasChanges, setHasChanges] = useState(false);

  // Validate strings against classifications
  const validateStringsData = useCallback(
    (stringsData: StringsCSVRow[]) => {
      if (type !== "strings" || !validationData) return [];

      const errors: ValidationError[] = [];
      const validCombinations = new Set(
        validationData.map(
          (row) =>
            `${row.Topic.toLowerCase().trim()}|${row.SubTopic.toLowerCase().trim()}|${row.Industry.toLowerCase().trim()}`
        )
      );

      stringsData.forEach((row, index) => {
        const combination = `${row.Topic.toLowerCase().trim()}|${row.Subtopic.toLowerCase().trim()}|${row.Industry.toLowerCase().trim()}`;

        if (!validCombinations.has(combination)) {
          errors.push({
            row: index,
            field: "combination",
            message: `Topic "${row.Topic}" + Subtopic "${row.Subtopic}" + Industry "${row.Industry}" not found in classifications`,
          });
        }

        // Required field validation
        if (!row.Tier?.toString().trim()) {
          errors.push({
            row: index,
            field: "Tier",
            message: "Tier is required",
          });
        }
        if (!row.Topic?.toString().trim()) {
          errors.push({
            row: index,
            field: "Topic",
            message: "Topic is required",
          });
        }
        if (!row.Industry?.toString().trim()) {
          errors.push({
            row: index,
            field: "Industry",
            message: "Industry is required",
          });
        }
        if (!row.Subtopic?.toString().trim()) {
          errors.push({
            row: index,
            field: "Subtopic",
            message: "Subtopic is required",
          });
        }
      });

      return errors;
    },
    [type, validationData]
  );

  // Validate classifications data
  const validateClassificationsData = useCallback(
    (classificationsData: ClassificationsCSVRow[]) => {
      if (type !== "classifications") return [];

      const errors: ValidationError[] = [];

      classificationsData.forEach((row, index) => {
        if (!row.Topic?.toString().trim()) {
          errors.push({
            row: index,
            field: "Topic",
            message: "Topic is required",
          });
        }
        if (!row.SubTopic?.toString().trim()) {
          errors.push({
            row: index,
            field: "SubTopic",
            message: "SubTopic is required",
          });
        }
        if (!row.Industry?.toString().trim()) {
          errors.push({
            row: index,
            field: "Industry",
            message: "Industry is required",
          });
        }
        if (!row.Classification?.toString().trim()) {
          errors.push({
            row: index,
            field: "Classification",
            message: "Classification is required",
          });
        }
      });

      return errors;
    },
    [type]
  );

  // Update validation when data changes
  React.useEffect(() => {
    if (type === "strings") {
      const errors = validateStringsData(editedData as StringsCSVRow[]);
      setValidationErrors(errors);
    } else {
      const errors = validateClassificationsData(
        editedData as ClassificationsCSVRow[]
      );
      setValidationErrors(errors);
    }
  }, [editedData, validateStringsData, validateClassificationsData, type]);

  const updateCell = (rowIndex: number, field: string, value: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setEditedData((prev: any) => {
      const updated = [...prev];
      updated[rowIndex] = { ...updated[rowIndex], [field]: value };
      return updated;
    });
    setHasChanges(true);
  };

  const addRow = () => {
    const newRow =
      type === "strings"
        ? ({
            Tier: "",
            Industry: "",
            Topic: "",
            Subtopic: "",
            Prefix: "",
            "Fuzzing-Idx": "",
            Prompt: "",
            Risks: "",
            Keywords: "",
          } as StringsCSVRow)
        : ({
            Topic: "",
            SubTopic: "",
            Industry: "",
            Classification: "",
          } as ClassificationsCSVRow);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setEditedData((prev: any) => [...prev, newRow]);
    setHasChanges(true);
  };

  const deleteRow = (rowIndex: number) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setEditedData((prev: any) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prev.filter((_, index: any) => index !== rowIndex)
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (validationErrors.length > 0) {
      return; // Prevent saving with validation errors
    }
    await onSave(editedData);
    setHasChanges(false);
  };

  const handleCancel = () => {
    setEditedData(data);
    setValidationErrors([]);
    setHasChanges(false);
    onCancel();
  };

  const getRowErrors = (rowIndex: number) => {
    return validationErrors.filter((error) => error.row === rowIndex);
  };

  const hasRowErrors = (rowIndex: number) => {
    return getRowErrors(rowIndex).length > 0;
  };

  const getFieldError = (rowIndex: number, field: string) => {
    return validationErrors.find(
      (error) => error.row === rowIndex && error.field === field
    );
  };

  if (type === "strings") {
    return (
      <div className="space-y-4">
        {/* Action Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button onClick={addRow} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Row
            </Button>
            {validationErrors.length > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {validationErrors.length} Error
                {validationErrors.length > 1 ? "s" : ""}
              </Badge>
            )}
          </div>

          {hasChanges && (
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSave}
                size="sm"
                disabled={validationErrors.length > 0 || isLoading}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
              <Button onClick={handleCancel} size="sm" variant="outline">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </div>

        {/* Validation Summary */}
        {validationErrors.length > 0 && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <h4 className="font-medium text-destructive mb-2">
              Validation Errors
            </h4>
            <ul className="text-sm space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-destructive">
                  Row {error.row + 1}: {error.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Strings Table */}
        <div className="border rounded-lg overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Tier*</TableHead>
                <TableHead>Industry*</TableHead>
                <TableHead>Topic*</TableHead>
                <TableHead>Subtopic*</TableHead>
                <TableHead>Prefix</TableHead>
                <TableHead>Fuzzing-Idx</TableHead>
                <TableHead className="min-w-xs">Prompt</TableHead>
                <TableHead>Risks</TableHead>
                <TableHead>Keywords</TableHead>
                <TableHead className="w-16">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(editedData as StringsCSVRow[]).map((row, index) => {
                const rowErrors = hasRowErrors(index);
                return (
                  <TableRow
                    key={index}
                    className={cn(
                      rowErrors && "bg-destructive/5 border-destructive/20",
                      "hover:bg-grey"
                    )}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {index + 1}
                        {rowErrors && (
                          <AlertTriangle className="h-3 w-3 text-destructive" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={row.Tier}
                        onChange={(e) =>
                          updateCell(index, "Tier", e.target.value)
                        }
                        className={cn(
                          "h-8",
                          getFieldError(index, "Tier") &&
                            "border-destructive focus:border-destructive"
                        )}
                        placeholder="Tier"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={row.Industry}
                        onChange={(e) =>
                          updateCell(index, "Industry", e.target.value)
                        }
                        className={cn(
                          "h-8",
                          getFieldError(index, "Industry") &&
                            "border-destructive focus:border-destructive"
                        )}
                        placeholder="Industry"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={row.Topic}
                        onChange={(e) =>
                          updateCell(index, "Topic", e.target.value)
                        }
                        className={cn(
                          "h-8",
                          getFieldError(index, "Topic") &&
                            "border-destructive focus:border-destructive"
                        )}
                        placeholder="Topic"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={row.Subtopic}
                        onChange={(e) =>
                          updateCell(index, "Subtopic", e.target.value)
                        }
                        className={cn(
                          "h-8",
                          getFieldError(index, "Subtopic") &&
                            "border-destructive focus:border-destructive"
                        )}
                        placeholder="Subtopic"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={row.Prefix}
                        onChange={(e) =>
                          updateCell(index, "Prefix", e.target.value)
                        }
                        className="h-8"
                        placeholder="Prefix"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={row["Fuzzing-Idx"]}
                        onChange={(e) =>
                          updateCell(index, "Fuzzing-Idx", e.target.value)
                        }
                        className="h-8"
                        placeholder="Index"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={row.Prompt}
                        onChange={(e) =>
                          updateCell(index, "Prompt", e.target.value)
                        }
                        className="h-8 min-w-[200px]"
                        placeholder="Prompt"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={row.Risks}
                        onChange={(e) =>
                          updateCell(index, "Risks", e.target.value)
                        }
                        className="h-8"
                        placeholder="Risks"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={row.Keywords}
                        onChange={(e) =>
                          updateCell(index, "Keywords", e.target.value)
                        }
                        className="h-8 min-w-[150px]"
                        placeholder="Keywords"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        onClick={() => deleteRow(index)}
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  // Classifications Table
  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button onClick={addRow} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Row
          </Button>
          {validationErrors.length > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              {validationErrors.length} Error
              {validationErrors.length > 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        {hasChanges && (
          <div className="flex items-center gap-2">
            <Button
              onClick={handleSave}
              size="sm"
              disabled={validationErrors.length > 0 || isLoading}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
            <Button onClick={handleCancel} size="sm" variant="outline">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Validation Summary */}
      {validationErrors.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <h4 className="font-medium text-destructive mb-2">
            Validation Errors
          </h4>
          <ul className="text-sm space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index} className="text-destructive">
                Row {error.row + 1}: {error.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Classifications Table */}
      <div className="border rounded-lg overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Topic*</TableHead>
              <TableHead>SubTopic*</TableHead>
              <TableHead>Industry*</TableHead>
              <TableHead>Classification*</TableHead>
              <TableHead className="w-16">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(editedData as ClassificationsCSVRow[]).map((row, index) => {
              const rowErrors = hasRowErrors(index);
              return (
                <TableRow
                  key={index}
                  className={cn(
                    rowErrors && "bg-destructive/5 border-destructive/20"
                  )}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {index + 1}
                      {rowErrors && (
                        <AlertTriangle className="h-3 w-3 text-destructive" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={row.Topic}
                      onChange={(e) =>
                        updateCell(index, "Topic", e.target.value)
                      }
                      className={cn(
                        "h-8",
                        getFieldError(index, "Topic") &&
                          "border-destructive focus:border-destructive"
                      )}
                      placeholder="Topic"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={row.SubTopic}
                      onChange={(e) =>
                        updateCell(index, "SubTopic", e.target.value)
                      }
                      className={cn(
                        "h-8",
                        getFieldError(index, "SubTopic") &&
                          "border-destructive focus:border-destructive"
                      )}
                      placeholder="SubTopic"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={row.Industry}
                      onChange={(e) =>
                        updateCell(index, "Industry", e.target.value)
                      }
                      className={cn(
                        "h-8",
                        getFieldError(index, "Industry") &&
                          "border-destructive focus:border-destructive"
                      )}
                      placeholder="Industry"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={row.Classification}
                      onChange={(e) =>
                        updateCell(index, "Classification", e.target.value)
                      }
                      className={cn(
                        "h-8",
                        getFieldError(index, "Classification") &&
                          "border-destructive focus:border-destructive"
                      )}
                      placeholder="Classification"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      onClick={() => deleteRow(index)}
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
