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

먼저 자체 `createElement`를 작성하는 것부터 시작해보겠습니다.
`createElement` 호출을 볼 수 있도록 JSX를 JS로 변환해 보겠습니다.

```js
const element = (
  <div id="foo">
    <a>bar</a>
    <b />
  </div>
);
const container = document.getElementById("root");
ReactDOM.render(element, container);
```

element는 type과 props가 있는 객체입니다. 함수가 해야할 일은 해당 객체를 생성하는 것 뿐입니다.

```diff
-const element = (
-  <div id="foo">
-    <a>bar</a>
-    <b />
-  </div>
-);

+const element = React.createElement(
+  "div",
+  { id: "foo" },
+  React.createElement("a", null, "bar"),
+  React.createElement("b")
+);
```

`props`에는 스프레드 연산자를 사용하고 children에는 나머지 매개변수 구문을 사요하므로 children prop은 항상 배열이 된다.

```js
function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children,
    },
  };
}
```

**예시)**
`createElement("div")` returns:

```js
{
"type": "div",
"props": { "children": [] }
}
```

`createElement("div", null, a)` returns:

```js
{
"type": "div",
"props": { "children": [a] }
}
```

`createElement("div", null, a, b)` returns:

```js
{
"type": "div",
"props": { "children": [a, b] }
}
```

`children` 배열에는 문자열이나 숫자와 같은 원시 값도 포함될 수 있습니다. 따라서 객체가 아닌 모든 것을 자체 엘리먼트 안에 감싸고 이를 위한 특별한 유형을 만들겠습니다: `TEXT_ELEMENT`.

```diff
-function createElement(type, props, ...children) {
-  return {
-    type,
-    props: {
-      ...props,
-      children,
-    },
-  };
-}
+function createElement(type, props, ...children) {
+  return {
+    type,
+    props: {
+      ...props,
+      children: children.map(child =>
+        typeof child === "object"
+          ? child
+          : createTextElement(child)
+      ),
+    },
+  }
+}
+​
+function createTextElement(text) {
+  return {
+    type: "TEXT_ELEMENT",
+    props: {
+      nodeValue: text,
+      children: [],
+    },
+  }
+}
```

우리는 여전히 React의 `createElement`를 사용하고 있습니다. 이를 대체하기 위해 라이브러리에 이름을 지정해 보겠습니다. React처럼 들리면서도 그 교훈적인 목적을 암시하는 이름이 필요합니다. 이것을 '`Didact`'라고 부르겠습니다.

```js
function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map(child =>
        typeof child === "object"
          ? child
          : createTextElement(child)
      ),
    },
  }
}
​
function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  }
}
const Didact = {
  createElement,
}
​
const element = Didact.createElement(
  "div",
  { id: "foo" },
  Didact.createElement("a", null, "bar"),
  Didact.createElement("b")
)
```

```diff
-const element = Didact.createElement(
-  "div",
-  { id: "foo" },
-  Didact.createElement("a", null, "bar"),
-  Didact.createElement("b")
-)

+/** @jsx Didact.createElement */
+const element = (
+  <div id="foo">
+    <a>bar</a>
+    <b />
+  </div>
+)
```

이와 같은 주석이 있으면 babel이 JSX를 트랜스파일할 때 우리가 정의한 함수를 사용합니다.

## STEP 2. `render` 함수

다음으로 `ReactDOM.render` 함수를 작성해야 합니다.

지금은 DOM에 항목을 추가하는 것만 신경쓰고 있습니다. 업데이트 및 삭제는 나중에 처리하겠습니다.

```diff
+function render(element, container) {
+  // TODO create dom nodes
+}
​
const Didact = {
  createElement,
+  render,
}
/** @jsx Didact.createElement */
const element = (
  <div id="foo">
    <a>bar</a>
    <b />
  </div>
)
const container = document.getElementById("root")
-ReactDOM.render(element, container)
+Didact.render(element, container)
```

먼저 element type을 사용하여 DOM 노드를 생성한 다음 새 노드를 컨테이너에 추가합니다.

```js
function render(element, container) {
  const dom = document.createElement(element.type)
​
  container.appendChild(dom)
}
```

각 children에 대해 동일한 작업을 반복적으로 수행합니다.

```diff
function render(element, container) {
  const dom = document.createElement(element.type)
​
+  element.props.children.forEach(child =>
+    render(child, dom)
+  )
​
  container.appendChild(dom)
}
```

