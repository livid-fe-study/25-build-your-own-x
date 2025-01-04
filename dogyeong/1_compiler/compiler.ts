/** 
 * 대부분의 컴파일러는 크게 세 단계로 나눌 수 있다.
 * Parsing, Transformation, and Code Generation
 */

/**
 * Parsing
 * 파싱은 크게 두 가지로 나뉜다.
 * 1. 어휘 분석(Lexical Analysis): 문자열을 토큰(Token)으로 변환하는 작업
 * 2. 구문 분석(Syntax Analysis): 토큰을 의미 있는 구조(AST)로 변환하는 작업
 */

export type Token = {
  type: string;
  value: string;
}

/**
 * tokenizer
 * 어휘 분석(Lexical Analysis)을 수행하는 함수
 * 문자열을 입력받아 토큰(Token) 배열로 변환한다.
 * (add 2 (subtract 4 2))   =>   [{ type: 'paren', value: '(' }, ...]
 */
export function tokenizer(input: string) {
  let current = 0;
  let tokens: Token[] = [];

  while (current < input.length) {
    let char = input[current];

    // 현재 문자가 여는 괄호면 '(' 토큰을 추가한다.
    if (char === '(') {
      tokens.push({ type: 'paren', value: '(' });
      current++;
      continue;
    }

    // 현재 문자가 닫는 괄호면 ')' 토큰을 추가한다.
    if (char === ')') {
      tokens.push({ type: 'paren', value: ')' });
      current++;
      continue;
    }

    // 공백문자는 문자를 구분하는데 사용되며, 토큰으로 저장할 필요없다.
    let WHITESPACE = /\s/;
    if (WHITESPACE.test(char)) {
      current++;
      continue;
    }

    // 연속된 숫자를 하나의 토큰으로 캡쳐해서 토큰으로 저장한다.
    let NUMBERS = /[0-9]/;
    if (NUMBERS.test(char)) {
      let value = '';

      // 숫자가 아닌 문자를 만날 때까지 반복해서 숫자를 value에 추가한다.
      while (NUMBERS.test(char)) {
        value += char;
        char = input[++current];
      }

      tokens.push({ type: 'number', value });
      continue;
    }

    // 문자열은 쌍따옴표(")로 둘러싸인 텍스트로 정의된다.
    if (char === '"') {
      let value = '';

      // 여는 쌍따옴표는 무시한다.
      char = input[++current];

      // 닫는 쌍따옴표가 나올 때까지 문자를 value에 추가한다.
      while (char !== '"') {
        value += char;
        char = input[++current];
      }

      // 닫는 쌍따옴표는 무시한다.
      char = input[++current];

      // 문자열 토큰을 추가한다.
      tokens.push({ type: 'string', value });
      continue;
    }

    // 마지막 타입은 `name` 토큰이다. 'name' 토큰은 소문자 또는 대문자로 이루어진 문자열이다.
    // 이는 lisp 문법에서 함수의 이름을 나타낸다.
    let LETTERS = /[a-z]/i;
    if (LETTERS.test(char)) {
      let value = '';

      // 문자가 아닌 문자를 만날 때까지 반복해서 문자를 value에 추가한다.
      while (LETTERS.test(char)) {
        value += char;
        char = input[++current];
      }

      // `name` 토큰을 추가한다.
      tokens.push({ type: 'name', value });
      continue;
    }

    // 만약 알 수 없는 문자가 나오면 에러를 던진다.
    throw new TypeError('I dont know what this character is: ' + char);
  }

  return tokens;
}

export type Node = 
  {
    type: 'CallExpression';
    name: string;
    params: Node[];
    _context?: any;
  } | {
    type: 'NumberLiteral' | 'StringLiteral';
    value: string;
    _context?: any;
  }

export type AST = {
  type: 'Program';
  body: Node[];
  _context?: any;
}

/**
 * parser
 * 구문 분석(Syntax Analysis)을 수행하는 함수
 * 토큰(Token) 배열을 입력받아 AST(Abstract Syntax Tree)로 변환한다.
 * [{ type: 'paren', value: '(' }, ...]   =>   { type: 'Program', body: [...] }
 */
