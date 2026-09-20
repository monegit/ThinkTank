# create-component

[English](README.md) | [한국어](README.ko.md)

## 역할

React 컴포넌트의 구조와 공개 API를 일관되게 설계·작성·리팩터링하는 스킬입니다. 합성 컴포넌트, 재사용 가능한 자식 컴포넌트, `tailwind-variants` 기반 스타일, 타입과 export 설계를 다룹니다.

## 사용하는 상황

새 UI 컴포넌트를 만들거나 기존 컴포넌트의 API·구조·스타일을 개선할 때 사용합니다. 여러 하위 요소가 상태나 동작을 공유하는 메뉴, 탭, 다이얼로그 같은 컴포넌트를 설계할 때도 적합합니다.

## 사용 방법

요청에 스킬 이름을 포함해 호출합니다.

```text
Use $create-component to implement a reusable profile menu component.
```

스타일에 `tailwind-variants`를 사용한다면 `$tailwind-variants-best-practice`도 함께 사용합니다.

## 파일 구조

컴포넌트의 배치 경로는 대상 프로젝트의 아키텍처를 따르고, 내부 파일은 책임별로 분리합니다.

```text
src/
└── components/
    └── Button/
        └── ActionButton/
            ├── index.tsx  # JSX와 동작
            ├── styles.ts  # 스타일 선언
            ├── types.ts   # 공개 Props와 타입
            ├── components/ # 재사용 가능한 자식 렌더링 컴포넌트
            ├── hooks/      # 상태와 관련 핸들러
            └── utils/      # 순수 계산
```

## 구현 규칙

- 루트 컴포넌트는 조합과 공개 API에 집중하고, 독립된 시각·상호작용 책임이 있는 자식은 별도 컴포넌트로 추출합니다.
- 함께 동작하는 상태 전이와 핸들러는 `hooks/`에, 결정론적 계산은 `utils/`에 둡니다.
- 각 컴포넌트 함수는 `props` 객체를 받고, 함수 본문 첫 부분에서 구조 분해 할당합니다.
- 컴포넌트 Props는 type alias가 아닌 `interface`로 정의하고, 모든 Props interface와 내부 속성에는 JSDoc을 작성합니다.
- interface JSDoc은 외부 소비자 관점으로 컴포넌트 자체를 설명하고, 각 속성 JSDoc은 구현 방식 없이 외부에 제공하는 값이나 동작을 설명합니다.
- 공개 컴포넌트 API에서 `className`을 받거나 전달하지 않고, 지원하는 모든 스타일은 `styles.ts`의 고정 클래스 또는 타입이 지정된 의미적 variant로 선언합니다.
- 네이티브 Props 계약에서는 `className`을 제외하며, 소비자 측 스타일 덮어쓰기 대신 선언된 variant를 추가하거나 확장합니다.
- 클릭 동작이 있는 모든 컨트롤의 선언 스타일에는 `cursor-pointer`를 추가합니다.
- 재사용 가능한 자식 렌더링 컴포넌트의 Props interface는 자식 파일이 아니라 부모 컴포넌트의 `types.ts`에 선언하고, 자식에서 import하여 사용합니다.
