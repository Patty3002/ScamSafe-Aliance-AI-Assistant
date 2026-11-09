// Provider transport only: the canonical contract and validateExtraction remain
// authoritative. Gemini accepts an OpenAPI-style responseSchema subset. Avoid
// string/array length constraints in its generation grammar: nested bounded
// arrays can make an otherwise small extraction schema too complex to compile.
// Keep those constraints as generation guidance and enforce them locally.
export function toGeminiResponseSchema(schema) {
  const result = { type: schema.type.toUpperCase() }
  if (schema.properties) {
    result.properties = Object.fromEntries(Object.entries(schema.properties)
      .map(([name, child]) => [name, toGeminiResponseSchema(child)]))
    result.propertyOrdering = Object.keys(schema.properties)
  }
  if (schema.required) result.required = [...schema.required]
  if (schema.items) result.items = toGeminiResponseSchema(schema.items)
  if (schema.enum) result.enum = [...schema.enum]
  const guidance = [schema.description]
  if (schema.minLength !== undefined) guidance.push(`At least ${schema.minLength} character(s).`)
  if (schema.maxLength !== undefined) guidance.push(`At most ${schema.maxLength} characters.`)
  if (schema.minItems !== undefined) guidance.push(`At least ${schema.minItems} item(s).`)
  if (schema.maxItems !== undefined) guidance.push(`At most ${schema.maxItems} items.`)
  if (schema.additionalProperties === false) guidance.push('Return only the listed properties; no additional properties.')
  const description = guidance.filter(Boolean).join(' ')
  if (description) result.description = description
  return result
}
