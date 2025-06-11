import type { SampleQuery } from './types';

export const PLACEMENT_SCHEMA_STRING = `
Table Name: Placement
Description: Contains data about student placements, including academic performance and job offers.
Columns:
- sl_no: INTEGER (Serial Number, Primary Key)
- gender: TEXT (Student's gender. Allowed values: 'M', 'F')
- ssc_p: REAL (Secondary Education percentage - 10th Grade. Range: 0-100)
- ssc_b: TEXT (Board of Secondary Education. Allowed values: 'Central', 'Others')
- hsc_p: REAL (Higher Secondary Education percentage - 12th Grade. Range: 0-100)
- hsc_b: TEXT (Board of Higher Secondary Education. Allowed values: 'Central', 'Others')
- hsc_s: TEXT (Specialization in Higher Secondary Education. Allowed values: 'Commerce', 'Science', 'Arts')
- degree_p: REAL (Degree Percentage. Range: 0-100)
- degree_t: TEXT (Under Graduation Degree Type. Allowed values: 'Sci&Tech', 'Comm&Mgmt', 'Others')
- workex: TEXT (Work Experience. Allowed values: 'Yes', 'No')
- etest_p: REAL (Employability test percentage conducted by college. Range: 0-100)
- specialisation: TEXT (MBA Specialization. Allowed values: 'Mkt&HR', 'Mkt&Fin')
- mba_p: REAL (MBA percentage. Range: 0-100)
- status: TEXT (Status of placement. Allowed values: 'Placed', 'Not Placed')
- salary: REAL (Salary of candidate if placed in INR. NULL or 0 if not placed or data not available.)
`;

export const SAMPLE_QUERIES: SampleQuery[] = [
  {
    query: "Show all students who scored more than 90% in HSC and their specialization.",
    description: "Filters students by HSC percentage and shows their specialization."
  },
  {
    query: "How many female students are placed?",
    description: "Counts placed female students."
  },
  {
    query: "What is the average salary of placed students with work experience?",
    description: "Calculates average salary for experienced placed students."
  },
  {
    query: "List students from Commerce stream with degree percentage above 70, show their MBA specialization.",
    description: "Filters Commerce students by degree percentage and shows MBA spec."
  },
  {
    query: "Find students who are not placed and have an MBA specialization in Mkt&HR.",
    description: "Lists not placed students with specific MBA specialization."
  },
  {
    query: "Top 5 salaries offered.",
    description: "Shows the top 5 salaries from the dataset."
  },
  {
    query: "Count of students by degree type who are placed.",
    description: "Groups placed students by their degree type and counts them."
  }
];

export const GEMINI_MODEL_NAME = 'gemini-2.5-flash-preview-04-17';
export const TABLE_NAME = 'Placement'; // Define table name for DB operations

// Sample CSV data from Placement_Data_Full_Class.csv (first 5 records + header)
export const SAMPLE_CSV_DATA = `sl_no,gender,ssc_p,ssc_b,hsc_p,hsc_b,hsc_s,degree_p,degree_t,workex,etest_p,specialisation,mba_p,status,salary
1,M,67.00,Others,91.00,Others,Commerce,58.00,Sci&Tech,No,55.0,Mkt&HR,58.80,Placed,270000.0
2,M,79.33,Central,78.33,Others,Science,77.33,Sci&Tech,Yes,86.5,Mkt&Fin,66.28,Placed,200000.0
3,M,65.00,Central,68.00,Central,Arts,64.00,Comm&Mgmt,No,75.0,Mkt&Fin,57.80,Placed,250000.0
4,M,56.00,Central,52.00,Central,Science,52.00,Sci&Tech,No,66.0,Mkt&HR,59.43,Not Placed,
5,M,85.80,Central,73.60,Central,Commerce,73.30,Comm&Mgmt,No,96.8,Mkt&Fin,55.50,Placed,425000.0
`;
