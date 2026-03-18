export interface ShipmentCSVRow {
  shipment_id: string;
  origin: string;
  destination: string;
  carrier: string;
  transport_mode: string;
  shipment_date: string;
  planned_eta: string;
  planned_transit_days: number;
  days_in_transit: number;
  package_weight_kg: number;
  num_stops: number;
  weather_condition: string;
  weather_severity_score: number;
  traffic_congestion_level: number;
  port_congestion_score: number;
  disruption_type: string;
  disruption_impact_score: number;
  carrier_reliability_score: number;
  historical_delay_rate: number;
  route_risk_score: number;
  [key: string]: string | number | boolean;
}

export interface CSVValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  rowCount: number;
  parsedData: ShipmentCSVRow[];
}

const REQUIRED_HEADERS = [
  'shipment_id', 'origin', 'destination', 'carrier', 'transport_mode',
];

const ALL_HEADERS = [
  'shipment_id', 'origin', 'destination', 'carrier', 'transport_mode',
  'shipment_date', 'planned_eta', 'planned_transit_days', 'days_in_transit',
  'package_weight_kg', 'num_stops', 'weather_condition', 'weather_severity_score',
  'traffic_congestion_level', 'port_congestion_score', 'disruption_type',
  'disruption_impact_score', 'carrier_reliability_score', 'historical_delay_rate',
  'route_risk_score',
];

const NUMERIC_FIELDS = new Set([
  'planned_transit_days', 'days_in_transit', 'package_weight_kg', 'num_stops',
  'weather_severity_score', 'traffic_congestion_level', 'port_congestion_score',
  'disruption_impact_score', 'carrier_reliability_score', 'historical_delay_rate',
  'route_risk_score',
]);

const VALID_TRANSPORT_MODES = ['Air', 'Sea', 'Road', 'Rail'];
const VALID_WEATHER = ['Clear', 'Rain', 'Heavy Rain', 'Storm', 'Fog', 'Snow', 'Blizzard', 'Cloudy'];
const VALID_DISRUPTIONS = ['None', 'Port Strike', 'Traffic Jam', 'Natural Disaster', 'Equipment Failure'];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_ROWS = 1000;

function isValidDate(dateStr: string): boolean {
  if (!dateStr) return false;
  // Accept YYYY-MM-DD or MM/DD/YYYY
  const isoMatch = /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
  const usMatch = /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr);
  if (!isoMatch && !usMatch) return false;
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
}

function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

/**
 * Parse and validate a CSV file with detailed error reporting
 */
