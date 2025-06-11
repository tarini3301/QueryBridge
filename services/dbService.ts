
import initSqlJs, { type Database, QueryExecResult, SqlValue } from 'sql.js';
import Papa from 'papaparse';
import { TABLE_NAME } from '../constants';
import type { QueryResultItem } from '../types';

let SQL: initSqlJs.SqlJsStatic | null = null;
let lastParsedOriginalHeaders: string[] = [];

async function getSqlJs() {
  if (!SQL) {
    SQL = await initSqlJs({
      locateFile: file => `https://esm.sh/sql.js@1.10.3/dist/${file}`
    });
  }
  return SQL;
}

export function sanitizeHeader(header: string): string {
  return header.replace(/[^a-zA-Z0-9_]/g, '_');
}

export async function initDb(csvData: string): Promise<Database | null> {
  lastParsedOriginalHeaders = []; // Reset
  try {
    const SQL = await getSqlJs();
    const db = new SQL.Database();

    const parseResult = Papa.parse(csvData.trim(), {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false, // Turn off dynamicTyping in PapaParse to handle all as string initially for robust type inference
    });

    if (parseResult.errors.length > 0) {
      console.error("CSV Parsing errors:", parseResult.errors);
      const errorMessages = parseResult.errors.map(e => `Row ${e.row}: ${e.message}`).join("; ");
      throw new Error(`Error parsing CSV data: ${errorMessages}`);
    }
    
    const data = parseResult.data as Record<string, any>[];
    if (!data || data.length === 0) {
      throw new Error("No data found in CSV or CSV is empty.");
    }

    const originalHeaders = parseResult.meta.fields || Object.keys(data[0]);
    if (!originalHeaders || originalHeaders.length === 0) {
        throw new Error("No headers found in CSV data.");
    }
    lastParsedOriginalHeaders = originalHeaders;
    
    const sanitizedHeaders = originalHeaders.map(sanitizeHeader);
    
    // Infer column types from the first N rows (e.g., up to 20 rows or all if fewer)
    const sampleDataForTyping = data.slice(0, Math.min(data.length, 20));
    const columnTypes = sanitizedHeaders.map((_, i) => {
        const originalHeader = originalHeaders[i];
        let hasDecimal = false;
        let allNumeric = true;
        let allInteger = true;

        for (const row of sampleDataForTyping) {
            const valueStr = String(row[originalHeader]).trim();
            if (valueStr === '' || valueStr.toLowerCase() === 'null' || typeof row[originalHeader] === 'undefined') {
                continue; // Skip empty/null for typing, assume TEXT if all are empty/null
            }

            if (isNaN(Number(valueStr))) {
                allNumeric = false;
                allInteger = false;
                break;
            }
            if (valueStr.includes('.')) {
                hasDecimal = true;
                allInteger = false; // Cannot be pure integer if decimal point exists
            } else if (!Number.isInteger(Number(valueStr))) {
                 allInteger = false; // Check if it's an integer after conversion
            }
        }
        if (!allNumeric) return 'TEXT';
        if (allInteger && !hasDecimal) return 'INTEGER'; // Only INTEGER if no decimals seen and all are integers
        if (allNumeric) return 'REAL'; // REAL if numeric and either has decimals or some aren't integers
        return 'TEXT'; // Fallback
    });
    
    const createTableQuery = `CREATE TABLE ${TABLE_NAME} (${sanitizedHeaders.map((h, i) => `"${h}" ${columnTypes[i]}`).join(', ')});`;
    db.run(createTableQuery);

    const stmt = db.prepare(`INSERT INTO ${TABLE_NAME} (${sanitizedHeaders.map(h => `"${h}"`).join(', ')}) VALUES (${sanitizedHeaders.map(() => '?').join(', ')});`);
    data.forEach(row => {
      const valuesToInsert: SqlValue[] = [];
      sanitizedHeaders.forEach((sHeader, i) => {
        const originalHeader = originalHeaders[i];
        let value = row[originalHeader];
        const colType = columnTypes[i];

        if (value === null || typeof value === 'undefined' || String(value).trim() === '') {
          valuesToInsert.push(null);
        } else {
          const strValue = String(value).trim();
          if (colType === 'INTEGER') {
            valuesToInsert.push(Number.isInteger(Number(strValue)) ? parseInt(strValue, 10) : null);
          } else if (colType === 'REAL') {
            valuesToInsert.push(!isNaN(parseFloat(strValue)) ? parseFloat(strValue) : null);
          } else { // TEXT
            valuesToInsert.push(strValue);
          }
        }
      });
      try {
        stmt.run(valuesToInsert);
      } catch (insertError) {
        console.warn(`Skipping row due to insert error: ${insertError}. Row data:`, row, "Values attempted:", valuesToInsert);
      }
    });
    stmt.free();

    return db;
  } catch (error) {
    console.error("Error initializing database:", error);
    lastParsedOriginalHeaders = [];
    throw error; 
  }
}

export function getLastParsedOriginalHeaders(): string[] {
  return [...lastParsedOriginalHeaders];
}

export function runQuery(db: Database, sql: string): QueryResultItem[] {
  try {
    const results: QueryExecResult[] = db.exec(sql); 
    if (!results || results.length === 0) {
      try {
        const changes = db.getRowsModified();
        if (sql.trim().toUpperCase().startsWith("SELECT")) {
             // If it was a SELECT query that returned no rows
            return [];
        }
        // For DML/DDL that don't return rows but might modify
        if (changes > 0) return [{ message: `${changes} row(s) affected.` }];

      } catch (e) { /* ignore if not applicable */ }
      // If it's a statement like CREATE TABLE, or a SELECT with no results
      return []; 
    }

    const { columns, values } = results[0];
    return values.map(row => {
      const rowObject: QueryResultItem = {};
      columns.forEach((col, index) => {
        rowObject[col] = row[index];
      });
      return rowObject;
    });
  } catch (error) {
    console.error("Error executing query:", error);
    throw new Error(`SQL Execution Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export interface RawTableColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: SqlValue; 
  pk: number;
}

export function getRawTableInfo(db: Database, tableName: string = TABLE_NAME): RawTableColumnInfo[] {
  try {
    const results = db.exec(`PRAGMA table_info(${tableName});`);
    if (!results || results.length === 0 || !results[0].values) {
      return [];
    }
    const columns = results[0].columns; // ["cid", "name", "type", "notnull", "dflt_value", "pk"]
    return results[0].values.map(row => {
      const colInfo: any = {};
      columns.forEach((colName, index) => {
        colInfo[colName] = row[index];
      });
      return colInfo as RawTableColumnInfo;
    });
  } catch (error) {
    console.error(`Error getting raw table info for ${tableName}:`, error);
    return [];
  }
}


export function getTableSchema(db: Database, tableName: string = TABLE_NAME): string {
  try {
    const rawTableInfo = getRawTableInfo(db, tableName);
    if (rawTableInfo.length === 0) {
      return `Schema for table '${tableName}' could not be retrieved or table is empty.`;
    }
    let schemaString = `Table Name: ${tableName}\nColumns:\n`;
    rawTableInfo.forEach(col => {
      schemaString += `- ${col.name}: ${col.type} ${col.pk ? '(Primary Key)' : ''} ${col.notnull ? 'NOT NULL' : ''}\n`;
    });
    return schemaString;
  } catch (error) {
    console.error(`Error getting schema for table ${tableName}:`, error);
    return `Error retrieving schema for ${tableName}.`;
  }
}
