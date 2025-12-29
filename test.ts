import { Workflow } from "./src/core/workflow"
import { ScheduleTrigger } from "./src/triggers/schedule-trigger"
import { HttpRequestNode } from "./src/nodes/http-request-node"
import { JavaScriptNode } from "./src/nodes/javascript-execution-node"
import { ExecutionEngine } from "./src/execution/execution-engine"
import type { ScheduleConfig } from "./src/interfaces/schedule"

/**
 * 뉴스 URL 수집 워크플로우
 *
 * 이 워크플로우는:
 * 1. 3분마다 실행되는 스케줄 트리거를 사용합니다
 * 2. HTTP Request Node로 다음(Daum) 뉴스 검색 페이지에서 HTML을 가져옵니다
 * 3. JavaScript Node로 HTML에서 텍스트만 추출합니다
 */
async function createNewsCollectionWorkflow(): Promise<void> {
  // 워크플로우 생성
  const workflow = new Workflow("news-collection-workflow", undefined, "뉴스 URL 수집")

  // 1. Schedule Trigger 생성 (3분마다 실행)
  const scheduleConfig: ScheduleConfig = {
    type: "interval",
    intervalMs: 1 * 10 * 1000, // 3분 (밀리초)
  }

  const scheduleTrigger = new ScheduleTrigger({
    id: "trigger-1",
    name: "schedule-trigger",
    nodeType: "schedule-trigger",
    version: 1,
    position: [0, 0],
  })

  // 2. HTTP Request Node 생성
  const httpRequestNode = new HttpRequestNode({
    id: "http-1",
    name: "http-request-node",
    nodeType: "http-request",
    version: 1,
    position: [200, 0],
  })

  // 3. JavaScript Node 생성 (HTML에서 텍스트 추출)
  const javascriptNode = new JavaScriptNode({
    id: "js-1",
    name: "javascript-node",
    nodeType: "javascript",
    version: 1,
    position: [400, 0],
  })

  // 노드들을 워크플로우에 추가
  workflow.addTriggerNode(scheduleTrigger)
  workflow.addNode(httpRequestNode)
  workflow.addNode(javascriptNode)

  // 노드들 연결
  workflow.linkNodes("schedule-trigger", "output", "http-request-node", "input")
  workflow.linkNodes("http-request-node", "output", "javascript-node", "input")

  // 노드 설정
  // Schedule Trigger 설정
  scheduleTrigger.setup({ schedule: scheduleConfig })

  // HTTP Request Node 설정
  // 다음 뉴스 검색 URL: https://search.daum.net/search?w=news&q=google&enc=utf-8
  httpRequestNode.setup({
    method: "GET",
    url: "https://search.daum.net/search",
    queryParameters: {
      w: "news",
      q: "google",
      enc: "utf-8",
    },
    timeout: 30000, // 30초 타임아웃
  })

  // JavaScript Node 설정
  // HTML에서 텍스트만 추출하는 코드
  const extractTextCode = `
    // 입력 데이터에서 HTTP 응답 가져오기
    const inputData = input();

    // HTTP 응답의 body에서 HTML 가져오기
    const htmlBody = inputData.body;

    if (typeof htmlBody !== 'string') {
      throw new Error('Expected HTML body to be a string');
    }

    // HTML에서 텍스트만 추출
    // 간단한 텍스트 추출: HTML 태그 제거
    let text = htmlBody
      // HTML 태그 제거
      .replace(/<script[^>]*>([\\s\\S]*?)<\\/script>/gi, '')
      .replace(/<style[^>]*>([\\s\\S]*?)<\\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      // HTML 엔티티 디코딩
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      // 연속된 공백 제거
      .replace(/\\s+/g, ' ')
      .trim();
		console.log("js text: ", text)

    // 결과 반환
    return {
      extractedText: text,
      originalUrl: inputData.request?.url || '',
      statusCode: inputData.statusCode || 0,
      timestamp: new Date().toISOString(),
    };
  `

  javascriptNode.setup({
    code: extractTextCode,
  })

  // 워크플로우 실행 엔진 생성
  const engine = new ExecutionEngine(workflow)

  // Schedule Trigger에 ExecutionEngine 설정
  // ScheduleTrigger가 스케줄 시간이 되면 자동으로 워크플로우를 실행합니다
  scheduleTrigger.setExecutionEngine(engine)

  // Schedule Trigger 활성화
  scheduleTrigger.trigger()

  console.log("뉴스 URL 수집 워크플로우가 시작되었습니다.")
  console.log("다음 실행 시간:", scheduleTrigger.getNextExecutionTime()?.toISOString())
  console.log("워크플로우 ID:", workflow.id)
  console.log("워크플로우 이름:", workflow.name)
}

// 워크플로우 생성 및 실행
createNewsCollectionWorkflow().catch((error) => {
  console.error("Failed to create workflow:", error)
  process.exit(1)
})

