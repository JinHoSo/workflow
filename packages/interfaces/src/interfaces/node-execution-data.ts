/**
 * Structured data record that can hold nested key-value pairs
 * Used for structured data in workflow execution
 */
export interface DataRecord {
  [key: string]: string | number | boolean | DataRecord | DataRecord[] | null | undefined
}

/**
 * Binary content structure for files, images, and other binary content
 */
export interface BinaryContent {
  /** Base64 encoded binary data */
  content: string
  /** MIME type of the binary data (e.g., "image/png", "application/pdf") */
  mimeType: string
  /** Original filename if available */
  filename?: string
  /** File size in bytes */
  size?: number
  /** File extension (e.g., ".png", ".pdf") */
  extension?: string
}

/**
 * Collection of binary content items keyed by name
 */
export interface BinaryContentMap {
  [key: string]: BinaryContent
}

/**
 * Tracks data source - which input item produced which output item
 * Used for tracing data flow through the workflow
 */
export interface DataSource {
  /** Index of the source item */
  sourceIndex: number
  /** Index of the input port (defaults to 0 if not specified) */
  inputPortIndex?: number
}

/**
 * Node output data structure - port name based
 * Maps output port names to data (single item or array of items)
 * Single item: { input: { test: "value" } }
 * Multiple items: { input: [{ test: "value1" }, { test: "value2" }] }
 */
export interface NodeOutput {
  /** Output data indexed by port name - can be single DataRecord or array */
  [portName: string]: DataRecord | DataRecord[]
}

/**
 * Node input data structure - port name based
 * Maps input port names to data (single item or array of items)
 * Single item: { input: { test: "value" } }
 * Multiple items: { input: [{ test: "value1" }, { test: "value2" }] }
 */
export interface NodeInput {
  /** Input data indexed by port name - can be single DataRecord or array */
  [portName: string]: DataRecord | DataRecord[]
}

