/**
 * Tests for DataFlowProtocol
 * Tests data transformation and type compatibility
 */

import { DataFlowProtocolImpl, dataFlowProtocol } from "../data-flow-impl"
import type { NodeOutput } from "@workflow/interfaces"

describe("DataFlowProtocolImpl", () => {
  let protocol: DataFlowProtocolImpl

  beforeEach(() => {
    protocol = new DataFlowProtocolImpl()
  })

  describe("passData", () => {
    it("should pass data from source output to destination input", () => {
      const sourceOutput: NodeOutput = {
        output: [{ value: "test" }],
      }
      const inputData = protocol.passData(sourceOutput, "input")
      expect(inputData).toHaveProperty("input")
    })

    it("should normalize single item to object", () => {
      const sourceOutput: NodeOutput = {
        output: { value: "test" },
      }
      const inputData = protocol.passData(sourceOutput, "input")
      expect(inputData.input).toBeDefined()
    })

    it("should handle multiple items as array", () => {
      const sourceOutput: NodeOutput = {
        output: [{ value: "test1" }, { value: "test2" }],
      }
      const inputData = protocol.passData(sourceOutput, "input")
      expect(Array.isArray(inputData.input)).toBe(true)
    })
  })

  describe("combineData", () => {
    it("should combine data from multiple sources", () => {
      const sources: NodeOutput[] = [
        { output: [{ value: "test1" }] },
        { output: [{ value: "test2" }] },
      ]
      const combined = protocol.combineData(sources)
      expect(combined).toHaveProperty("output")
    })

    it("should merge data from same port names", () => {
      const sources: NodeOutput[] = [
        { output: [{ value: "test1" }] },
        { output: [{ value: "test2" }] },
      ]
      const combined = protocol.combineData(sources)
      const output = combined.output
      if (Array.isArray(output)) {
        expect(output.length).toBeGreaterThanOrEqual(2)
      }
    })
  })

  describe("global instance", () => {
    it("should export global protocol instance", () => {
      expect(dataFlowProtocol).toBeInstanceOf(DataFlowProtocolImpl)
    })
  })
})

