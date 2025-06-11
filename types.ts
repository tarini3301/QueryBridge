import type { Database } from 'sql.js';

export interface SampleQuery {
  query: string;
  description: string;
}

// Represents a row from the SQL query result
export interface QueryResultItem {
  [columnName: string]: any; // Value can be string, number, null, etc.
}

export interface GroundingChunkWeb {
  uri: string;
  title: string;
}

export interface GroundingChunk {
  web?: GroundingChunkWeb;
  // Other types of chunks can be added here if needed
}

export interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
  // Other grounding metadata fields can be added here
}

export interface Candidate {
  groundingMetadata?: GroundingMetadata;
  // Other candidate properties
}

// SQL.js Database type
export type SqlJsDatabase = Database;