또한 텍스트 element를 처리해야 하는데, element type이 `TEXT_ELEMENT`인 경우 일반 노드 대신 텍스트 노드를 생성합니다.

```diff
function render(element, container) {
-  const dom = document.createElement(element.type)
+​  const dom =
+    element.type == "TEXT_ELEMENT"
+      ? document.createTextNode("")
+      : document.createElement(element.type)
​
  element.props.children.forEach(child =>
    render(child, dom)
  )
​
  container.appendChild(dom)
}
```

여기서 마지막으로 해야할 일은 props를 노드에 할당하는 것입니다.

```diff
function render(element, container) {
  const dom =
    element.type == "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(element.type)
​
+  const isProperty = key => key !== "children"
+  Object.keys(element.props)
+    .filter(isProperty)
+    .forEach(name => {
+      dom[name] = element.props[name]
+    })
​
  element.props.children.forEach(child =>
    render(child, dom)
  )
​
  container.appendChild(dom)
}
```

그게 다입니다. 이제 JSX를 DOM에 렌더링할 수 있는 라이브러리가 생겼습니다.

<details>
<summary>
  STEP 1~2.전체 코드
</summary>

```js
function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map(child =>
        typeof child === "object"
          ? child
          : createTextElement(child)
      ),
    },
  }
}
​
function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  }
}
​
function render(element, container) {
  const dom =
    element.type == "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(element.type)
​
  const isProperty = key => key !== "children"
  Object.keys(element.props)
    .filter(isProperty)
    .forEach(name => {
      dom[name] = element.props[name]
    })
​
  element.props.children.forEach(child =>
    render(child, dom)
  )
​
  container.appendChild(dom)
}
​
const Didact = {
  createElement,
  render,
}
​
/** @jsx Didact.createElement */
const element = (
  <div id="foo">
    <a>bar</a>
    <b />
  </div>
)
const container = document.getElementById("root")
Didact.render(element, container)

```

</details>

## STEP 3. 동시성 모드

하지만 코드를 더 추가하기 전에 리팩터링이 필요합니다.

```js
function render(element, container) {
  const dom =
    element.type == "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(element.type)
​
  const isProperty = key => key !== "children"
  Object.keys(element.props)
    .filter(isProperty)
    .forEach(name => {
      dom[name] = element.props[name]
    })
​
  element.props.children.forEach(child =>
    render(child, dom)
  )
​
  container.appendChild(dom)
}
```

이 재귀 호출에 문제가 있습니다. 렌더링을 시작하면 전체 트리 요소를 렌더링할 때까지 멈추지 않습니다. 요소 트리가 크면 메인 스레드를 너무 오래 차단할 수 있습니다. 또한 브라우저에서 사용자 입력을 처리하거나 애니메이션을 원활하게 유지하는 등 우선순위가 높은 작업을 수행해야 하는 경우 렌더링이 완료될 때까지 기다려야 합니다.

따라서 작업을 자근 단위로 나누고 각 단위를 완료한 후 다른 작업이 필요한 경우 브라우저가 렌더링을 중단하도록 할 것입니다.

```js
let nextUnitOfWork = null
​
function workLoop(deadline) {
  let shouldYield = false
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(
      nextUnitOfWork
    )
    shouldYield = deadline.timeRemaining() < 1
  }
  requestIdleCallback(workLoop)
}
​
requestIdleCallback(workLoop)
​
function performUnitOfWork(nextUnitOfWork) {
  // TODO
}
```

`requestIdleCallback`을 사용하여 루프를 만듭니다. `requestIdleCallback`을 `setTimeout`으로 생각할 수 있지만, 브라우저가 언제 실행할지 알려주는 대신 메인스레드가 유휴 상태(idle)일 때 콜백을 실행한다.

React는 더이상 `requestIdleCallback`를 사용하지 않습니다. 이제 scheduler package를 사용합니다. 하지만 이 유즈케이스의 경우 개념적으로는 동일합니다.

`requestIdleCallback`은 deadline 매개변수도 제공합니다. 이를 사용하여 브라우저가 다시 제어권을 가져올 때까지 남은 시간을 확인할 수 있습니다.

```js
while (nextUnitOfWork) {
  nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
}
```

