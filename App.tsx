
import React, { useState, useCallback, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { QueryInput } from './components/QueryInput';
import { SqlDisplay } from './components/SqlDisplay';
import { ResultsDisplay } from './components/ResultsDisplay';
import { SchemaDisplay } from './components/SchemaDisplay';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { SqlExplanationDisplay } from './components/SqlExplanationDisplay';
import { DataInput } from './components/DataInput';
import { generateSqlFromNaturalLanguage, explainSqlStatement } from './services/geminiService';
import * as dbService from './services/dbService';
import type { RawTableColumnInfo } from './services/dbService';
import { PLACEMENT_SCHEMA_STRING, SAMPLE_QUERIES, SAMPLE_CSV_DATA, TABLE_NAME, GEMINI_MODEL_NAME } from './constants';
import type { SampleQuery, QueryResultItem, SqlJsDatabase } from './types';

const API_KEY = process.env.API_KEY;

interface ParsedDetailedColumn {
  name: string; // Original name from PLACEMENT_SCHEMA_STRING
  type: string; // Type string from PLACEMENT_SCHEMA_STRING
  description: string; // Parenthetical description
  fullLine: string; // The full "name: TYPE (description)" line
}

interface ParsedDetailedSchema {
  tableName: string;
  tableDescription: string;
  columns: Map<string, ParsedDetailedColumn>; // Map original lowercase name to ParsedDetailedColumn
}

function parsePlacementSchema(schemaString: string): ParsedDetailedSchema {
  const lines = schemaString.trim().split('\n');
  const tableName = lines.find(l => l.toLowerCase().startsWith("table name:"))?.split(':')[1]?.trim() || TABLE_NAME;
  const tableDescription = lines.find(l => l.toLowerCase().startsWith("description:"))?.split(':')[1]?.trim() || "Placement data.";
  
  const columns = new Map<string, ParsedDetailedColumn>();
  let columnsSection = false;
  for (const line of lines) {
    if (line.toLowerCase().startsWith("columns:")) {
      columnsSection = true;
      continue;
    }
    if (!columnsSection || !line.trim().startsWith("-")) continue;
    
    const content = line.trim().substring(1).trim(); // Remove "-"
    const nameMatch = content.match(/^([^:]+):/);
    if (nameMatch) {
      const name = nameMatch[1].trim();
      const restOfLine = content.substring(nameMatch[0].length).trim();
      const typeMatch = restOfLine.match(/^([A-Z\s]+(?:\([0-9,]+\))?)/); // Capture type like INTEGER, REAL, TEXT, VARCHAR(255)
      const type = typeMatch ? typeMatch[0].trim() : "TEXT";
      const descriptionMatch = restOfLine.match(/\(([^)]+)\)/);
      // Ensure description is part of the type string, not just the parenthetical
      const fullTypeAndDesc = restOfLine; 
      
      columns.set(name.toLowerCase(), { name, type: type, description: descriptionMatch ? `(${descriptionMatch[1]})` : "", fullLine: fullTypeAndDesc });
    }
  }
  return { tableName, tableDescription, columns };
}

const detailedPlacementSchemaInfo = parsePlacementSchema(PLACEMENT_SCHEMA_STRING);

