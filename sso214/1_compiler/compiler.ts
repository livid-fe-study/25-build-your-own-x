/*
* 대부분의 컴파일러는 크게 3단계로 나뉨

* 1. Parsing : 원시 코드를 가져와서 보다 추상적인 코드 표현으로 바꾸는 작업
* 파싱은 일반적으로 2단계로 나뉨
* - 어휘 분석(Lexical Analysis) : 원시 코드를 토크나이저(tokenizer 또는 lexer)라는 도구를 사용하여 토큰이라는 조각으로 나눔
* - 구문 분석(Syntactic Analysis) : 구문 분석은 토큰을 받아 각 구문의 구성 요소와 서로 간의 관계를 설명하는 표현으로 재구성함 (추상 구문 트리, AST)
*
* 2. Transformation : 추상적 표현을 가져와 컴파일러가 원하는 대로 조작하는 작업
* 이전 단계에서 생성된 AST를 가져와 이를 수정함
* 동일한 언어 내에서 AST를 조작하거나, 완전히 새로운 언어로 변환할 수 있음
* - 각 AST의 구성 요소는 노드로 표현됨
* - 변환 과정에서는 기존 AST를 그대로 두거나, 이를 기반으로 완전히 새로운 AST를 생성할 수 있음
*
* 3. Code Generation : 변환된 코드의 표현을 가져와 새로운 코드로 변환
* 최종적으로 AST를 문자열 코드로 변환하는 과정
* 코드 생성기는 AST를 탐색하며, 각 노드의 정보를 기반으로 코드 조각을 출력함
* */

/*
* TOKENIZER
* 어휘 분석(lexical analysis)을 수행
* 코드 문자열을 받아 토큰의 배열로 분해
* (add 2 (subtract 4 2))
* =>
*   [
*     { type: 'paren',  value: '('        },
*     { type: 'name',   value: 'add'      },
*     { type: 'number', value: '2'        },
*     { type: 'paren',  value: '('        },
*     { type: 'name',   value: 'subtract' },
*     { type: 'number', value: '4'        },
*     { type: 'number', value: '2'        },
*     { type: 'paren',  value: ')'        },
*     { type: 'paren',  value: ')'        },
*   ]
* */
type Token = {
  type: string;
  value: string;
}

export function tokenizer(input: string) {
  let current = 0; //코드에서 현재 위치를 추적하기 위한 변수
  let tokens: Token[] = []; //토큰을 저장할 배열

  while (current < input.length) {
    let char = input[current]; //현재 문자를 변수에 저장

    // 현재 문자가 여는 괄호일 경우 '(' 토큰을 추가
    if (char === '(') {
      tokens.push({ type: 'paren', value: '(' });
      current++;
      continue;
    }

    // 현재 문자가 닫힘 괄호일 경우 ')' 토큰을 추가
    if (char === ')') {
      tokens.push({ type: 'paren', value: ')' });
      current++;
      continue;
    }

    // 현재 문자가 공백일 경우 토큰을 저장하지 않고 넘어감
    const WHITESPACE = /\s/;
    if (WHITESPACE.test(char)) {
      current++;
      continue;
    }

    // 현재 문자가 숫자일 경우, 연속된 숫자를 하나의 토큰으로 캡쳐해 저장
    const NUMBERS = /[0-9]/;
    if (NUMBERS.test(char)) {
      let value = '';

      while (NUMBERS.test(char)) {
        value += char;
        char = input[++current];
      }

      tokens.push({ type: 'number', value });
      continue;
    }

    // 현재 문자가 쌍따옴표로 둘러쌓인 텍스트일 경우, 연속된 텍스트를 하나의 토큰으로 캡쳐해 저장
    if (char === '"') {
      let value = '';

      char = input[++current]; //열림 쌍따옴표는 무시

      while (char !== '"') {
        value += char;
        char = input[++current];
      }

      char = input[++current]; //닫힘 쌍따옴표는 무시

      tokens.push({ type: 'string', value });
      continue;
    }

    // 현재 문자가 함수 이름과 같은 'name'일 경우, 토큰으로 캡쳐해 저장
    const LETTERS = /[a-z]/i;
    if (LETTERS.test(char)) {
      let value = '';

      while(LETTERS.test(char)) {
        value += char;
        char = input[++current];
      }

      tokens.push({ type: 'name', value });
      continue;
    }

    // 위 조건에 해당하지 않는 문자가 있으면 오류를 발생시킴
    throw new TypeError('이 문자를 알 수 없습니다: ' + char);
  }

  return tokens;
}