루프 사용을 시작하려면 첫 번째 작업 단위를 설정한 다음, 작업 수행 뿐만 아니라 다음 작업 단위도 반환하는 `performUnitOfWork` 함수를 작성해야 합니다.

## STEP 4. Fibers

작업 단위(unit of work)를 구성하려면 데이터 구조인 'fiber tree'가 필요합니다.

각 element마다 하나의 fiber가 있고 각 fiber는 작업 단위(unit of work)가 됩니다.

다음과 같은 element tree를 렌더링한다고 가정해보겠습니다:

```js
Didact.render(
  <div>
    <h1>
      <p />
      <a />
    </h1>
    <h2 />
  </div>,
  container
);
```

`render`에서 root fiber를 생성하고 이를 `nextUnitOfWork`로 설정합니다. 나머지 작업은 `performUnitOfWork` 함수에서 이루어지며, 각 fiber에 대해 **3가지 작업**을 수행합니다:

1. DOM에 element를 추가
2. element의 children에 대한 fiber를 만듭니다.
3. 다음 작업 단위 선택

이 데이터 구조의 목표 중 하나는 다음 작업 단위를 쉽게 찾을 수 있도록 하는 것입니다. 그렇기 때문에 각 fiber에는 첫번째 자식, 다음 형제, 부모에 대한 링크가 있습니다.

fiber에 대한 작업이 끝나면, 그 fiber에 `child`가 있으면 그 fiber가 다음 작업 단위가 됩니다. 이 예제에서 `div` fiber 작업을 마치면 다음 작업 단위는 `h1` fiber가 됩니다.

fiber에 child가 없는 경우 sibling을 다음 작업 단위로 사용합니다.

그리고 fiber에 child나 sibling이 없는 경우 parent의 sibling인 "uncle"로 이동합니다.

또한 parent에 sibling이 없는 경우, sibling이 있는 parent를 찾거나 루트에 도달할 때까지 부모를 통해 계속 올라갑니다. 루트에 도달하면 이 `render`에 대한 모든 작업이 완료된 것입니다.

이제 이를 코드로 구현해 보겠습니다.

```diff
-function render(element, container) {
+function createDom(fiber) {
  const dom =
-    element.type == "TEXT_ELEMENT"
+    fiber.type == "TEXT_ELEMENT"
      ? document.createTextNode("")
-      : document.createElement(element.type)
+      :  document.createElement(fiber.type)
​
  const isProperty = key => key !== "children"
-  Object.keys(element.props)
+  Object.keys(fiber.props)
    .filter(isProperty)
    .forEach(name => {
-      dom[name] = element.props[name]
+      dom[name] = fiber.props[name]
    })
​
-  element.props.children.forEach(child =>
-    render(child, dom)
-  )
-​
-  container.appendChild(dom)
+  return dom
}
​
+function render(element, container) {
+  // TODO set next unit of work
+}
​
let nextUnitOfWork = null
```

render 함수에서 다음 `nextUnitOfWork`를 다음 fiber tree의 루트로 설정합니다.

```js
function render(element, container) {
  nextUnitOfWork = {
    dom: container,
    props: {
      children: [element],
    },
  };
}
```

그런 다음 브라우저가 준비되면 workLoop를 호출하고 루트 작업을 시작합니다.

```js
function performUnitOfWork(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }
​
  if (fiber.parent) {
    fiber.parent.dom.appendChild(fiber.dom)
  }
​
  // TODO create new fibers
  // TODO return next unit of work
}
```

1. 먼저 새 노드를 생성하여 DOM에 추가합니다.
   fiber.dom 속성에서 DOM 노드를 추적합니다.

```diff
function performUnitOfWork(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }
​
  if (fiber.parent) {
    fiber.parent.dom.appendChild(fiber.dom)
  }
​
+  const elements = fiber.props.children
+  let index = 0
+  let prevSibling = null
+​
+  while (index < elements.length) {
+    const element = elements[index]
+​
+    const newFiber = {
+      type: element.type,
+      props: element.props,
+      parent: fiber,
+      dom: null,
+    }
+  }
  // TODO return next unit of work
}
```

2. 그런 다음 각 child에 대해 새로운fiber를 만듭니다.

