import { Workflow } from "../core/workflow"
import { WorkflowNodeBase } from "../core/base-node"
import { ManualTrigger } from "../triggers/manual-trigger"
import { ScheduleTrigger } from "../triggers/schedule-trigger"
import { ExecutionEngine } from "../execution/execution-engine"
import type { NodeOutput } from "../interfaces"
import type { ExecutionContext } from "../interfaces/execution-state"
import type { ScheduleConfig } from "../interfaces/schedule"
import { NodeState } from "../types"

class TestNode extends WorkflowNodeBase {
  protected async process(context: ExecutionContext): Promise<NodeOutput> {
    return context.input
  }
}

describe("Workflow", () => {
  let workflow: Workflow

  beforeEach(() => {
    workflow = new Workflow("test-workflow")
  })

  test("should create workflow with id", () => {
    expect(workflow.id).toBe("test-workflow")
  })

  test("should add node", () => {
    const node = new TestNode({
      id: "node-1",
      name: "node1",
      nodeType: "test",
      version: 1,
      position: [0, 0],
    })
    workflow.addNode(node)
    expect(workflow.nodes["node1"]).toBe(node)
  })

  test("should link nodes", () => {
    const node1 = new TestNode({
      id: "node-1",
      name: "node1",
      nodeType: "test",
      version: 1,
      position: [0, 0],
    })
    node1.addOutput("output", "data")

    const node2 = new TestNode({
      id: "node-2",
      name: "node2",
      nodeType: "test",
      version: 1,
      position: [100, 0],
    })
    node2.addInput("input", "data")

    workflow.addNode(node1)
    workflow.addNode(node2)

    workflow.linkNodes("node1", "output", "node2", "input")

    expect(workflow.linksBySource["node1"]["input"]).toBeDefined()
    expect(workflow.linksByTarget["node2"]["input"]).toBeDefined()
  })

  test("should reject link with type mismatch", () => {
    const node1 = new TestNode({
      id: "node-1",
      name: "node1",
      nodeType: "test",
      version: 1,
      position: [0, 0],
    })
    node1.addOutput("output", "data1")

    const node2 = new TestNode({
      id: "node-2",
      name: "node2",
      nodeType: "test",
      version: 1,
      position: [100, 0],
    })
    node2.addInput("input", "data2")

    workflow.addNode(node1)
    workflow.addNode(node2)

    expect(() => {
      workflow.linkNodes("node1", "output", "node2", "input")
    }).toThrow("Port type mismatch")
  })

  test("should allow multiple nodes to link to the same input", () => {
    const node1 = new TestNode({
      id: "node-1",
      name: "node1",
      nodeType: "test",
      version: 1,
      position: [0, 0],
    })
    node1.addOutput("output", "data")

    const node2 = new TestNode({
      id: "node-2",
      name: "node2",
      nodeType: "test",
      version: 1,
      position: [100, 0],
    })
    node2.addOutput("output", "data")

    const node3 = new TestNode({
      id: "node-3",
      name: "node3",
      nodeType: "test",
      version: 1,
      position: [200, 0],
    })
    node3.addInput("input", "data")

    workflow.addNode(node1)
    workflow.addNode(node2)
    workflow.addNode(node3)

    // node1과 node2가 모두 node3의 input에 연결
    workflow.linkNodes("node1", "output", "node3", "input")
    workflow.linkNodes("node2", "output", "node3", "input")

    // node3의 input에 2개의 link가 있어야 함
    expect(workflow.linksByTarget["node3"]["input"]).toHaveLength(2)
    expect(workflow.linksByTarget["node3"]["input"][0].targetNode).toBe("node1")
    expect(workflow.linksByTarget["node3"]["input"][1].targetNode).toBe("node2")
    expect(workflow.linksByTarget["node3"]["input"][0].outputPortName).toBe("output")
    expect(workflow.linksByTarget["node3"]["input"][1].outputPortName).toBe("output")
  })

  test("should allow same node's different outputs to link to same input", () => {
    const node1 = new TestNode({
      id: "node-1",
      name: "node1",
      nodeType: "test",
      version: 1,
      position: [0, 0],
    })
    node1.addOutput("output1", "data")
    node1.addOutput("output2", "data")

    const node2 = new TestNode({
      id: "node-2",
      name: "node2",
      nodeType: "test",
      version: 1,
      position: [100, 0],
    })
    node2.addInput("input", "data")

    workflow.addNode(node1)
    workflow.addNode(node2)

    // node1의 output1과 output2가 모두 node2의 input에 연결
    workflow.linkNodes("node1", "output1", "node2", "input")
    workflow.linkNodes("node1", "output2", "node2", "input")

    // node2의 input에 2개의 link가 있어야 함
    expect(workflow.linksByTarget["node2"]["input"]).toHaveLength(2)
    expect(workflow.linksByTarget["node2"]["input"][0].outputPortName).toBe("output1")
    expect(workflow.linksByTarget["node2"]["input"][1].outputPortName).toBe("output2")
  })

  test("should correctly identify output ports by name when multiple nodes link to same input", () => {
    // 여러 노드가 같은 input에 연결될 때, 각 link가 올바른 output 포트 이름을 가지고 있는지 확인
    const node1 = new TestNode({
      id: "node-1",
      name: "node1",
      nodeType: "test",
      version: 1,
      position: [0, 0],
    })
    node1.addOutput("output1", "data")
    node1.addOutput("output2", "data")

    const node2 = new TestNode({
      id: "node-2",
      name: "node2",
      nodeType: "test",
      version: 1,
      position: [100, 0],
    })
    node2.addOutput("output", "data")

    const node3 = new TestNode({
      id: "node-3",
      name: "node3",
      nodeType: "test",
      version: 1,
      position: [200, 0],
    })
    node3.addInput("input", "data")

    workflow.addNode(node1)
    workflow.addNode(node2)
    workflow.addNode(node3)

    // node1의 output1과 output2, 그리고 node2의 output이 모두 node3의 input에 연결
    workflow.linkNodes("node1", "output1", "node3", "input")
    workflow.linkNodes("node1", "output2", "node3", "input")
    workflow.linkNodes("node2", "output", "node3", "input")

    // node3의 input에 3개의 link가 있어야 함
    expect(workflow.linksByTarget["node3"]["input"]).toHaveLength(3)

    // 각 link가 올바른 output 포트 이름을 가지고 있는지 확인
    const links = workflow.linksByTarget["node3"]["input"]
    const outputPortNames = links.map((link) => link.outputPortName).sort()
    expect(outputPortNames).toEqual(["output", "output1", "output2"])

    // 각 link가 올바른 source 노드를 가리키는지 확인
    const sourceNodes = links.map((link) => link.targetNode).sort()
    expect(sourceNodes).toEqual(["node1", "node1", "node2"])
  })

  describe("Manual Trigger Integration", () => {
    test("should execute workflow with manual trigger", async () => {
      const trigger = new ManualTrigger({
        id: "trigger-1",
        name: "manual-trigger",
        nodeType: "manual-trigger",
        version: 1,
        position: [0, 0],
      })

      const node1 = new TestNode({
        id: "node-1",
        name: "node1",
        nodeType: "test",
        version: 1,
        position: [100, 0],
      })
      node1.addInput("input", "data")
      node1.addOutput("output", "data")

      workflow.addNode(trigger)
      workflow.addNode(node1)
      workflow.linkNodes("manual-trigger", "output", "node1", "input")

      trigger.setup({})
      node1.setup({})

      const engine = new ExecutionEngine(workflow)

      // Manual trigger 실행
      trigger.trigger()
      await engine.execute("manual-trigger")

      expect(trigger.state).toBe(NodeState.Completed)
      expect(node1.state).toBe(NodeState.Completed)
    })

    test("should execute workflow with manual trigger and custom data", async () => {
      const trigger = new ManualTrigger({
        id: "trigger-1",
        name: "manual-trigger",
        nodeType: "manual-trigger",
        version: 1,
        position: [0, 0],
      })

      const node1 = new TestNode({
        id: "node-1",
        name: "node1",
        nodeType: "test",
        version: 1,
        position: [100, 0],
      })
      node1.addInput("input", "data")
      node1.addOutput("output", "data")

      workflow.addNode(trigger)
      workflow.addNode(node1)
      workflow.linkNodes("manual-trigger", "output", "node1", "input")

      trigger.setup({ initialData: { output: { value: "test-data" } } })
      node1.setup({})

      const engine = new ExecutionEngine(workflow)

      // Manual trigger 실행
      trigger.trigger()
      await engine.execute("manual-trigger")

      expect(trigger.state).toBe(NodeState.Completed)
      expect(node1.state).toBe(NodeState.Completed)
    })
  })

  describe("Schedule Trigger Integration", () => {
    beforeEach(() => {
      // Use fake timers for schedule trigger tests
      jest.useFakeTimers()
      // Set a fixed system time for consistent testing
      jest.setSystemTime(new Date("2024-01-01T12:00:00Z"))
    })

    afterEach(() => {
      // Clear all timers and restore real timers
      jest.clearAllTimers()
      jest.useRealTimers()
    })

    test("should execute workflow with schedule trigger after 1 minute", async () => {
      const trigger = new ScheduleTrigger({
        id: "trigger-1",
        name: "schedule-trigger",
        nodeType: "schedule-trigger",
        version: 1,
        position: [0, 0],
      })

      const node1 = new TestNode({
        id: "node-1",
        name: "node1",
        nodeType: "test",
        version: 1,
        position: [100, 0],
      })
      node1.addInput("input", "data")
      node1.addOutput("output", "data")

      workflow.addNode(trigger)
      workflow.addNode(node1)
      workflow.linkNodes("schedule-trigger", "output", "node1", "input")

      // 현재 시간: 12:00:00
      // 1분 후 (12:01:00)에 트리거되도록 설정
      const scheduleConfig: ScheduleConfig = {
        type: "minute",
        second: 0, // 매분 0초에 실행
      }

      trigger.setup({ schedule: scheduleConfig })
      node1.setup({})

      // Schedule trigger에 callback 설정 (workflow 실행을 위해 필요)
      let triggerExecuted = false
      trigger.setCallback(() => {
        triggerExecuted = true
      })

      const engine = new ExecutionEngine(workflow)

      // Schedule trigger가 활성화되었는지 확인
      const nextExecutionTime = trigger.getNextExecutionTime()
      expect(nextExecutionTime).toBeDefined()

      if (nextExecutionTime) {
        // 현재 시간에서 다음 실행 시간까지의 밀리초 계산
        const now = new Date()
        const delayMs = nextExecutionTime.getTime() - now.getTime()

        // 현재 시간이 12:00:00이고, 다음 분의 0초는 12:01:00이므로
        // 정확히 60초(1분 = 60000ms) 후여야 함
        expect(delayMs).toBe(60 * 1000) // 정확히 1분

        // 초기 상태 확인 (아직 실행되지 않음)
        expect(trigger.state).toBe(NodeState.Ready)
        expect(triggerExecuted).toBe(false)

        // 30초만 이동 (아직 실행되지 않아야 함)
        jest.advanceTimersByTime(30 * 1000)
        expect(triggerExecuted).toBe(false)
        expect(trigger.state).toBe(NodeState.Ready)

        // 나머지 30초 이동 (총 1분, 이제 실행되어야 함)
        jest.advanceTimersByTime(30 * 1000)

        // Schedule trigger가 실행되었는지 확인
        expect(triggerExecuted).toBe(true)
        expect(trigger.state).toBe(NodeState.Completed)

        // Workflow 실행
        await engine.execute("schedule-trigger")

        expect(node1.state).toBe(NodeState.Completed)
      }
    })

    test("should execute workflow with schedule trigger using minute schedule", async () => {
      const trigger = new ScheduleTrigger({
        id: "trigger-1",
        name: "schedule-trigger",
        nodeType: "schedule-trigger",
        version: 1,
        position: [0, 0],
      })

      const node1 = new TestNode({
        id: "node-1",
        name: "node1",
        nodeType: "test",
        version: 1,
        position: [100, 0],
      })
      node1.addInput("input", "data")
      node1.addOutput("output", "data")

      workflow.addNode(trigger)
      workflow.addNode(node1)
      workflow.linkNodes("schedule-trigger", "output", "node1", "input")

      // 현재 시간: 12:00:00
      // 매분 30초에 실행되도록 설정 (다음 실행: 12:00:30, 즉 30초 후)
      const scheduleConfig: ScheduleConfig = {
        type: "minute",
        second: 30,
      }

      trigger.setup({ schedule: scheduleConfig })
      node1.setup({})

      // Schedule trigger에 callback 설정
      let triggerExecuted = false
      trigger.setCallback(() => {
        triggerExecuted = true
      })

      const engine = new ExecutionEngine(workflow)

      // Schedule trigger가 활성화되었는지 확인
      const nextExecutionTime = trigger.getNextExecutionTime()
      expect(nextExecutionTime).toBeDefined()

      if (nextExecutionTime) {
        // 현재 시간에서 다음 실행 시간까지의 밀리초 계산
        const now = new Date()
        const delayMs = nextExecutionTime.getTime() - now.getTime()

        // 30초 후여야 함 (12:00:00 -> 12:00:30)
        expect(delayMs).toBe(30 * 1000)

        // 초기 상태 확인
        expect(trigger.state).toBe(NodeState.Ready)
        expect(triggerExecuted).toBe(false)

        // 다음 실행 시간까지 시간 이동 (30초 후)
        jest.advanceTimersByTime(delayMs)

        // Schedule trigger가 실행되었는지 확인
        expect(triggerExecuted).toBe(true)
        expect(trigger.state).toBe(NodeState.Completed)

        // Workflow 실행
        await engine.execute("schedule-trigger")

        expect(node1.state).toBe(NodeState.Completed)
      }
    })
  })
})