/*
* PARSER
* 토큰 배열을 받아 AST로 변환
*   [
*     { type: 'paren',  value: '('        },
*     { type: 'name',   value: 'add'      },
*     { type: 'number', value: '2'        },
*     { type: 'paren',  value: '('        },
*     { type: 'name',   value: 'subtract' },
*     { type: 'number', value: '4'        },
*     { type: 'number', value: '2'        },
*     { type: 'paren',  value: ')'        },
*     { type: 'paren',  value: ')'        },
*   ]
* =>
 *   {
 *     type: 'Program',
 *     body: [{
 *       type: 'CallExpression',
 *       name: 'add',
 *       params: [{
 *         type: 'NumberLiteral',
 *         value: '2',
 *       }, {
 *         type: 'CallExpression',
 *         name: 'subtract',
 *         params: [{
 *           type: 'NumberLiteral',
 *           value: '4',
 *         }, {
 *           type: 'NumberLiteral',
 *           value: '2',
 *         }]
 *       }]
 *     }]
 *   }
* */
type Node = {
  type: 'NumberLiteral' | 'StringLiteral';
  value: string;
  _context?: any; //biome-ignore lint/suspicious/noExplicitAny: any
} | {
  type: 'CallExpression';
  name: string;
  params: Node[];
  _context?: any; //biome-ignore lint/suspicious/noExplicitAny: any
};
export type AST = {
  type: 'Program';
  body: Node[];
  _context?: any; //biome-ignore lint/suspicious/noExplicitAny: any
};

export function parser(tokens: Token[]) {
  let current = 0; //현재 위치를 가리키는 커서

  // walk 함수는 재귀적으로 호출되며 토큰을 AST 노드로 변환함
  function walk(): Node {
    let token = tokens[current]; //현재 토큰

    // number 타입 토큰인 경우, `NumberLiteral` AST 노드 생성
    if (token.type === 'number') {
      current++;
      return { type: 'NumberLiteral', value: token.value };
    }

    // string 타입 토큰인 경우, `StringLiteral` AST 노드 생성
    if (token.type === 'string') {
      current++;
      return { type: 'StringLiteral', value: token.value };
    }

    // paren 타입 토큰인 경우, `CallExpression` 처리
    if (token.type === 'paren' && token.value === '(') {
      token = tokens[++current]; //여는 괄호는 무시
      let node: Node = { type: 'CallExpression', name: token.value, params: [] };
      token = tokens[++current]; //이름 토큰을 건너뛰기 위해 다음 토큰으로 이동

      // 닫는 괄호를 만날 때까지 params에 추가할 노드를 재귀적으로 생성 (중첩된 괄호 때문에)
      while((token.type !== 'paren') || (token.type === 'paren' && token.value !== ')')) {
        node.params.push(walk());
        token = tokens[current];
      }
      current++; //닫는 괄호는 무시
      return node;
    }

    // 예상치 못한 토큰일 경우 에러 반환
    throw new TypeError(token.type);
  }

  // AST 노드를 담을 Root 노드 생성
  let ast: AST = {
    type: 'Program',
    body: [],
  };

  // AST 노드 생성
  while (current < tokens.length) {
    ast.body.push(walk());
  }

  return ast;
}

/*
* THE TRAVERSER
* AST를 가지고 특정 노드들을 방문하고 각 노드의 타입에 맞는 방문자를 호출할 수 있어야 함
* 방문자 객체에 정의된 메소드를, 해당 타입의 노드와 만날 때마다 호출.
*
* AST를 depth-first로 순회하며 visitor 함수를 호출하는 함수이며,
* visitor 객체는 AST 노드의 타입을 키로 갖고, 해당 노드를 방문할 때, 방문이 끝날 때 호출할 함수를 값으로 갖음
* */
type Visitor = {
  [key: string]: {
    enter?: (node: AST | Node, parent: AST | Node | null) => void;
    exit?: (node: AST | Node, parent: AST | Node | null) => void;
  }
}

export function traverser(ast: AST, visitor: Visitor) {
  // 배열을 순회하고 traverseNode 함수를 호출해주는 함수
  function traverseArray(array: Node[], parent: AST | Node) {
    array.forEach(child => {
      traverseNode(child, parent);
    });
  }

  // 정보를 방문자 메소드에 전달할 수 있게 됨
  function traverseNode(node: AST | Node, parent: AST | Node | null) {
    // 방문자 객체에 해당 노드 타입에 대한 메소드가 있는지 확인
    const methods = visitor[node.type];

    // enter 메소드가 존재하면 호출
    if(methods?.enter) {
      methods.enter(node, parent);
    }

    // 현재 노드 타입에 따라 분기
    switch (node.type) {
      // AST의 최상위 노드인 Program 노드는 body 배열을 순회. (`traverseArray`는 다시 `traverseNode`를 호출하기 떄문에 재귀적으로 트리를 순회하게 됨 => 하위 노드로 이동)
      case 'Program':
        traverseArray(node.body, node);
        break;
      // CallExpression 노드는 params 배열을 순회
      case "CallExpression":
        traverseArray(node.params, node);
        break;
      // `NumberLiteral`, `StringLiteral`의 경우 하위 노드가 없으므로 아무 작업도 하지 않고 종료
      case 'NumberLiteral':
      case 'StringLiteral':
        break;
      // 인식되지 않은 노드 타입이라면 에러 반환
      default:
        throw new TypeError((node as Node).type);
    }

    // exit 메소드가 존재하면 호출
    if (methods?.exit) {
      methods.exit(node, parent);
    }
  }

  traverseNode(ast, null);
}