```diff
function performUnitOfWork(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }
​
  if (fiber.parent) {
    fiber.parent.dom.appendChild(fiber.dom)
  }
​
  const elements = fiber.props.children
  let index = 0
  let prevSibling = null
​
  while (index < elements.length) {
    const element = elements[index]
​
    const newFiber = {
      type: element.type,
      props: element.props,
      parent: fiber,
      dom: null,
    }

+    if (index === 0) {
+      fiber.child = newFiber
+    } else {
+      prevSibling.sibling = newFiber
+    }
+​
+    prevSibling = newFiber
+    index++
  }
  // TODO return next unit of work
}
```

3. 그리고 첫 번째 child인지 여부에 따라 child 또는 sibling으로 설정하여 fiber 트리에 추가합니다.

```diff
function performUnitOfWork(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }
​
  if (fiber.parent) {
    fiber.parent.dom.appendChild(fiber.dom)
  }
​
  const elements = fiber.props.children
  let index = 0
  let prevSibling = null
​
  while (index < elements.length) {
    const element = elements[index]
​
    const newFiber = {
      type: element.type,
      props: element.props,
      parent: fiber,
      dom: null,
    }

    if (index === 0) {
      fiber.child = newFiber
    } else {
      prevSibling.sibling = newFiber
    }
​
    prevSibling = newFiber
    index++
  }

+  if (fiber.child) {
+    return fiber.child
+  }
+  let nextFiber = fiber
+  while (nextFiber) {
+    if (nextFiber.sibling) {
+      return nextFiber.sibling
+    }
+    nextFiber = nextFiber.parent
+  }
}
```

4. 마지막으로 다음 작업 단위를 찾습니다. 먼저 child와 함께, 그다음에는 sibling과 함께, 그다음에는 uncle과 함께 하는 식으로 시도합니다.

<details>
<summary>
  `performUnitOfWork` 전체 코드
</summary>

```js
function performUnitOfWork(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }
​
  if (fiber.parent) {
    fiber.parent.dom.appendChild(fiber.dom)
  }
​
  const elements = fiber.props.children
  let index = 0
  let prevSibling = null
​
  while (index < elements.length) {
    const element = elements[index]
​
    const newFiber = {
      type: element.type,
      props: element.props,
      parent: fiber,
      dom: null,
    }
​
    if (index === 0) {
      fiber.child = newFiber
    } else {
      prevSibling.sibling = newFiber
    }
​
    prevSibling = newFiber
    index++
  }
​
  if (fiber.child) {
    return fiber.child
  }
  let nextFiber = fiber
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling
    }
    nextFiber = nextFiber.parent
  }
}
```

</details>

## STEP 5. Render와 Commit Phases

여기서 또 다른 문제가 있습니다.

element에서 작업할 때마다 DOM에 새 노드를 추가하고 있습니다. 그리고 전체 트리 렌더링을 완료하기 전에 브라우저가 작업을 중단할 수 있다는 점을 기억하세요. 이 경우 사용자에게 불완전한 UI가 표시됩니다. 우리는 그런 것을 원하지 않습니다.

따라서 여기에서 DOM을 변경하는 부분을 제거해야 합니다.

```diff
function performUnitOfWork(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }
​
-  if (fiber.parent) {
-    fiber.parent.dom.appendChild(fiber.dom)
-  }
​
  const elements = fiber.props.children
  let index = 0
  let prevSibling = null
​
  // ...
}
```

```diff
function render(element, container) {
-  nextUnitOfWork = {
+  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
  };
+  nextUnitOfWork = wipRoot
}

let nextUnitOfWork = null
+let wipRoot = null
```

대신 fiber 트리의 루트를 추적하겠습니다. 이를 진행 중인 작업 루트 또는 `wipRoot`(아마 Work In Progress Root?)라고 부릅니다.

그리고 모든 업이 끝나면(다음 작업 단위가 없으므로 알 수 있습니다.) 전체 파이버 트리를 DOM에 커밋합니다.

```diff
+function commitRoot() {
+  // TODO add nodes to dom
+}
​
function render(element, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
  }
  nextUnitOfWork = wipRoot
}
​
let nextUnitOfWork = null
let wipRoot = null

​
function workLoop(deadline) {
  let shouldYield = false
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(
      nextUnitOfWork
    )
    shouldYield = deadline.timeRemaining() < 1
  }

+  if (!nextUnitOfWork && wipRoot) {
+    commitRoot()
+  }

  requestIdleCallback(workLoop)
}
​
requestIdleCallback(workLoop)
```

`commitRoot` 함수에서 이 작업을 수행합니다. 여기서 모든 노드를 재귀적으로 돔에 추가합니다.

