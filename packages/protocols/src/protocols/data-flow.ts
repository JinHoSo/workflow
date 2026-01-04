import type { NodeOutput, NodeInput } from "@workflow/interfaces"

export interface DataFlowProtocol {
  passData(
    sourceOutput: NodeOutput,
    destinationInputPort: string,
  ): NodeInput
  combineData(sources: NodeOutput[]): NodeOutput
}
