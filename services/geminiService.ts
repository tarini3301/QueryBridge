
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GEMINI_MODEL_NAME } from '../constants';

export const generateSqlFromNaturalLanguage = async (
  ai: GoogleGenAI,
  naturalLanguageQuery: string,
  schema: string
): Promise<string> => {
  const prompt = `
You are an expert SQL generator. Given the following database schema and a natural language query, convert the natural language query into a valid SQL query for a SQLite database.
Only output the SQL query and nothing else. Do not include any explanations or markdown formatting like \`\`\`sql or \`\`\`.
Ensure the query is directly executable against a table described by the schema.
The primary table name is 'Placement'. Refer to columns as defined in the schema.

Database Schema:
${schema}

Natural Language Query:
${naturalLanguageQuery}

If the natural language query refers to concepts, columns, or specific filter values (e.g., gender='female', or a specific status not listed as an allowed value in the schema description for a column) that are clearly not supported by or cannot be inferred from the provided Database Schema, you MUST respond with a single line starting with "ERROR: Cannot address query due to missing or mismatched data concepts:". List the specific concepts or column names from the natural language query that you cannot map to the schema. For example: "ERROR: Cannot address query due to missing or mismatched data concepts: [gender, specific_unlisted_status_value]". Do not attempt to generate a partial or alternative SQL query in this case.

SQL Query:
`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: GEMINI_MODEL_NAME,
        contents: prompt,
        config: {
            temperature: 0.1, 
            topP: 0.9,
            topK: 32,
        }
    });
    let sqlQueryOrError = response.text.trim();
    
    // Check if AI returned its specific error
    if (sqlQueryOrError.startsWith("ERROR: Cannot address query due to missing or mismatched data concepts:")) {
      return sqlQueryOrError; // Return the AI's error message directly
    }

    // Remove markdown fences if present (for actual SQL)
    const fenceRegex = /^```(?:sql)?\s*\n?(.*?)\n?\s*```$/s;
    const match = sqlQueryOrError.match(fenceRegex);
    if (match && match[1]) {
      sqlQueryOrError = match[1].trim();
    }

    // A simple check for actual SQL, can be expanded
    if (!sqlQueryOrError.toUpperCase().startsWith("SELECT") && 
        !sqlQueryOrError.toUpperCase().startsWith("WITH") &&
        !sqlQueryOrError.toUpperCase().startsWith("UPDATE") && // Added other valid SQL starts
        !sqlQueryOrError.toUpperCase().startsWith("DELETE") &&
        !sqlQueryOrError.toUpperCase().startsWith("INSERT")) {
        console.warn("Generated SQL might not be a standard DQL/DML query:", sqlQueryOrError);
        // Depending on strictness, could throw an error here or return as is if other types are expected
    }
    return sqlQueryOrError;
  } catch (error) {
    console.error("Error generating SQL:", error);
    throw new Error(`Failed to generate SQL from Gemini: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const explainSqlStatement = async (
  ai: GoogleGenAI,
  sqlQuery: string
): Promise<string> => {
  const prompt = `
You are an expert SQL analyst. Given the following SQL query, explain it in simple, easy-to-understand terms.
Describe:
- The overall purpose of the query.
- What each main clause (SELECT, FROM, WHERE, GROUP BY, ORDER BY, JOINs, etc.) does.
- What kind of information or data the query aims to retrieve or manipulate.
Keep the explanation clear, concise, and targeted at someone who may not be a SQL expert.
Do not include any markdown formatting like \`\`\`sql or \`\`\` in your explanation.

SQL Query to Explain:
${sqlQuery}

Explanation:
`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: GEMINI_MODEL_NAME,
        contents: prompt,
        config: {
            temperature: 0.4,
            topP: 0.95,
            topK: 64,
        }
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error explaining SQL:", error);
    throw new Error(`Failed to get SQL explanation from Gemini: ${error instanceof Error ? error.message : String(error)}`);
  }
};