## STEP 6. Reconciliation

지금까지는 DOM에 무언가를 추가하기만 했는데, 노드를 업데이트하거나 삭제하는 것은 어떨까요?

이제 `render` 함수에서 받은 element를 DOM에 커밋한 마지막 fiber tree와 비교해야 하므로 이 작업을 수행할 것입니다.

```js
function commitRoot() {
  commitWork(wipRoot.child)
  wipRoot = null
}
​
function commitWork(fiber) {
  if (!fiber) {
    return
  }
  const domParent = fiber.parent.dom
  domParent.appendChild(fiber.dom)
  commitWork(fiber.child)
  commitWork(fiber.sibling)
}
```

따라서 커밋을 완료한 후 "DOM에 커밋한 마지막 fiber tree"에 대한 참조를 저장해야 합니다. 이를 `currentRoot`라고 부릅니다.

또한 모든 fiber에 alternate 속성을 추가합니다. 이 속성은 이전 커밋 단계에서 DOM에 커밋한 fiber인 이전 fiber에 대한 링크입니다.

```diff
function commitRoot() {
  commitWork(wipRoot.child)
+  currentRoot = wipRoot
  wipRoot = null
}
​
function commitWork(fiber) {
  if (!fiber) {
    return
  }
  const domParent = fiber.parent.dom
  domParent.appendChild(fiber.dom)
  commitWork(fiber.child)
  commitWork(fiber.sibling)
}

function render(element, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
+   alternate: currentRoot,
  }
  nextUnitOfWork = wipRoot
}
​
let nextUnitOfWork = null
+let currentRoot = null
let wipRoot = null
```

이제 `performUnitOfWork` 애서 새 fiber를 생성하는 코드를 추출해 보겠습니다... -> 새로운 `reconcileChildren` 함수로 변경합니다.

```js
function performUnitOfWork(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }
​
  const elements = fiber.props.children
  reconcileChildren(fiber, elements)
​
  if (fiber.child) {
    return fiber.child
  }
  let nextFiber = fiber
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling
    }
    nextFiber = nextFiber.parent
  }
}

​
function reconcileChildren(wipFiber, elements) {}
```

여기서 old fiber를 새로운 element와 reconcile할 것입니다.

```js
function reconcileChildren(wipFiber, elements) {
  let index = 0
  let oldFiber =
    wipFiber.alternate && wipFiber.alternate.child
  let prevSibling = null
​
  while (
    index < elements.length ||
    oldFiber != null
  ) {
    const element = elements[index]
    let newFiber = null
​
    // TODO compare oldFiber to element
```

이전 fiber(`wipFiber.alternate`)의 children과 reconile하려는 element 배열을 동시에 반복합니다.

배열과 linked list를 동시에 반복하는데 필요한 모든 보일러플레이트를 무시하면, 이 동안에 가장 중요한 것은 `oldFiber`와 `element` 뿐입니다. **`element`는 DOM에 렌더링할 대상이고 `oldFiber`는 지난 번에 렌더링한 대상입니다.**

이를 비교하여 DOM에 적용해야 할 변경 사항이 있는지 확인해야 합니다.

```diff
function reconcileChildren(wipFiber, elements) {
  let index = 0
  let oldFiber =
    wipFiber.alternate && wipFiber.alternate.child
  let prevSibling = null
​
  while (
    index < elements.length ||
    oldFiber != null
  ) {
    const element = elements[index]
    let newFiber = null
​
-    // TODO compare oldFiber to element
+    const sameType =
+      oldFiber &&
+      element &&
+      element.type == oldFiber.type
+​
+    if (sameType) {
+      // TODO update the node
+    }
+    if (element && !sameType) {
+      // TODO add this node
+    }
+    if (oldFiber && !sameType) {
+      // TODO delete the oldFiber's node
+    }
```

비교하기 위해 type을 사용합니다:

- 이전 fiber와 새 element가 같으면 DOM 노드를 유지하고 새 props로 업데이트하기만 하면 됩니다.
- type이 다르고 새 element가 있는 경우 새 DOM노드를 생성해야 함을 의미합니다.
- 그리고 type이 다르고 오래된 fiber가 있는 경우, 오래된 노드를 제거해야 합니다.

