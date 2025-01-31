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

## QueryCache

QueryCache는 메모리에 Query를 캐싱하는 역할을 담당합니다. Map 객체 기반으로 구현되어 있으며, queryKey 값을 해싱하여 key로 활용합니다.

- **key**: Query의 queryKey 값을 기반으로 해싱된 값을 사용합니다. 해싱함수는 JSON.stringify 기반의 [hashKey](./tanstack-query-lite/core/util.js#L2) 함수를 사용합니다.
- **value**: Query

> QueryCache 어떤 메소드로 Query를 추가하나요?

build 메소드를 기반으로 Query를 추가합니다. 만약 queryKey 값에 해당하는 Query가 이미 존재한다면, 캐싱되어 있는 Query를 반환하여 불필요한 Query 객체의 인스턴스 생성을 방지합니다.

### 1. 저장소 초기화

```js
constructor() {
this.queries = new Map(); // Map<queryHash, Query>
}
```

| 항목        | 설명               | 자료구조 특징              |
| ----------- | ------------------ | -------------------------- |
| `Map`       | 쿼리 저장 컨테이너 | Key-Value 쌍 관리          |
| `queryHash` | 고유 식별자        | `hashKey(queryKey)`로 생성 |

### 2. 핵심 메서드

#### 🔍 `get()` - 쿼리 조회

```js
get = (queryHash) => {
  return this.queries.get(queryHash); // O(1) 조회
};
```

- **동작**: 해시 기반 직접 접근
- **사용 예시**: 캐시 히트 확인

#### 🛠️ `build()` - 쿼리 생성/반환

```js
build(client, options) {
  const queryKey = options.queryKey;
  const queryHash = hashKey(queryKey);

  let query = this.get(queryHash);

  if (!query) {
    query = new Query({
      cache: this,
      queryKey,
      queryHash,
      options: client.defaultQueryOptions(options)
    });

    this.queries.set(query.queryHash, query);
  }

  return query;
}

remove = (query) => {
  this.queries.delete(query.queryHash);
};
```

**작동 순서**:

1. 쿼리 키 → 해시 변환
2. 기존 캐시 확인
3. 캐시 미존재 시 새 Query 생성
4. 옵션 병합(`client.defaultQueryOptions()`)
5. 캐시 등록

#### 🗑️ `remove()` - 쿼리 삭제

```js
remove = (query) => {
  this.queries.delete(query.queryHash);
};
```

- **목적**: 명시적 캐시 무효화
- **사용 시점**: 데이터 업데이트/에러 발생 시

### 🎯 설계 패턴

#### 1. 해시 기반 캐싱

```js
const queryHash = hashKey(queryKey);
```

- **장점**: 복잡한 객체도 단순 문자열로 관리
- **전형적 사용처**: 상태 관리 라이브러리(React Query 등)

#### 2. 지연 생성(Lazy Loading)

```js
if (!query) {
  /* 새 인스턴스 생성 */
}
```

- **최적화**: 실제 사용 시점에 인스턴스 생성
- **효과**: 불필요한 메모리 사용 방지

#### 3. 옵션 병합 구조

- 사용자 옵션 → 클라이언트 기본값 → 글로벌 기본값
- **우선순위**: 구체적 설정이 일반 설정을 덮어씀