/*
* THE TRANSFORMER
* AST를 순회하며 새로운 AST를 생성함
* 우리가 만든 transformer 함수는 traverser 함수를 사용해 lisp 스타일의 AST를 C 스타일의 AST로 변환함
* */
export function transformer(ast: AST) {
  // 새로운 AST를 생성
  const newAst: AST = { type: 'Program', body: [] };

  // `_context` 프로퍼티를 사용해 이전 AST 노드에서 새로운 노드로의 참조를 추가
  // `context`를 조작하면 newAst의 Body에 노드를 추가할 수 있음
  ast._context = newAst.body;

  traverser(ast, {
    NumberLiteral: {
      enter(node, parent) {
        if (node.type !== "NumberLiteral") return;
        // `NumberLiteral` 노드를 생성하고 부모의 `context`에 추가
        parent?._context.push({ type: 'NumberLiteral', value: node.value });
      }
    },
    StringLiteral: {
      enter(node, parent) {
        if (node.type !== 'StringLiteral') return;
        parent?._context.push({ type: 'StringLiteral', value: node.value });
      }
    },
    CallExpression: {
      enter(node, parent) {
        if (node.type !== 'CallExpression') return;

        // `Identifier`를 callee로 가지는 `CallExpression` 노드를 생성
        let expression = {
          type: 'CallExpression',
          callee: {
            type: 'Identifier',
            name: node.name,
          },
          arguments: [],
        };

        // 원래 `CallExpression` 노드에 `context`를 추가해 새 노드의 `arguments`를 참조하도록 설정
        node._context = expression.arguments;

        // 부모 노드가 `CallExpression`이 아닌 경우 => top level 문장
        // 때문에 `CallExpression`을 `ExpressionStatement`로 감쌈
        // `CallExpression` 또는 `ExpressionStatement` 노드를 부모 노드의 context에 추가함
        if (parent.type !== 'CallExpression') {
          const newExpression = {
            type: 'ExpressionStatement',
            expression: expression,
          }
          parent?._context.push(newExpression);
        } else {
          parent?._context.push(expression);
        }
      }
    }
  });
  return newAst;
}

/*
* CODE GENERATOR
* 트리의 각 노드를 재귀적으로 호출하여 하나의 거대한 문자열로 출력함
* 추상 구문 트리(AST)를 기반으로 다양한 유형의 노드를 처리하여 최종적으로 문자열 형태의 코드를 생성함
* */
export function codeGenerator(node) {
  switch (node.type) {
    // Program 노드는 body 배열을 순회하며 codeGenerator 함수를 호출함
    case 'Program':
      return node.body.map(codeGenerator).join('\n');
    // 표현문은 중첩된 표현식에 대해 codeGenerator를 호출하고 세미콜론을 추가함
    case 'ExpressionStatement':
      return `${codeGenerator(node.expression)};`;
    // 표현식의 이름을 출력하고 괄호를 열고, arguments를 순회하며 codeGenerator를 호출하고 쉼표로 연결한 후 괄호를 닫음
    case 'CallExpression':
      return `${codeGenerator(node.callee)}(${node.arguments.map(codeGenerator).join(', ')})`;
    // 식별자 노드는 이름을 출력
    case 'Identifier':
      return node.name;
    // NumberLiteral 노드는 값을 출력
    case 'NumberLiteral':
      return node.value;
    // StringLiteral 노드는 값을 쌍따옴표로 감싼 후 출력
    case 'StringLiteral':
      return `"${node.value}"`;
    // 알 수 없는 노드 타입이면 에러를 던짐
    default:
      throw new TypeError(node.type);
  }
}

/*
* COMPILER
* 파이프라인의 모든 부분을 연결
* */
export function compiler(input) {
  const tokens = tokenizer(input);
  const ast = parser(tokens);
  const newAst = transformer(ast);

  return codeGenerator(newAst);
}
