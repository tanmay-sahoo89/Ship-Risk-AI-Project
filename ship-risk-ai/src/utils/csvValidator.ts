import Papa from "papaparse";

export interface CSVValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  rowCount: number;
  parsedData?: Record<string, unknown>[];
}

const REQUIRED_HEADERS = [
  "shipment_id",
  "origin",
  "destination",
  "carrier",
  "eta",
  "sla_date",
  "cargo_type",
  "value",
  "weight",
  "status",
];

const VALID_STATUSES = [
  "pending",
  "in_transit",
  "delivered",
  "delayed",
  "cancelled",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_ROWS = 1000;

export const validateCSV = (
  csvText: string,
  fileSize?: number,
): CSVValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const parsedData: Record<string, unknown>[] = [];

  // Check file size
  if (fileSize && fileSize > MAX_FILE_SIZE) {
    errors.push(
      `File size exceeds 10MB limit (${(fileSize / 1024 / 1024).toFixed(2)}MB)`,
    );
    return { isValid: false, errors, warnings, rowCount: 0 };
  }

  // Parse CSV
  let rows: string[][] = [];
  try {
    const result = Papa.parse(csvText, {
      header: false,
      skipEmptyLines: true,
    });
    rows = result.data as string[][];
  } catch (e) {
    errors.push("Failed to parse CSV file. Ensure it is a valid CSV format.");
    return { isValid: false, errors, warnings, rowCount: 0 };
  }

  if (rows.length < 2) {
    errors.push(
      "CSV file must contain at least a header row and one data row.",
    );
    return { isValid: false, errors, warnings, rowCount: 0 };
  }

  const headers = rows[0].map((h) => h.toLowerCase().trim());
  const normalizedHeaders: Record<string, string> = {};

  // Check for required headers
  for (const required of REQUIRED_HEADERS) {
    const found = headers.find(
      (h) => h === required || h === required.replace(/_/g, " "),
    );
    if (!found) {
      errors.push(`Missing required column: '${required}'`);
    } else {
      normalizedHeaders[required] = found;
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors, warnings, rowCount: 0 };
  }

  // Check row count
  const dataRows = rows.slice(1);
  if (dataRows.length > MAX_ROWS) {
    errors.push(
      `CSV contains ${dataRows.length} rows, but max allowed is ${MAX_ROWS}`,
    );
    return { isValid: false, errors, warnings, rowCount: dataRows.length };
  }

  // Validate each row
  const headerIndexMap: Record<string, number> = {};
  headers.forEach((header, idx) => {
    for (const [key, value] of Object.entries(normalizedHeaders)) {
      if (value === header) {
        headerIndexMap[key] = idx;
        break;
      }
    }
  });

  for (let rowIdx = 0; rowIdx < dataRows.length; rowIdx++) {
    const row = dataRows[rowIdx];
    const rowNum = rowIdx + 2; // +1 for header, +1 for 1-based indexing

    if (row.length < REQUIRED_HEADERS.length) {
      errors.push(
        `Row ${rowNum}: Missing values. Expected ${REQUIRED_HEADERS.length} columns, got ${row.length}`,
      );
      continue;
    }

    const rowData: Record<string, unknown> = {};

    // Validate each field
    for (const [key, colIdx] of Object.entries(headerIndexMap)) {
      const value = row[colIdx]?.trim() || "";
      rowData[key] = value;

      if (!value) {
        errors.push(`Row ${rowNum}: '${key}' is required but empty`);
        continue;
      }

      // Field-specific validation
      if (key === "shipment_id" && !value.match(/^[A-Z0-9_-]+$/i)) {
        errors.push(
          `Row ${rowNum}: 'shipment_id' must contain only alphanumeric characters, underscores, and hyphens`,
        );
      }

      if ((key === "eta" || key === "sla_date") && !isValidDate(value)) {
        errors.push(
          `Row ${rowNum}: '${key}' has invalid date format. Use YYYY-MM-DD or MM/DD/YYYY format`,
        );
      }

      if ((key === "value" || key === "weight") && isNaN(Number(value))) {
        errors.push(`Row ${rowNum}: '${key}' must be a number, got '${value}'`);
      }

      if (key === "status" && !VALID_STATUSES.includes(value.toLowerCase())) {
        errors.push(
          `Row ${rowNum}: 'status' must be one of: ${VALID_STATUSES.join(", ")}, got '${value}'`,
        );
      }

      if ((key === "origin" || key === "destination") && value.length > 100) {
        warnings.push(
          `Row ${rowNum}: '${key}' is longer than typically expected (${value.length} chars)`,
        );
      }
    }

    if (errors.filter((e) => e.includes(`Row ${rowNum}`)).length === 0) {
      parsedData.push(rowData);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    rowCount: dataRows.length,
    parsedData: errors.length === 0 ? parsedData : undefined,
  };
};

export const validateCSVFile = (file: File): Promise<CSVValidationResult> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      resolve(validateCSV(text, file.size));
    };
    reader.onerror = () => {
      resolve({
        isValid: false,
        errors: ["Failed to read file"],
        warnings: [],
        rowCount: 0,
      });
    };
    reader.readAsText(file);
  });
};

function isValidDate(dateString: string): boolean {
  // Try YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }

  // Try MM/DD/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }

  return false;
}