export function parseCSV(file: File): Promise<ShipmentCSVRow[]> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_FILE_SIZE) {
      reject(new Error(`File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds the 10MB limit.`));
      return;
    }

    if (!file.name.endsWith('.csv')) {
      reject(new Error('Invalid file type. Only .csv files are accepted.'));
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.trim().split(/\r?\n/);

        if (lines.length < 2) {
          reject(new Error('CSV must have a header row and at least 1 data row.'));
          return;
        }

        // Parse headers — handle quoted values
        const rawHeaders = parseCsvLine(lines[0]);
        const headers = rawHeaders.map(normalizeHeader);

        // Check required headers
        const missingHeaders = REQUIRED_HEADERS.filter(h => !headers.includes(h));
        if (missingHeaders.length > 0) {
          reject(new Error(
            `Missing required columns: ${missingHeaders.join(', ')}.\n` +
            `Required columns: ${REQUIRED_HEADERS.join(', ')}.\n` +
            `Found columns: ${rawHeaders.join(', ')}`
          ));
          return;
        }

        const dataLines = lines.slice(1).filter(line => line.trim().length > 0);

        if (dataLines.length > MAX_ROWS) {
          reject(new Error(`CSV contains ${dataLines.length} rows, which exceeds the ${MAX_ROWS} row limit.`));
          return;
        }

        const rows = dataLines.map((line) => {
          const values = parseCsvLine(line);
          const row: Record<string, string | number> = {};

          headers.forEach((header, i) => {
            const value = (values[i] || '').trim();
            if (NUMERIC_FIELDS.has(header)) {
              row[header] = value === '' ? 0 : parseFloat(value) || 0;
            } else {
              row[header] = value;
            }
          });

          return row as unknown as ShipmentCSVRow;
        });

        resolve(rows);
      } catch (error) {
        reject(new Error(`CSV parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };

    reader.onerror = () => reject(new Error('File read failed. Please try again.'));
    reader.readAsText(file);
  });
}

/**
 * Parse a single CSV line handling quoted values with commas
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Validate a single CSV row with detailed error messages
 */
export function validateCSVRow(row: ShipmentCSVRow): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!row.shipment_id || String(row.shipment_id).trim() === '') {
    errors.push('Missing shipment_id');
  }
  if (!row.origin || String(row.origin).trim() === '') {
    errors.push('Missing origin');
  }
  if (!row.destination || String(row.destination).trim() === '') {
    errors.push('Missing destination');
  }
  if (!row.carrier || String(row.carrier).trim() === '') {
    errors.push('Missing carrier');
  }
  if (!row.transport_mode || String(row.transport_mode).trim() === '') {
    errors.push('Missing transport_mode');
  }

  // Transport mode validation
  if (row.transport_mode && !VALID_TRANSPORT_MODES.includes(row.transport_mode)) {
    errors.push(
      `Invalid transport_mode "${row.transport_mode}". Must be one of: ${VALID_TRANSPORT_MODES.join(', ')}`
    );
  }

  // Date validation
  if (row.shipment_date && !isValidDate(String(row.shipment_date))) {
    errors.push(`Invalid shipment_date "${row.shipment_date}". Use YYYY-MM-DD format.`);
  }
  if (row.planned_eta && !isValidDate(String(row.planned_eta))) {
    errors.push(`Invalid planned_eta "${row.planned_eta}". Use YYYY-MM-DD format.`);
  }

  // Numeric range validation
  const numericChecks: { field: string; min: number; max: number; label: string }[] = [
    { field: 'planned_transit_days', min: 0, max: 365, label: 'Planned transit days' },
    { field: 'days_in_transit', min: 0, max: 365, label: 'Days in transit' },
    { field: 'package_weight_kg', min: 0, max: 1000000, label: 'Package weight' },
    { field: 'num_stops', min: 0, max: 50, label: 'Number of stops' },
    { field: 'weather_severity_score', min: 0, max: 10, label: 'Weather severity' },
    { field: 'traffic_congestion_level', min: 0, max: 10, label: 'Traffic congestion' },
    { field: 'port_congestion_score', min: 0, max: 10, label: 'Port congestion' },
    { field: 'disruption_impact_score', min: 0, max: 10, label: 'Disruption impact' },
    { field: 'carrier_reliability_score', min: 0, max: 1, label: 'Carrier reliability' },
    { field: 'historical_delay_rate', min: 0, max: 1, label: 'Historical delay rate' },
    { field: 'route_risk_score', min: 0, max: 1, label: 'Route risk score' },
  ];

  for (const check of numericChecks) {
    const val = row[check.field];
    if (val !== undefined && val !== '' && val !== 0) {
      const num = Number(val);
      if (isNaN(num)) {
        errors.push(`${check.label} must be a number, got "${val}"`);
      } else if (num < check.min || num > check.max) {
        warnings.push(`${check.label} (${num}) is outside expected range ${check.min}-${check.max}`);
      }
    }
  }

  // Weather condition validation
  if (row.weather_condition && !VALID_WEATHER.includes(row.weather_condition)) {
    warnings.push(`Unrecognized weather_condition "${row.weather_condition}"`);
  }

  // Disruption type validation
  if (row.disruption_type && !VALID_DISRUPTIONS.includes(row.disruption_type)) {
    warnings.push(`Unrecognized disruption_type "${row.disruption_type}"`);
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate entire CSV before import
 */
export function validateCSVBatch(rows: ShipmentCSVRow[]): CSVValidationResult {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];
  const validRows: ShipmentCSVRow[] = [];

  // Check for duplicate IDs
  const ids = new Set<string>();
  const duplicates = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // +2 for 1-based + header row
    const { valid, errors, warnings } = validateCSVRow(row);

    if (row.shipment_id) {
      if (ids.has(row.shipment_id)) {
        duplicates.add(row.shipment_id);
      }
      ids.add(row.shipment_id);
    }

    if (!valid) {
      errors.forEach(e => allErrors.push(`Row ${rowNum}: ${e}`));
    } else {
      validRows.push(row);
    }

    warnings.forEach(w => allWarnings.push(`Row ${rowNum}: ${w}`));
  }

  if (duplicates.size > 0) {
    allWarnings.unshift(`Duplicate shipment IDs found: ${Array.from(duplicates).join(', ')}`);
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
    rowCount: rows.length,
    parsedData: validRows,
  };
}

export function downloadSampleCSV() {
  const headers = ALL_HEADERS.join(',');

  const samples = [
    'SHP12345,Shanghai,New York,Maersk,Sea,2026-03-01,2026-03-16,15,5,2500.5,3,Clear,2,5,6,None,0,0.9,0.1,0.2',
    'SHP12346,Singapore,Dubai,FedEx,Air,2026-03-05,2026-03-12,7,2,500.2,1,Clear,3,3,3,None,0,0.95,0.05,0.1',
    'SHP12347,Rotterdam,Shanghai,UPS,Sea,2026-02-20,2026-03-13,21,15,5000,5,Rain,6,7,8,Port Strike,8,0.85,0.15,0.3',
  ];

  const csv = [headers, ...samples].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', 'sample-shipments.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
