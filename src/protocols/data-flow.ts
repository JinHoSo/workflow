import type { NodeOutput, NodeInput } from "../interfaces"

export interface DataFlowProtocol {
  passData(
    sourceOutput: NodeOutput,
    destinationInputPort: string,
  ): NodeInput
  combineData(sources: NodeOutput[]): NodeOutput
}
