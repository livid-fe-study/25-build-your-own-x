## STEP 0. 준비

이 리액트 앱은 단 세 줄의 코드로 구성된다.

```js
const element = <h1 title="foo">Hello</h1>; // React Element 정의
const container = document.getElementById("root"); // DOM에서 노드를 가져온다.
ReactDOM.render(element, container); // React Element를 container에 렌더링한다.
```

JSX는 Babel과 같은 빌드 도구를 통해 JS로 변환된다. 태그 이름, props, children을 매개변수로 전달하여 태그 내부의 코드를 `createElement` 함 호출로 대체하는 간단한 변환 방식이다.

`React.createElement`는 인자로부터 객체를 생성한다, 몇 가지 유효성 검사를 제외하고는 그게 전부임. 따라서 함수 호출을 출력으로 안전하게 대체할 수 있다.

```diff
-const element = <h1 title="foo">Hello</h1>;
+const element = {
+  type: "h1",
+  props: {
+    title: "foo",
+    children: "Hello",
+  },
+}
​
const container = document.getElementById("root")
ReactDOM.render(element, container)
```

- `type`: 생성하려는 DOM 노드의 유형을 지정하는 문자열, HTML 요소를 생성할 떄 `document.createElement`에 전달한 태그 이름
- `props`: 객체. JSX 속상의 모든 key와 value를 가지고 있다. 또한 `children`이라는 특별한 속성이 있다.
- `children`: 일반적으로 더 많은 elements들이 있는 배열 -> 그렇기 때문에 Elemen는 tree이기도 하다.

교체해야 할 다른 React 코드는 ReactDOM.render에 대한 호출이다. 렌더링은 React가 DOM을 변경하는 곳이므로 직접 업데이트해 보겠습니다.

```diff
const element = {
  type: "h1",
  props: {
    title: "foo",
    children: "Hello",
  },
}
​
const container = document.getElementById("root")
-ReactDOM.render(element, container)

+const node = document.createElement(element.type)
+node["title"] = element.props.title
+
+ // children으로 문자열만 있으므로 textNode를 생성한다.
+const text = document.createTextNode("")
+text["nodeValue"] = element.props.children
+
+node.appendChild(text)
+container.appendChild(node)
```

`innerText`를 설정하는 대신 `textNode`를 사용하면 나중에 모든 요소를 같은 방식으로 처리할 수 있다. `h1` title에서 했던 것처럼 `nodeValue`를 설정한 방법도 주목하세요. (props: {nodeValue: "hello"}.)

<details>
<summary>
  STEP 0.전체 코드
</summary>

```js
const element = {
  type: "h1",
  props: {
    title: "foo",
    children: "Hello",
  },
}
​
const container = document.getElementById("root")
​
const node = document.createElement(element.type)
node["title"] = element.props.title
​
const text = document.createTextNode("")
text["nodeValue"] = element.props.children
​
node.appendChild(text)
container.appendChild(node)
```

</details>

## STEP 1. `createElement` 함수

## STEP 2. `render` 함수

## STEP 3. 동시성 모드

## STEP 4. Fibers

## STEP 5. Render와 Commit Phases

## STEP 6. Reconciliation

## STEP 7. Function Components

## STEP 8. Hooks
