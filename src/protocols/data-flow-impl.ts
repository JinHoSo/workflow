import type { NodeOutput, NodeInput } from "../interfaces"
import type { DataFlowProtocol } from "./data-flow"
import type { DataRecord } from "../interfaces"

/**
 * Default implementation of DataFlowProtocol
 * Handles data passing between nodes with proper normalization
 */
export class DataFlowProtocolImpl implements DataFlowProtocol {
  /**
   * Passes data from source output to destination input port
   * @param sourceOutput - Output data from source node (port name based)
   * @param destinationInputPort - Name of the destination input port
   * @returns Input data formatted for destination port
   */
  passData(sourceOutput: NodeOutput, destinationInputPort: string): NodeInput {
    const inputData: NodeInput = {}

    // If source has a matching output port name, use it
    // Otherwise, use the first available output port
    const outputPortName = sourceOutput[destinationInputPort] !== undefined
      ? destinationInputPort
      : Object.keys(sourceOutput)[0] || destinationInputPort

    const outputData = sourceOutput[outputPortName]
    if (outputData !== undefined) {
      // Normalize to array if needed
      const normalized = Array.isArray(outputData) ? outputData : [outputData]
      // Single item: return as object, multiple items: return as array
      inputData[destinationInputPort] = normalized.length === 1 ? normalized[0] : normalized
    }

    return inputData
  }

  /**
   * Combines data from multiple sources
   * @param sources - Array of output data from source nodes
   * @returns Combined output data
   */
  combineData(sources: NodeOutput[]): NodeOutput {
    const combined: NodeOutput = {}

    for (const source of sources) {
      for (const portName in source) {
        const sourceData = source[portName]
        if (sourceData !== undefined) {
          if (combined[portName] === undefined) {
            // First source for this port
            combined[portName] = Array.isArray(sourceData) ? sourceData : [sourceData]
          } else {
            // Combine with existing data
            const existing = Array.isArray(combined[portName])
              ? (combined[portName] as DataRecord[])
              : [combined[portName] as DataRecord]
            const newData = Array.isArray(sourceData) ? sourceData : [sourceData]
            combined[portName] = [...existing, ...newData]
          }
        }
      }
    }

    return combined
  }
}

/**
 * Global data flow protocol instance
 */
export const dataFlowProtocol = new DataFlowProtocolImpl()

