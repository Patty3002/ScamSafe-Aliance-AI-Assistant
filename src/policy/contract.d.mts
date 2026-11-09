import type { Extraction, Sources } from './types'
export const fieldDefinitions: Record<string, [string, string[] | null]>
export const multiFields: string[]
export const extractionSchema: object
export const extractionInstructions: string
export function validateExtraction(value: unknown, sources?: Sources): value is Extraction
export function containsSensitiveData(value: string): boolean