```diff
function reconcileChildren(wipFiber, elements) {
  let index = 0
  let oldFiber =
    wipFiber.alternate && wipFiber.alternate.child
  let prevSibling = null
​
  while (
    index < elements.length ||
    oldFiber != null
  ) {
    const element = elements[index]
    let newFiber = null
​
    const sameType =
      oldFiber &&
      element &&
      element.type == oldFiber.type
​
    if (sameType) {
-      // TODO update the node
+      newFiber = {
+        type: oldFiber.type,
+        props: element.props,
+        dom: oldFiber.dom,
+        parent: wipFiber,
+        alternate: oldFiber,
+        effectTag: "UPDATE",
+      }
    }
    if (element && !sameType) {
      // TODO add this node
    }
    if (oldFiber && !sameType) {
      // TODO delete the oldFiber's node
    }
```

여기서 React는 key를 사용하여 더 잘 reconciliation할 수 있습니다. 예를 들어, element 배열에서 자식들이 위치를 변경할 때 이를 감지합니다.

이전 fiber와 element type이 동일한 경우 이전 fiber의 DOM 노드와 element의 props를 유지하면서 새 fiber를 생성합니다.

또한 fiber에 새로운 프로퍼티인 `effectTag`를 추가합니다:
이 프로퍼티는 나중에 commit phase에서 사용할 것입니다.

```diff
function reconcileChildren(wipFiber, elements) {
  let index = 0
  let oldFiber =
    wipFiber.alternate && wipFiber.alternate.child
  let prevSibling = null
​
  while (
    index < elements.length ||
    oldFiber != null
  ) {
    const element = elements[index]
    let newFiber = null
​
    const sameType =
      oldFiber &&
      element &&
      element.type == oldFiber.type
​
    if (sameType) {
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE",
      }
    }
    if (element && !sameType) {
-      // TODO add this node
+      newFiber = {
+        type: element.type,
+        props: element.props,
+        dom: null,
+        parent: wipFiber,
+        alternate: null,
+        effectTag: "PLACEMENT",
+      }
    }
    if (oldFiber && !sameType) {
      // TODO delete the oldFiber's node
    }
```

그런 다음 요소에 새 DOM 노드가 필요한 경우 새 fiber에 `PLACEMENT` effectTag를 태그합니다.

```diff
function reconcileChildren(wipFiber, elements) {
  let index = 0
  let oldFiber =
    wipFiber.alternate && wipFiber.alternate.child
  let prevSibling = null
​
  while (
    index < elements.length ||
    oldFiber != null
  ) {
    const element = elements[index]
    let newFiber = null
​
    const sameType =
      oldFiber &&
      element &&
      element.type == oldFiber.type
​
    if (sameType) {
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE",
      }
    }
    if (element && !sameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT",
      }
    }
    if (oldFiber && !sameType) {
-      // TODO delete the oldFiber's node
+      oldFiber.effectTag = "DELETION"
+      deletions.push(oldFiber)
    }
```

그리고 노드를 삭제해야 하는 경우에는, 새 fiber가 없으므로 기존 fiber에 effectTag `DELETION`을 추가합니다.

하지만 fiber 트리를 DOM에 커밋할 때는 old fibers가 없는 진행 중 인(work in progress) 작업 루트에서 커밋합니다.

따라서 제거하려는 노드를 추적할 배열이 필요합니다.

```diff
function render(element, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    alternate: currentRoot,
  }
+  deletions = []
  nextUnitOfWork = wipRoot
}
​
let nextUnitOfWork = null
let currentRoot = null
let wipRoot = null
+let deletions = null
```

그런 다음 DOM에 변경 사항을 커밋할 때 해당 배열의 fiber도 사용합니다.

```diff
function commitRoot() {
+  deletions.forEach(commitWork)
  commitWork(wipRoot.child)
  currentRoot = wipRoot
  wipRoot = null
}
```

이제 새로운 `effectTags`를 처리하도록 `commitWork` 함수를 변경해보겠습니다.

```diff
function commitWork(fiber) {
  if (!fiber) {
    return
  }
  const domParent = fiber.parent.dom
-  domParent.appendChild(fiber.dom)
+  if (
+    fiber.effectTag === "PLACEMENT" &&
+    fiber.dom != null
+  ) {
+    domParent.appendChild(fiber.dom)
+  }

  commitWork(fiber.child)
  commitWork(fiber.sibling)
}
```

fiber에 `PLACEMENT` effectTag가 있는 경우, 이전과 동일하게 부모 fiber에 DOM 노드를 추가합니다.

