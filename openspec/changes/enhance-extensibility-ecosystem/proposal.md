# Change: Enhance Extensibility Ecosystem

## Why

현재 workflow 엔진은 기본적인 플러그인 시스템을 가지고 있지만, 오픈소스로 성장하기 위해서는 다음과 같은 개선이 필요합니다:

1. **개발자 경험 부족**: 새로운 노드를 만들기 위한 CLI 도구나 템플릿이 없어 진입 장벽이 높습니다
2. **수동 등록 필요**: 플러그인을 자동으로 발견하고 로드하는 메커니즘이 없습니다
3. **패키징 표준 부재**: 플러그인을 npm에 배포하기 위한 표준 패키징 방식이 없습니다
4. **커뮤니티 인프라 부족**: 노드 마켓플레이스, 검색, 설치 도구가 없습니다
5. **개발 도구 부족**: 노드 개발을 위한 테스트 유틸리티, 검증 도구, 핫 리로딩 등이 부족합니다
6. **문서화 부족**: 기여자를 위한 가이드라인과 모범 사례 문서가 부족합니다

이러한 개선을 통해 누구나 쉽게 노드를 개발하고 배포할 수 있는 생태계를 구축할 수 있습니다.

## What Changes

### 1. Node Development CLI
- **BREAKING**: 새로운 CLI 패키지 `@workflow/cli` 추가
- 노드/플러그인 생성, 빌드, 테스트, 배포를 위한 명령어 제공
- 템플릿 기반 스캐폴딩 지원

### 2. Plugin Discovery System
- npm 패키지에서 자동으로 플러그인 발견 및 로드
- 로컬 디렉토리에서 플러그인 자동 스캔
- 플러그인 메타데이터 기반 자동 등록

### 3. Plugin Packaging Standard
- 표준 플러그인 패키지 구조 정의
- `package.json` 기반 플러그인 메타데이터
- TypeScript 타입 정의 자동 생성

### 4. Community Infrastructure
- 플러그인 레지스트리/마켓플레이스 개념 도입
- 플러그인 검색 및 설치 CLI 명령어
- 플러그인 메타데이터 확장 (아이콘, 카테고리, 태그 등)

### 5. Developer Tools
- 노드 개발을 위한 테스트 유틸리티
- 프로토콜 준수 검증 도구
- 개발 모드 핫 리로딩
- 노드 디버깅 도구

### 6. Documentation & Guidelines
- 기여자 가이드 (CONTRIBUTING.md)
- 노드 개발 모범 사례
- 플러그인 배포 가이드
- 커뮤니티 가이드라인

## Impact

### Affected Specs
- `workflow-node-types`: 노드 타입 메타데이터 확장
- `workflow-extensibility`: 플러그인 시스템 개선 (새로 추가 필요)
- `workflow-nodes`: 노드 개발 도구 통합

### Affected Code
- `src/plugins/`: 플러그인 발견 및 로딩 로직 추가
- `src/core/node-type-registry.ts`: 자동 등록 메커니즘
- 새로운 패키지: `packages/cli/` (CLI 도구)
- 새로운 패키지: `packages/node-dev/` (개발 도구)

### Breaking Changes
- CLI 패키지 추가로 인한 의존성 변경
- 플러그인 패키징 구조 표준화 (기존 플러그인 마이그레이션 필요)