export function parser(tokens: Token[]) {
  let current = 0;

  // walk 함수는 재귀적으로 호출되며, 토큰을 AST 노드로 변환한다.
  function walk(): Node {
    // 현재 토큰을 가져온다.
    let token = tokens[current];

    // number 타입 토큰이면 `NumberLiteral` AST 노드를 생성한다.
    if (token.type === 'number') {
      current++;
      return {
        type: 'NumberLiteral',
        value: token.value,
      };
    }

    // string 타입 토큰이면 `StringLiteral` AST 노드를 생성한다.
    if (token.type === 'string') {
      current++;
      return {
        type: 'StringLiteral',
        value: token.value,
      };
    }

    // CallExpressions를 처리하는 코드
    if (
      token.type === 'paren' &&
      token.value === '('
    ) {
      // 여는 괄호는 무시한다.
      token = tokens[++current];

      // CallExpression 노드를 생성하고 현재 토큰의 값을 함수 이름(name)으로 설정한다.
      let node: Node = {
        type: 'CallExpression',
        name: token.value,
        params: [],
      };

      // 함수 이름을 설정했으므로 다음 토큰으로 이동한다.
      token = tokens[++current];

      // 닫는 괄호가 나올 때까지 params에 추가할 노드를 재귀적으로 생성한다. (괄호가 중첩될 수 있기 때문에)
      while (
        (token.type !== 'paren') ||
        (token.type === 'paren' && token.value !== ')')
      ) {
        node.params.push(walk());
        token = tokens[current];
      }

      // 닫는 괄호는 무시한다.
      current++;
      return node;
    }

    // 만약 알 수 없는 토큰이 나오면 에러를 던진다.
    throw new TypeError(token.type);
  }

  // AST 노드를 담을 root 노드를 생성한다.
  let ast: AST = {
    type: 'Program',
    body: [],
  };

  // AST 노드를 생성한다.
  while (current < tokens.length) {
    ast.body.push(walk());
  }

  return ast;
}

/**
 * Transformation
 * 변환 단계에서는 AST를 수정하거나 새로운 AST를 생성한다.
 * AST 노드들을 변환하기 위해 AST를 순회할 수 있어야 한다.
 * 이를 위해 traverser 함수를 정의한다.
*/

export type Visitor = {
  [key: string]: {
    enter?: (node: AST | Node, parent: AST | Node | null) => void;
    exit?: (node: AST | Node, parent: AST | Node | null) => void;
  };
}

/**
 * traverser
 * AST를 depth-first로 순회하며 visitor 함수를 호출하는 함수
 * visitor 객체는 AST 노드의 타입을 키로 갖고, 해당 노드를 방문할 때, 방문이 끝날 때 호출할 함수를 값으로 갖는다.
 *  
 * const visitor = {
 *   NumberLiteral: {
 *     enter(node, parent) {},
 *     exit(node, parent) {},
 *   }
 * };
 */
export function traverser(ast: AST, visitor: Visitor) {
  function traverseArray(array: Node[], parent: AST | Node) {
    array.forEach(child => {
      traverseNode(child, parent);
    });
  }

  function traverseNode(node: AST | Node, parent: AST | Node | null) {
    // visitor 객체에서 현재 노드 타입에 해당하는 visitor 메소드를 가져온다.
    let methods = visitor[node.type];

    // enter 메소드가 있으면 호출한다.
    if (methods && methods.enter) {
      methods.enter(node, parent);
    }

    // node 타입에 따라 다른 동작을 수행한다.
    switch (node.type) {
      // AST의 최상위 노드인 Program 노드는 body 배열을 순회한다.
      case 'Program':
        traverseArray(node.body, node);
        break;

      // CallExpression 노드는 params 배열을 순회한다.
      case 'CallExpression':
        traverseArray(node.params, node);
        break;

      // NumberLiteral, StringLiteral 노드는 leaf 노드이므로 추가적인 동작을 수행하지 않는다.
      case 'NumberLiteral':
      case 'StringLiteral':
        break;

      // 알 수 없는 노드 타입이면 에러를 던진다.
      default:
        throw new TypeError((node as Node).type);
    }

    // exit 메소드가 있으면 호출한다.
    if (methods && methods.exit) {
      methods.exit(node, parent);
    }
  }

  traverseNode(ast, null);
}