```diff
function commitWork(fiber) {
  if (!fiber) {
    return
  }
  const domParent = fiber.parent.dom
  if (
    fiber.effectTag === "PLACEMENT" &&
    fiber.dom != null
  ) {
    domParent.appendChild(fiber.dom)
-  }
+  } else if (fiber.effectTag === "DELETION") {
+    domParent.removeChild(fiber.dom)
+  }

  commitWork(fiber.child)
  commitWork(fiber.sibling)
}
```

effectTag가 `DELETION`인 경우, 부모 fiber에서 DOM 노드를 제거합니다.

```diff
function commitWork(fiber) {
  if (!fiber) {
    return
  }
  const domParent = fiber.parent.dom
  if (
    fiber.effectTag === "PLACEMENT" &&
    fiber.dom != null
  ) {
    domParent.appendChild(fiber.dom)
+  } else if (
+    fiber.effectTag === "UPDATE" &&
+    fiber.dom != null
+  ) {
+    updateDom(
+      fiber.dom,
+      fiber.alternate.props,
+      fiber.props
+    )
  } else if (fiber.effectTag === "DELETION") {
    domParent.removeChild(fiber.dom)
  }

  commitWork(fiber.child)
  commitWork(fiber.sibling)
}
```

effectTag가 `UPDATE`인 경우, 변경된 props로 기존 DOM 노드를 업데이트해야 합니다. `updateDom` 함수를 추가하여 이를 처리합니다.

```js
function updateDom(dom, prevProps, nextProps) {
  // TODO
}
```

기존 fiber의 props와 새 fiber의 props를 비교하여 사라진 props는 제거하고, 새로 추가되거나 변경된 props를 설정합니다.

```diff
+const isProperty = key => key !== "children"
+const isNew = (prev, next) => key =>
+  prev[key] !== next[key]
+const isGone = (prev, next) => key => !(key in next)
function updateDom(dom, prevProps, nextProps) {
+  // Remove old properties
+  Object.keys(prevProps)
+    .filter(isProperty)
+    .filter(isGone(prevProps, nextProps))
+    .forEach(name => {
+      dom[name] = ""
+    })
+​
+  // Set new or changed properties
+  Object.keys(nextProps)
+    .filter(isProperty)
+    .filter(isNew(prevProps, nextProps))
+    .forEach(name => {
+      dom[name] = nextProps[name]
+    })
}
```

업데이트해야하는 특별한 종류의 prop 중 하나는 이벤트 리스너이므로 prop이름에 접두사 'on'으로 시작하는 경우 다르게 처리합니다.

```diff
+const isEvent = key => key.startsWith("on")
+const isProperty = key =>
  key !== "children" && !isEvent(key)
const isProperty = key => key !== "children"
const isNew = (prev, next) => key =>
  prev[key] !== next[key]
const isGone = (prev, next) => key => !(key in next)
function updateDom(dom, prevProps, nextProps) {
```

이벤트 핸들러가 변경되면 노드에서 해당 핸들러를 제거합니다.

```diff
function updateDom(dom, prevProps, nextProps) {
-  // Remove old properties
+  //Remove old or changed event listeners
  Object.keys(prevProps)
-    .filter(isProperty)
-    .filter(isGone(prevProps, nextProps))
-    .forEach(name => {
-      dom[name] = ""
+    .filter(isEvent)
+    .filter(
+      key =>
+        !(key in nextProps) ||
+        isNew(prevProps, nextProps)(key)
+    )
+    .forEach(name => {
+      const eventType = name
+        .toLowerCase()
+        .substring(2)
+      dom.removeEventListener(
+        eventType,
+        prevProps[name]
+      )
    })
```

그런 다음 새 핸들러를 추가합니다.

```diff
-  // Set new or changed properties
+  // Add event listeners
  Object.keys(nextProps)
-    .filter(isProperty)
-    .filter(isNew(prevProps, nextProps))
-    .forEach(name => {
-      dom[name] = nextProps[name]
+    .filter(isEvent)
+    .filter(isNew(prevProps, nextProps))
+    .forEach(name => {
+      const eventType = name
+        .toLowerCase()
+        .substring(2)
+      dom.addEventListener(
+        eventType,
+        nextProps[name]
+      )
    })
```

