# Build your own React
[Build your own React](https://pomb.us/build-your-own-react/)

우리는 React를 처음부터 다시 작성할 것입니다.<br>
단계별로 진행하며 실제 React 코드의 아키텍처를 따르되, 모든 최적화와 필수적이지 않은 기능은 제외할 것입니다.
<br><br>
이전에 제가 작성한 "직접 React를 만들어보기" 관련 게시물을 읽어보셨다면, 이번 게시물은 React 16.8을 기반으로 한다는 점이 다릅니다.<br>
따라서 이제 훅(Hooks)을 사용할 수 있으며, 클래스와 관련된 코드는 모두 생략합니다.
<br><br>
이전 블로그 게시물들과 코드는 Didact 저장소에서 확인할 수 있습니다.<br>
또한 동일한 내용을 다룬 강연도 있습니다. 그러나 이번 게시물은 독립적으로 작성된 내용입니다.
<br><br>
처음부터 시작하여, 우리가 직접 만든 React에 하나씩 추가할 내용은 다음과 같습니다 :
* 1단계: createElement 함수<br>
* 2단계: render 함수<br>
* 3단계: 동시성 모드(Concurrent Mode)<br>
* 4단계: Fiber 구조<br>
* 5단계: 렌더 및 커밋 단계(Render and Commit Phases)<br>
* 6단계: 재조정(Reconciliation)<br>
* 7단계: 함수형 컴포넌트(Function Components)<br>
* 8단계: 훅(Hooks)


## Step Zero: Review
우선, 몇 가지 기본 개념을 복습해 봅시다.<br>
React, JSX, DOM 요소가 어떻게 작동하는지 잘 알고 있다면 이 단계를 건너뛰어도 좋습니다.
<br><br>
아래는 단 세 줄로 이루어진 React 앱입니다. 
```javascript
const element = <h1 title="foo">Hello</h1>
const container = document.getElementById("root")
ReactDOM.render(element, container)
```
첫 번째 줄에서는 React 요소를 정의합니다.<br>
두 번째 줄에서는 DOM에서 노드를 가져옵니다.<br>
마지막 줄에서는 React 요소를 해당 컨테이너에 렌더링합니다.
<br><br>
이제 React 관련 코드를 모두 제거하고 순수 JavaScript로 바꿔 보겠습니다.
```javascript
const element = React.createElement(
  "h1",
  { title: "foo" },
  "Hello"
)

const container = document.getElementById("root")
ReactDOM.render(element, container)
```
첫 번째 줄은 JSX로 정의된 요소입니다.<br>
JSX는 유효한 JavaScript가 아니므로, 순수 JavaScript로 바꾸려면 먼저 이를 유효한 JavaScript로 변환해야 합니다.<br>
JSX는 Babel과 같은 빌드 도구에 의해 JavaScript로 변환됩니다. 이 변환은 일반적으로 간단합니다.<br>
태그 내부 코드를 createElement 호출로 대체하여 태그 이름, 속성(props), 자식(children)을 매개변수로 전달합니다.
<br><br>
React.createElement는 전달받은 매개변수로 객체를 생성합니다.<br>
몇 가지 유효성 검사를 제외하면, 이것이 함수의 전부입니다.<br>
따라서 이 함수 호출을 해당 출력값으로 안전하게 대체할 수 있습니다.
```javascript
const element = {
  type: "h1",
  props: {
    title: "foo",
    children: "Hello",
  },
}

const container = document.getElementById("root")
ReactDOM.render(element, container)
```
React 요소는 type과 props라는 두 가지 속성을 가진 객체입니다.<br>
(다른 속성도 있지만 여기서는 이 두 가지만 중요합니다).
<br><br>
`type`: 생성할 DOM 노드의 유형을 지정하는 문자열입니다. <br>
HTML 요소를 만들 때 document.createElement에 전달하는 tagName에 해당합니다. <br>
type은 문자열 대신 함수일 수도 있지만, 이 내용은 7단계에서 다룹니다.
<br><br>
`props`: 또 다른 객체로, JSX 속성의 키와 값이 모두 포함됩니다.<br>
props에는 특별한 속성인 children도 포함됩니다.<br>
children은 이 예제에서는 문자열이지만, 일반적으로 더 많은 요소를 가진 배열입니다. <br>
이러한 이유로 React 요소는 트리 구조를 형성합니다.
<br><br>
React 코드에서 대체해야 할 다른 부분은 ReactDOM.render 호출입니다.<br>
render는 React가 DOM을 변경하는 부분이므로, 이제 우리가 직접 DOM 업데이트를 처리해 보겠습니다.
```javascript
const element = {
  type: "h1",
  props: {
    title: "foo",
    children: "Hello",
  },
}

const container = document.getElementById("root")

const node = document.createElement(element.type)
node["title"] = element.props.title

const text = document.createTextNode("")
text["nodeValue"] = element.props.children

node.appendChild(text)
container.appendChild(node)
```
먼저, 요소의 type을 사용해 노드를 생성합니다. 이 경우 h1 태그입니다.<br>
그런 다음, 요소의 props를 해당 노드에 할당합니다. 여기서는 title 속성만 있습니다.<br>
(혼동을 피하기 위해 React 요소를 element, DOM 요소를 node라고 부르겠습니다.)
<br><br>
자식을 위한 노드를 생성합니다. 이 예제에서는 자식이 문자열이므로 텍스트 노드를 생성합니다.<br>
textNode를 사용하면 innerText를 설정하는 것보다 나중에 모든 요소를 동일한 방식으로 처리할 수 있습니다.
<br><br>
또한 nodeValue를 설정하는 방식이 h1의 title을 설정하는 방식과 비슷하다는 점에 주목하세요.<br>
마치 문자열이 {nodeValue: "hello"}라는 속성을 가진 것처럼 보입니다.<br>
마지막으로, textNode를 h1에 추가하고, h1을 컨테이너에 추가합니다.
<br><br>
이제 React 없이도 이전과 동일한 앱이 완성되었습니다!
<br><br>
<details>
<summary>코드 확인</summary>

```javascript
const element = {
  type: "h1",
  props: {
    title: "foo",
    children: "Hello",
  },
}
const container = document.getElementById("root");

const node = document.createElement(element.type);
node["title"] = element.props.title;

const text = document.createTextNode("");
text["nodeValue"] = element.props.children;

node.appendChild(text);
container.appendChild(node);
```
</details>


## Step I: The createElement Function
이제 또 다른 앱으로 다시 시작하겠습니다.<br>
이번에는 React 코드를 우리가 직접 만든 React 버전으로 대체해 보겠습니다.
<br><br>
우선, 우리가 직접 만든 createElement를 작성하는 것부터 시작하겠습니다.<br>
JSX를 JavaScript로 변환하면 createElement 호출을 확인할 수 있습니다.
```javascript
const element = React.createElement(
  "div",
  { id: "foo" },
  React.createElement("a", null, "bar"),
  React.createElement("b")
)
const container = document.getElementById("root")
ReactDOM.render(element, container)
```
이전 단계에서 보았듯이, React 요소는 type과 props를 가진 객체입니다.<br>
우리가 작성할 함수에서 해야 할 일은 이 객체를 생성하는 것입니다.
```javascript
function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children,
    },
  }
}

const element = React.createElement(
  "div",
  { id: "foo" },
  React.createElement("a", null, "bar"),
  React.createElement("b")
)
const container = document.getElementById("root")
ReactDOM.render(element, container)
```
props를 처리하기 위해 스프레드 연산자(...)를 사용하고,<br>
children을 처리하기 위해 나머지 매개변수 구문(...rest)을 사용합니다.<br>
이렇게 하면 children 속성은 항상 배열 형태가 됩니다.
<br><br>
예를 들어, `createElement("div")`는 다음과 같이 반환합니다:
```json
{
  "type": "div",
  "props": { "children": [] }
}
```
`createElement("div", null, a)`는 다음과 같이 반환합니다:
```json
{
  "type": "div",
  "props": { "children": [a] }
}
```
`createElement("div", null, a, b)`는 다음과 같이 반환합니다:
```json
{
  "type": "div",
  "props": { "children": [a, b] }
}
```
children 배열에는 문자열이나 숫자 같은 원시 값도 포함될 수 있습니다.<br>
따라서 객체가 아닌 모든 것을 자체 요소로 래핑하고, 이를 위한 특별한 type을 정의하겠습니다: `TEXT_ELEMENT`.
```javascript
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

function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  }
}
```
React는 원시 값을 래핑하거나 자식이 없을 때 빈 배열을 생성하지 않지만, 우리는 코드 단순화를 위해 이를 수행합니다.<br>
우리의 라이브러리는 성능보다는 단순한 코드를 선호합니다.
<br><br>
여전히 React의 createElement를 사용하고 있지만, 이를 대체하기 위해 라이브러리에 이름을 붙여 보겠습니다.<br>
React와 비슷하면서도 교육적 목적(예: didactic)을 암시하는 이름으로 Didact라고 부르겠습니다.
```javascript
const Didact = {
  createElement,
}
const element = Didact.createElement(
  "div",
  { id: "foo" },
  Didact.createElement("a", null, "bar"),
  Didact.createElement("b")
)
const container = document.getElementById("root")
ReactDOM.render(element, container)
```
이제 JSX에서 Didact의 createElement를 사용하려면 어떻게 해야 할까요?<br>
Babel이 JSX를 변환할 때, 우리가 정의한 함수가 사용되도록 하기 위해 아래와 같은 주석을 추가하면 됩니다.<br>
이 주석을 추가하면 Babel은 JSX를 변환할 때 React 대신 Didact의 createElement를 사용합니다.
```javascript
/** @jsx Didact.createElement */
const element = (
  <div id="foo">
    <a>bar</a>
    <b />
  </div>
)
```

<details>
<summary>코드 확인</summary>

```javascript
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
/** @jsx Didact.createElement */
const element = (
  <div id="foo">
    <a>bar</a>
    <b />
  </div>
)
const container = document.getElementById("root")
ReactDOM.render(element, container)
```
</details>


## Step II: The render Function
이제 ReactDOM의 render 함수를 우리가 직접 작성해 보겠습니다.
```javascript
ReactDOM.render(element, container)
```
현재로서는 DOM에 내용을 추가하는 것만 신경 쓰면 됩니다. 업데이트나 삭제는 나중에 처리할 것입니다.
```javascript
function render(element, container) {
  // TODO create dom nodes
}

const Didact = {
  render,
}

Didact.render(element, container)
```
요소의 type을 사용해 DOM 노드를 생성하고, 새로 만든 노드를 컨테이너에 추가합니다.
```javascript
function render(element, container) {
  const dom = document.createElement(element.type)
  
  container.appendChild(dom)
}
```
각 자식 요소에 대해 같은 작업을 재귀적으로 수행합니다.
```javascript
function render(element, container) {
  const dom = document.createElement(element.type)

  element.props.children.forEach(child =>
    render(child, dom)
  )

  container.appendChild(dom)
}
```
요소의 type이 TEXT_ELEMENT인 경우, 일반적인 노드 대신 텍스트 노드를 생성합니다.
```javascript
function render(element, container) {
  const dom =
    element.type == "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(element.type)

  element.props.children.forEach(child =>
    render(child, dom)
  )

  container.appendChild(dom)
}
```
마지막으로, 요소의 props를 노드에 할당합니다.
```javascript
function render(element, container) {
  const dom =
    element.type == "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(element.type)

  const isProperty = key => key !== "children"
  Object.keys(element.props)
    .filter(isProperty)
    .forEach(name => {
      dom[name] = element.props[name]
    })

  element.props.children.forEach(child =>
    render(child, dom)
  )

  container.appendChild(dom)
}
```
이제 JSX를 DOM에 렌더링할 수 있는 라이브러리가 완성되었습니다!<br>
직접 작성한 라이브러리가 JSX를 DOM에 렌더링하는 것을 확인할 수 있습니다.

<details>
<summary>코드 확인</summary>

```javascript
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

function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  }
}

function render(element, container) {
  const dom =
    element.type == "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(element.type)

  const isProperty = key => key !== "children"
  Object.keys(element.props)
    .filter(isProperty)
    .forEach(name => {
      dom[name] = element.props[name]
    })

  element.props.children.forEach(child =>
    render(child, dom)
  )

  container.appendChild(dom)
}

const Didact = {
  createElement,
  render,
}

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


## Step III: Concurrent Mode
현재 코드에는 재귀 호출 방식으로 전체 요소 트리를 한 번에 렌더링하는 문제가 있습니다.
<br><br>
렌더링을 시작하면 전체 트리가 렌더링될 때까지 중단되지 않습니다.
요소 트리가 크다면 메인 스레드를 너무 오래 차지하게 됩니다.
브라우저가 사용자 입력 처리나 애니메이션과 같은 높은 우선순위 작업을 수행해야 할 경우, 렌더링이 끝날 때까지 대기해야 합니다.



## Step IV: Fibers


## Step V: Render and Commit Phases


## Step VI: Reconciliation


## Step VII: Function Components


## Step VIII: Hooks


## Epilogue