/**
 * transformer
 * 우리의 transformer 함수는 traverser 함수를 사용하여 lisp 스타일의 AST를 C 스타일의 AST로 변환한다.
 */
export function transformer(ast: AST) {
  // 새로운 AST를 생성한다.
  let newAst = {
    type: 'Program',
    body: [],
  };

  // 이전 AST 노드에서 새로운 AST 노드로의 참조를 위해 `_context` 프로퍼티를 사용한다.
  // _context를 조작하면 newAst의 body에 노드를 추가할 수 있다.
  ast._context = newAst.body;

  traverser(ast, {
    NumberLiteral: {
      enter(node, parent) {
        if (node.type !== 'NumberLiteral') {
          return
        }
        // `NumberLiteral` 노드를 부모 노드의 context에 추가한다.
        parent?._context.push({
          type: 'NumberLiteral',
          value: node.value,
        });
      },
    },
    StringLiteral: {
      enter(node, parent) {
        if (node.type !== 'StringLiteral') {
          return
        }
        // `StringLiteral` 노드를 부모 노드의 context에 추가한다.
        parent?._context.push({
          type: 'StringLiteral',
          value: node.value,
        });
      },
    },
    CallExpression: {
      enter(node, parent) {
        if (node.type !== 'CallExpression') {
          return
        }
        // `Identifier`를 callee로 가지는 `CallExpression` 노드를 생성한다.
        let expression = {
          type: 'CallExpression',
          callee: {
            type: 'Identifier',
            name: node.name,
          },
          arguments: [],
        };

        // 자식 노드에서 arguments를 참조할 수 있도록 `_context` 프로퍼티를 추가한다.
        node._context = expression.arguments;

        // 부모 노드가 `CallExpression`인지 체크한다.
        // 만약 `CallExpression`이 아니라면 top level 문장이기 때문에 `CallExpression`을 `ExpressionStatement`로 감싼다.
        // `CallExpression` 또는 `ExpressionStatement` 노드를 부모 노드의 context에 추가한다.
        if (parent?.type !== 'CallExpression') {
          const newExpression = {
            type: 'ExpressionStatement',
            expression: expression,
          };

          parent?._context.push(newExpression);
        } else {
          parent?._context.push(expression);
        }
      },
    }
  });

  return newAst;
}

export function codeGenerator(node) {
  switch (node.type) {

    // Program 노드는 body 배열을 순회하며 codeGenerator 함수를 호출한다.
    case 'Program':
      return node.body.map(codeGenerator).join('\n');

    // 표현문은 중첩된 표현식에 대해 codeGenerator를 호출하고 세미콜론을 추가한다.
    case 'ExpressionStatement':
      return `${codeGenerator(node.expression)};`;

    // 표현식의 이름을 출력하고 괄호를 열고, arguments를 순회하며 codeGenerator를 호출하고 쉼표로 연결한 후 괄호를 닫는다.
    case 'CallExpression':
      return `${codeGenerator(node.callee)}(${node.arguments.map(codeGenerator).join(', ')})`;

    // 식별자 노드는 이름을 출력한다.
    case 'Identifier':
      return node.name;

    // NumberLiteral 노드는 값을 출력한다.
    case 'NumberLiteral':
      return node.value;

    // StringLiteral 노드는 값을 쌍따옴표로 감싼 후 출력한다.
    case 'StringLiteral':
      return '"' + node.value + '"';

    // 알 수 없는 노드 타입이면 에러를 던진다.
    default:
      throw new TypeError(node.type);
  }
}

export function compiler(input) {
  const tokens = tokenizer(input);
  const ast    = parser(tokens);
  const newAst = transformer(ast);
  const output = codeGenerator(newAst);

  return output;
}