<small>
<a href="https://codesandbox.io/p/sandbox/didact-6-96533">
codesandbox
</a>
에서 reconciliation 코드 확인

</small>

## STEP 7. Function Components

다음으로 추가해야 할 것은 함수 컴포넌트에 대한 지원입니다.

함수 컴포넌트는 두 가지 점에서 다릅니다:

- 함수 컴포넌트의 파이버에는 DOM 노드가 없다.
- children은 props에서 직접 가져오는 것이 아니라 함수를 실행하여 가져옵니다.

```diff
function performUnitOfWork(fiber) {
-  if (!fiber.dom) {
-    fiber.dom = createDom(fiber)
-  }
-​
-  const elements = fiber.props.children
-  reconcileChildren(fiber, elements)
+  const isFunctionComponent =
+    fiber.type instanceof Function
+  if (isFunctionComponent) {
+    updateFunctionComponent(fiber)
+  } else {
+    updateHostComponent(fiber)
+  }

  if (fiber.child) {
    return fiber.child
  }
  let nextFiber = fiber
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling
    }
    nextFiber = nextFiber.parent
  }
}
​
+function updateFunctionComponent(fiber) {
+  // TODO
+}
+​
+function updateHostComponent(fiber) {
+  if (!fiber.dom) {
+    fiber.dom = createDom(fiber)
+  }
+  reconcileChildren(fiber, fiber.props.children)
+}
```

fiber type이 함수인지 확인하고 그에 따라 업데이트 기능으로 이동합니다.

`updateHostComponent`는 이전과 동일하게 수행합니다.

```diff
function updateFunctionComponent(fiber) {
-  // TODO
+  const children = [fiber.type(fiber.props)]
+  reconcileChildren(fiber, children)
}
```

그리고 `updateFunctionComponent`에서 함수를 실행하여 children을 가져옵니다.

이 예제에서 `fiber.type`은 `App`함수 이며 이를 실행하면 `h1` 요소를 반환합니다.

그런 다음 children이 생기면 동일한 방식으로 재조정이 이루어지므로 아무것도 변경할 필요가 없습니다.

우리가 변경해야 하는 것은 `commitWork` 함수입니다.

이제 DOM 노드가 없는 fiber가 있으므로 두 가지를 변경해야 합니다.

```diff
function commitWork(fiber) {
  if (!fiber) {
    return
  }
​
-  const domParent = fiber.parent.dom
+  let domParentFiber = fiber.parent
+  while (!domParentFiber.dom) {
+    domParentFiber = domParentFiber.parent
+  }
+  const domParent = domParentFiber.dom

  if (
    fiber.effectTag === "PLACEMENT" &&
    fiber.dom != null
  ) {
    domParent.appendChild(fiber.dom)
  } else if (
    fiber.effectTag === "UPDATE" &&
    fiber.dom != null
  ) {
    updateDom(
      fiber.dom,
      fiber.alternate.props,
      fiber.props
    )
  } else if (fiber.effectTag === "DELETION") {
    domParent.removeChild(fiber.dom)
  }
​
  commitWork(fiber.child)
  commitWork(fiber.sibling)
}
```

먼저 DOM 노드의 부모를 찾으려면 fiber tree를 따라 올라가서 DOM 노드가 있는 fiber를 찾아야 합니다.

```diff
function commitWork(fiber) {
  if (!fiber) {
    return
  }
​
  let domParentFiber = fiber.parent
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent
  }
  const domParent = domParentFiber.dom

  if (
    fiber.effectTag === "PLACEMENT" &&
    fiber.dom != null
  ) {
    domParent.appendChild(fiber.dom)
  } else if (
    fiber.effectTag === "UPDATE" &&
    fiber.dom != null
  ) {
    updateDom(
      fiber.dom,
      fiber.alternate.props,
      fiber.props
    )
  } else if (fiber.effectTag === "DELETION") {
-    domParent.removeChild(fiber.dom)
+    commitDeletion(fiber, domParent)
  }
​
  commitWork(fiber.child)
  commitWork(fiber.sibling)
}
+function commitDeletion(fiber, domParent) {
+  if (fiber.dom) {
+    domParent.removeChild(fiber.dom)
+  } else {
+    commitDeletion(fiber.child, domParent)
+  }
+}
```

또한 노드를 제거할 때 DOM 노드가 있는 자식을 찾을 때까지 계속 진행해야 합니다.

## STEP 8. Hooks
