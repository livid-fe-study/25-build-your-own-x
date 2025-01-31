## QueryClient

`QueryClient`는 `QueryCache`를 의존하며, 데이터 패칭 및 캐시 무효화와 같은 기능을 제공합니다. 예를 들어 데이터 패칭은 `Query`에 구현되어 있습니다.

> **defaultOptions 값은 무엇인가요?**
>
> Query의 기본 옵션을 전역으로 설정하는 값 입니다.

`QueryClient` 클래스는 쿼리 관리를 위한 중추적인 로직을 담고 있는 구조입니다. 주로 상태 관리 라이브러리(React Query, SWR 등)에서 사용되는 패턴을 구현한 것으로 보입니다.

### 클래스 구조 핵심 분석

```js
class QueryClient {
  cache; // 클래스 필드 선언

  constructor(config) {
    this.cache = config.cache || new QueryCache();
    this.defaultOptions = config.defaultOptions;
  }

  // 화살표 함수 메서드
  getQueryCache = () => {
    /*...*/
  };

  defaultQueryOptions = (options) => {
    /*...*/
  };
}
```

### 주요 컴포넌트 해부

1. 캐시 관리 시스템 (cache)

   - 역할: 모든 쿼리 데이터 저장소
   - 초기화 로직
     ```javascript
     this.cache = config.cache || new QueryCache();
     ```
   - 외부에서 캐시 인스턴스 주입 가능(테스트 용이성)
   - 기본값으로 새 `QueryCache` 생성

2. 생성자 구성 (constructor)
   ```javascript
   constructor(config) {
   this.cache = config.cache || new QueryCache();
   this.defaultOptions = config.defaultOptions;
   }
   ```
   - 구성 객체 패턴: 확장성 있는 설정 관리
   - 옵션 기본값 처리: 사용자 정의 옵션 우선 적용

### 메서드 기능 설명

1. `getQueryCache()`

   ```javascript
   getQueryCache = () => {
     return this.cache;
   };
   ```

   - 캐시 인스턴스 반환: 외부 모듈과의 상호작용 용이
   - 화살표 함수 사용: this 바인딩 문제 방지

2. `defaultQueryOptions()`

   ```javascript
   defaultQueryOptions = (options) => {
     const mergedQueryOptions = {
       ...this.defaultOptions?.queries, // 옵셔널 체이닝
       ...options, // 사용자 옵션 병합
     };

     return {
       ...mergedQueryOptions,
       queryHash:
         mergedQueryOptions.queryHash || hashKey(mergedQueryOptions.queryKey),
     };
   };
   ```

   **작동 단계**:

   - 1. 옵션 병합: 기본 설정 + 사용자 설정
   - 2. 해시 생성: `hashKey` 유틸리티 활용
   - 3. 최종 객체 반환: 불변성 유지

### 설계 패턴 분석

1. 의존성 주입

- 캐시 인스턴스를 외부에서 주입 가능하도록 설계

```javascript
// 사용 예시
const customCache = new QueryCache();
new QueryClient({ cache: customCache });
```

2. 옵션 합성 전략

```javascript
{
  ...defaults,
  ...userOptions,
  queryHash: customHash || generatedHash
}
```

- 기본값 → 사용자값 순으로 병합
- 해시 생성 로직 분리

3. 불변성 유지

   - 객체 스프레드 사용으로 새 객체 생성
   - 사이드 이펙트 최소화
