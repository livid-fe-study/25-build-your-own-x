# Build your own webpack

## 웹팩이란?

> 웹팩의 핵심은 최신 자바스크립트 애플리케이션을 위한 정적 모듈 번들러입니다. 웹팩은 애플리케이션을 처리할 때 내부적으로 하나 이상의 진입점에서 종속성 그래프를 생성한 다음 프로젝트에 필요한 모든 모듈을 하나 이상의 번들로 결합하여 콘텐츠를 제공할 정적 자산입니다.

## 웹팩 빌드가 실제로 어떤 기능을 하나요?

기본적으로 웹팩 빌드를 실행하면 생성된 코드가 웹 브라우저에서 번거로움 없이 실행되도록 두 가지 단계가 진행됩니다.

**트랜스파일링**

: 기본적으로 이전 브라우저에서 코드를 이해할 수 있도록 ECMAScript 2015+ 이상 버전의 자바스크립트를 하위 호환 코드로 변환하는 작업

**번들링**

: 모든 코드를 단일 파일로 결합하여 브라우저에서 로드하고 모든 로직을 실행할 수 있도록 합니다.

## 웹팩 내부

이제 웹팩을 처음부터 빌드하려면 두 가지 작업을 해야하는데, 하나는 트랜스파일링 로직, 파일을 함께 번들링하는 로직을 만들어야 합니다.
여기서는 번들링 로직에 집중하고 웹팩이 백그라운드에서 사용하는 트랜스파일링에는 babel을 사용하겠습니다.

## Build your own webpack

먼저 이해하기 쉽도록 dependency 그래프를 만들어 dependency array를 만들어보겠습니다.
아래는 index.js > message.js 프로젝트에 대한 의존성입니다. 기본적으로 주어진 파일에 대해 수행 중인 모든 **import**가 무엇인지 찾아야 합니다.

```js
let ID = -1;
let dependencyArray = [];
let fileNameToIdIndex = [];

// 주어진 파일에서 import 문을 찾아 배열로 반환
function getDependancies(fileName) {
  const contents = fs.readFileSync(fileName, { encoding: "utf-8" });
  let deps = [];
  for (line of contents.split("\n")) {
    if (line.includes("import")) {
      let filePath = line.split("from")[1];
      filePath = filePath.replace(";", "").trim();
      filePath = filePath.replace(/'/g, "").trim();
      deps.push(filePath);
    }
  }
  return deps;
}

function buildDependancyArray(fileName) {
  const dependancies = getDependancies(fileName);
  const code = transpile(fileName);
  ID = ++ID;
  dependanceArray.push({
    id: ID,
    fileName: fileName,
    dependancies,
    code,
  });
  fileNameToIdIndex.push(fileName);
  for (dep of dependancies) {
    buildDependancyArray(dep);
  }
}
```

위의 코드는 파일 이름이 있는 배열을 생성하고, 해당 파일에 포함된 의존성 목록과 함께 ID와 연결됩니다.
`getDependancies` 함수를 살펴보면 내용을 읽고 문자열 파싱을 수행하여 가져오기 선언을 찾았지만, AST를 사용하거나 babel에서 traverse 하는 방법도 사용할 수 있습니다.

`fileNameToIdIndex` 변수가 왜 필요한지는 나중에 설명하겠습니다. 스크래치 코딩을 하지 않는 유일한 경우는 코드를 트랜스파일링할 때인데, 이는 babel 자체에 대해 논의할 내용이 많기 때문에 다음 기회에 다루도록 하겠습니다. 다음은 코드를 트랜스파일하는 로직입니다.

```js
function transpile(fileName) {
  const contents = fs.readFileSync(fileName, { encoding: "utf-8" });
  const ast = babylon.parse(contents, {
    sourceType: "module",
  });
  const { code } = babel.transformFromAst(ast, null, {
    presets: ["@babel/preset-env"],
  });
  return code;
}
```

지금까지 dependency 그래프를 성공적으로 생성하고 코드를 트랜스파일링했습니다. 하지만 그 전에 트랜스파일된 파일을 살펴보겠습니다.

```js
// index.js
"use strict";

var _message = _interopRequireDefault(require("./message.js"));
function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}
console.log(_message.default);
```

index.js 파일을 보면 import가 require로 변환되어 있는데, 문제는 브라우저가 require 키워드를 지원하지 않는 것입니다. 따라서 웹팩에 웹팩에 대한 자체 구현이 있는 것과 유사하게 우리도 require 함수가에 대한 자체 구현을 만들어야 합니다. 이를 위해서는 require 함수가 실제로 어떤 기능을 하는지 이해해야 합니다. 노드가 제공하는 require 함수 구현을 통해 다음 코드를 실행하고 어떤 일이 발생하는지 살펴봅시다.

require 함수를 자세히 살펴보면 내보낸 모든 변수가 포함된 객체를 반환합니다.
따라서 다음과 같이 빈 객체를 전달하여 파일을 호출하여 기능을 복제할 수 있습니다.

```js
// message.js
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true,
});
exports.default = void 0;
const message = "Hello World";
var _default = message;
exports.default = _default;
```

```js
function fn(exports) {
  Object.defineProperty(exports, "__esModule", {
    value: true,
  });
  exports.default = void 0;
  const message = "Hello world";
  var _default = message;
  exports.default = _default;
}

let exportObject = {};
fn(exportObject);
console.log(exportObject);
```

위와 같이 내보낸 모든 변수가 내보내기 객체에 추가됩니다.
exportObjext를 print해보면 require 함수가 정확히 복제된 것을 확인할 수 있습니다.

이제 런타임 코드를 생성하기 위한 퍼즐의 마지막 조각입니다. 가장 먼저 할 일은 런타임 코드를 생성하기 위해 함수에 대한 모든 정보를 전달하는 것입니다. index.js는 의존성 배열을 생성하는 동안 가장 먼저 처리한 파일이므로 메인 함수는 ID=0의 함수가 될 것입니다. 아래는 index=0에서 main function을 가져와서 함수 호출을 시작하는 코드입니다.
이제 require 함수가 호출되면 자바스크립트가 로컬 범위에서 찾을 수 없는 경우 전역 범위를 살펴보고 앞서 설명한 것처럼 exportObject 변수가 설정되므로 window.require 함수가 호출됩니다. 이제 fileNameToIdIndex 변수가 있는 이유는 require가 파일 이름을 전달하고 해당 변수에 저장된 맵핑을 실행해야 하는 코드를 알아야 하기 때문입니다.

```js
function generateRuntimeCode() {
  let metadata = "";
  let fileToId = "";
  dependanceArray.forEach((obj) => {
    metadata += `${obj.id}:function(exports){${obj.code}},`;
  });

  fileNameToIdIndex.forEach((file, index) => {
    fileToId += `\'${file}\':\'${index}\',`;
  });

  return `(function(metadata,fileToIdMapping){
        window.require = function require(fileName){
            const id = fileToIdMapping[fileName];
            const f = metadata[id];
            let expObject = {};
            f(expObject);
            return expObject;
        }
        const mainFunction = metadata['0'];
        mainFunction();
    })({${metadata}},{${fileToId}})`;
}

return go(f, seed, []);
```

위 코드를 실행하면 콘솔에 런타임 코드가 출력됩니다.

```js
const mainFile = "./index.js";
buildDepandancyArray(mainFile);
const runtimeCode = generateRuntimeCode();
console.log(runtimeCode);
```