// Helper function to extract potential identifiers from SQL
// This is a heuristic and not a full SQL parser.
function getPotentialIdentifiersFromSql(sql: string, currentTableName: string): string[] {
  // Remove string literals (simplistic, might need improvement for escaped quotes)
  let tempSql = sql.replace(/'[^']*'/g, ' ');
  tempSql = tempSql.replace(/"[^"]*"/g, ' ');
  // Remove comments
  tempSql = tempSql.replace(/--.*/g, '');
  tempSql = tempSql.replace(/\/\*[\s\S]*?\*\//g, '');

  // Replace common SQL punctuation with spaces, then split
  const tokens = tempSql
    .toUpperCase()
    .replace(/[(),.=*;<>!+-/%]/g, ' ') // Replace punctuation with space
    .split(/\s+/)
    .map(token => token.trim())
    .filter(token => token.length > 0);

  // Filter out known SQL keywords and numbers
  // This list can be expanded.
  const sqlKeywords = new Set([
    'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'ON', 'GROUP', 'BY',
    'ORDER', 'ASC', 'DESC', 'LIMIT', 'OFFSET', 'HAVING', 'AS', 'DISTINCT', 'COUNT', 'SUM',
    'AVG', 'MIN', 'MAX', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'AND', 'OR', 'NOT', 'IN',
    'LIKE', 'BETWEEN', 'IS', 'NULL', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE',
    'CREATE', 'TABLE', 'ALTER', 'DROP', 'INDEX', 'VIEW', 'WITH', 'UNION', 'ALL',
    currentTableName.toUpperCase() // Also filter out the table name itself
  ]);

  const potentialIdentifiers = tokens.filter(token =>
    !sqlKeywords.has(token) &&         // Not a keyword
    isNaN(Number(token)) &&            // Not a number
    /^[A-Z_][A-Z0-9_]*$/.test(token)  // Basic identifier pattern (starts with letter/underscore, then alphanumeric/underscore)
  );
  return [...new Set(potentialIdentifiers)]; // Unique identifiers
}


const App: React.FC = () => {
  const [naturalQuery, setNaturalQuery] = useState<string>('');
  const [generatedSql, setGeneratedSql] = useState<string>('');
  const [queryResults, setQueryResults] = useState<QueryResultItem[] | null>(null);
  const [sqlExplanation, setSqlExplanation] = useState<string>('');
  
  const [isLoadingSql, setIsLoadingSql] = useState<boolean>(false);
  const [isLoadingResults, setIsLoadingResults] = useState<boolean>(false);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState<boolean>(false);
  
  const [error, setError] = useState<string | null>(null);
  const [explanationError, setExplanationError] = useState<string | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);

  const [ai, setAi] = useState<GoogleGenAI | null>(null);
  const [db, setDb] = useState<SqlJsDatabase | null>(null);
  const [isDbReady, setIsDbReady] = useState<boolean>(false);
  const [currentSchema, setCurrentSchema] = useState<string>(PLACEMENT_SCHEMA_STRING); // Initial placeholder
  const [csvDataInput, setCsvDataInput] = useState<string>(SAMPLE_CSV_DATA);

  useEffect(() => {
    if (API_KEY) {
      setAi(new GoogleGenAI({ apiKey: API_KEY }));
    } else {
      setError("Gemini API key not configured. SQL Generation and Explanation will not function.");
    }
  }, []);

  const constructSchemaForAI = useCallback((database: SqlJsDatabase) => {
    const actualDbColumns: RawTableColumnInfo[] = dbService.getRawTableInfo(database, TABLE_NAME);
    const originalCsvHeaders: string[] = dbService.getLastParsedOriginalHeaders();

    const sanitizedToOriginalHeaderMap = new Map<string, string>();
    originalCsvHeaders.forEach(origHeader => {
      sanitizedToOriginalHeaderMap.set(dbService.sanitizeHeader(origHeader), origHeader);
    });
    
    let schemaText = `Table Name: ${TABLE_NAME}\n`;
    let relatedToPlacement = true; 
    if (originalCsvHeaders.length > 0 && !csvDataInput.startsWith(SAMPLE_CSV_DATA.substring(0,20))) { 
        const placementSchemaHeaders = Array.from(detailedPlacementSchemaInfo.columns.keys());
        const overlap = originalCsvHeaders.filter(h => placementSchemaHeaders.includes(h.toLowerCase())).length;
        if (overlap < Math.min(placementSchemaHeaders.length, originalCsvHeaders.length) * 0.5) { 
            relatedToPlacement = false;
        }
    }
    schemaText += `Description: ${relatedToPlacement ? detailedPlacementSchemaInfo.tableDescription : 'Custom user-provided data. Only use column names explicitly listed below for queries.'}\n`;
    schemaText += `Columns:\n`;

    if (actualDbColumns.length > 0) {
      actualDbColumns.forEach(dbCol => {
        const sanitizedDbColName = dbCol.name; 
        const originalHeaderName = sanitizedToOriginalHeaderMap.get(sanitizedDbColName);
        const matchedDetailedCol = originalHeaderName ? detailedPlacementSchemaInfo.columns.get(originalHeaderName.toLowerCase()) : null;

        if (matchedDetailedCol) {
          // Use sanitized name for querying, but full description from original schema for AI context
          schemaText += `- ${sanitizedDbColName}: ${matchedDetailedCol.type} ${matchedDetailedCol.description}\n`;
        } else {
          schemaText += `- ${sanitizedDbColName}: ${dbCol.type.toUpperCase()} ${dbCol.pk ? '(Primary Key)' : ''} ${dbCol.notnull ? 'NOT NULL' : ''}\n`;
        }
      });
    } else {
      schemaText += "- No columns found or table is not initialized. Cannot query.\n";
    }
    setCurrentSchema(schemaText);
  }, [csvDataInput]);


  const initializeDatabase = useCallback(async (csvData: string) => {
    setIsDbReady(false);
    setDbError(null);
    setError(null); 
    try {
      const database = await dbService.initDb(csvData);
      setDb(database);
      if (database) {
        constructSchemaForAI(database);
        setIsDbReady(true);
      } else {
        throw new Error("Database initialization returned null.");
      }
    } catch (err) {
      console.error("DB Initialization Error:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during database setup.";
      setDbError(`Database Error: ${errorMessage}. Please check CSV format or content.`);
      setDb(null); 
      setCurrentSchema("Error: Could not load database schema. Ensure CSV data is valid and has headers."); // Fallback schema on error
    }
  }, [constructSchemaForAI]);

  useEffect(() => {
    // Initialize with sample data on first load
    initializeDatabase(SAMPLE_CSV_DATA); 
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const handleLoadCustomData = useCallback(() => {
    if (!csvDataInput.trim()) {
        setDbError("CSV data input is empty. Cannot load.");
        return;
    }
    setQueryResults(null); 
    setGeneratedSql('');
    setSqlExplanation('');
    initializeDatabase(csvDataInput);
  }, [csvDataInput, initializeDatabase]);

  const handleSubmitQuery = useCallback(async () => {
    if (!ai) {
      setError("Gemini API not available. Cannot generate SQL.");
      return;
    }
    if (!db && !dbError) { 
      setError("Database is not ready. Please wait or try loading data.");
      return;
    }
    if (dbError && !db) { 
        setError(`Cannot execute query due to a database problem: ${dbError}. Please try loading valid CSV data.`);
        return;
    }
     if (!db) { 
        setError("Database not available. Cannot execute query.");
        return;
    }

    if (!naturalQuery.trim()) {
      setError("Please enter a natural language query.");
      return;
    }

    setError(null);
    setExplanationError(null);
    setGeneratedSql('');
    setQueryResults(null);
    setSqlExplanation('');
    
    setIsLoadingSql(true);
    try {
      const sqlOrAiError = await generateSqlFromNaturalLanguage(ai, naturalQuery, currentSchema);
      
      if (sqlOrAiError.startsWith("ERROR: Cannot address query due to missing or mismatched data concepts:")) {
        setError(sqlOrAiError); // Display AI's specific error to the user
        setGeneratedSql(''); // Ensure no SQL is shown
        setIsLoadingSql(false);
        return;
      }
      
      const sql = sqlOrAiError; // If it's not the AI error, it's SQL
      setGeneratedSql(sql);
      setIsLoadingSql(false); 

      if (sql && db) {
        const actualDbColumnNames = dbService.getRawTableInfo(db, TABLE_NAME).map(col => col.name.toUpperCase());
        const potentialSqlColumns = getPotentialIdentifiersFromSql(sql, TABLE_NAME);
        
        // Filter out known aggregate functions and common keywords that might be misidentified as columns
        const truePotentialColumns = potentialSqlColumns.filter(col => 
            !['COUNT', 'SUM', 'AVG', 'MIN', 'MAX'].includes(col) && // Common aggregates
            !TABLE_NAME.toUpperCase().includes(col) // Avoid parts of table name if it's complex
        );

        const missingColumns = truePotentialColumns.filter(col => !actualDbColumnNames.includes(col));

        if (missingColumns.length > 0) {
          setError(`The generated query references columns that don't exist in your current dataset: ${missingColumns.join(', ')}. Please rephrase your question, check your data, or ensure the schema accurately reflects your data.`);
          setQueryResults(null);
          return; 
        }

        setIsLoadingResults(true);
        try {
          const results = dbService.runQuery(db, sql);
          setQueryResults(results);
        } catch (execError) {
          console.error("SQL Execution Error:", execError);
          setError(execError instanceof Error ? `SQL Execution Error: ${execError.message}` : "An error occurred while executing the SQL query.");
          setQueryResults(null); 
        } finally {
          setIsLoadingResults(false);
        }
      } else if (!db) {
         setError("Database not available to execute query.");
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An unknown error occurred during SQL generation.");
      setIsLoadingSql(false); 
      setIsLoadingResults(false); 
    }
  }, [ai, db, naturalQuery, currentSchema, dbError]);

  const handleExplainSql = useCallback(async () => {
    if (!ai || !generatedSql || generatedSql.startsWith("ERROR:")) { // Don't explain AI's error messages
      setExplanationError("Cannot explain: API not available or no valid SQL generated.");
      return;
    }
    setExplanationError(null);
    setSqlExplanation('');
    setIsLoadingExplanation(true);
    try {
      const explanation = await explainSqlStatement(ai, generatedSql);
      setSqlExplanation(explanation);
    } catch (err) {
      console.error(err);
      setExplanationError(err instanceof Error ? err.message : "Failed to get SQL explanation.");
    } finally {
      setIsLoadingExplanation(false);
    }
  }, [ai, generatedSql]);

  const handleSampleQueryClick = (sample: SampleQuery) => {
    setNaturalQuery(sample.query);
    setGeneratedSql('');
    setQueryResults(null);
    setSqlExplanation('');
    setError(null);
    setExplanationError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-cyan-900/10 to-zinc-900 text-slate-200 p-4 sm:p-6 lg:p-8 flex flex-col items-center">
      <header className="w-full max-w-6xl mb-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-teal-500 to-sky-500">
          Query Bridge
        </h1>
        <p className="mt-2 text-slate-400 text-lg">
          Transform your natural language questions into SQL, execute on your data, and understand it all.
        </p>
         {!API_KEY && (
          <div className="mt-4 p-3 bg-orange-800/50 text-orange-300 border border-orange-600 rounded-md">
            Warning: Gemini API Key is not configured. SQL Generation and Explanations are disabled.
          </div>
        )}
      </header>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-6">
          <DataInput
            csvData={csvDataInput}
            onCsvDataChange={setCsvDataInput}
            onLoadData={handleLoadCustomData}
            isDbReady={isDbReady}
            dbError={dbError}
          />
          <SchemaDisplay schema={currentSchema} />
          <div className="bg-zinc-800 shadow-2xl rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-3 text-cyan-400">Sample Queries</h3>
            <ul className="space-y-2 max-h-60 overflow-y-auto">
              {SAMPLE_QUERIES.map((sample, index) => (
                <li key={index}>
                  <button
                    onClick={() => handleSampleQueryClick(sample)}
                    className="text-sm text-slate-300 hover:text-cyan-400 transition-colors duration-150 text-left w-full p-2 rounded-md hover:bg-zinc-700"
                    title={sample.description}
                  >
                    {sample.query}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <QueryInput
            value={naturalQuery}
            onChange={(val) => {
              setNaturalQuery(val);
              setGeneratedSql('');
              setQueryResults(null);
              setSqlExplanation('');
              setError(null);
              setExplanationError(null);
            }}
            onSubmit={handleSubmitQuery}
            isLoading={isLoadingSql || isLoadingResults}
            disabled={!isDbReady && !!dbError} 
          />

          {error && <ErrorMessage message={error} onClose={() => setError(null)} />}
          {dbError && !isDbReady && <ErrorMessage message={dbError} onClose={() => {setDbError(null); initializeDatabase(csvDataInput); }} />}


          <SqlDisplay 
            sqlQuery={generatedSql} 
            isLoading={isLoadingSql}
            onExplainSql={handleExplainSql}
            isExplainLoading={isLoadingExplanation}
            disabled={!generatedSql || generatedSql.startsWith("ERROR:") || !ai}
          />

          {explanationError && <ErrorMessage message={explanationError} onClose={() => setExplanationError(null)} />}
          <SqlExplanationDisplay 
            explanation={sqlExplanation} 
            isLoading={isLoadingExplanation} 
          />
          
          <ResultsDisplay results={queryResults} isLoading={isLoadingResults} />
        </div>
      </div>
      <footer className="w-full max-w-6xl mt-12 text-center text-slate-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Query Bridge. Powered by Gemini & SQL.js.</p>
      </footer>
    </div>
  );
};

export default App;
