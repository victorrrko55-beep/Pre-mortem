# Pre-mortem → Assumption Mapping

프로젝트가 실패했다고 미리 상상해보고(Pre-mortem), 그 실패 원인 뒤에 숨은
가정을 뽑아내어 무엇을 먼저 검증해야 하는지(Assumption Mapping) 정리하는
웹 앱입니다.

## 진행 순서

1. **프로젝트 설정**: 점검할 프로젝트 이름과 목표를 입력합니다.
2. **Pre-mortem**: "이 프로젝트가 실패했다"고 상상하고 떠오르는 실패 원인을
   최대한 많이 적습니다.
3. **Assumption Mapping**: 각 실패 원인을 "무엇이 참이어야 실패하지 않았을까"
   라는 가정 문장으로 바꾸고, 카드를 드래그해서 **중요도**(세로축)와
   **근거 수준**(가로축) 2×2 지도 위에 배치합니다.
4. **검증 우선순위**: 중요하지만 근거가 부족한 "Leap of faith" 가정부터
   검증하도록 우선순위가 매겨진 목록을 확인하고, Markdown으로 내보냅니다.

입력한 내용은 브라우저 `localStorage`에 자동 저장됩니다(별도 서버/로그인 없음).

## 개발

```bash
npm install
npm run dev      # 개발 서버
npm run build    # 타입체크 + 프로덕션 빌드
npm run lint     # oxlint
```

## 스택

- React 19 + TypeScript + Vite
- Tailwind CSS 4
- Zustand (localStorage persist)
