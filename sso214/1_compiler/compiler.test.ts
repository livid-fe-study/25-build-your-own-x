import { describe, expect, it } from 'vitest';
import { type AST, codeGenerator, compiler, parser, tokenizer, transformer } from './compiler';

describe('compiler', () => {
  const input  = '(add 2 (subtract 4 2))';
  const output = 'add(2, subtract(4, 2));';

  const tokens = [
    { type: 'paren',  value: '('        },
    { type: 'name',   value: 'add'      },
    { type: 'number', value: '2'        },
    { type: 'paren',  value: '('        },
    { type: 'name',   value: 'subtract' },
    { type: 'number', value: '4'        },
    { type: 'number', value: '2'        },
    { type: 'paren',  value: ')'        },
    { type: 'paren',  value: ')'        }
  ];
  const ast: AST = {
    type: 'Program',
    body: [{
      type: 'CallExpression',
      name: 'add',
      params: [{
        type: 'NumberLiteral',
        value: '2'
      }, {
        type: 'CallExpression',
        name: 'subtract',
        params: [{
          type: 'NumberLiteral',
          value: '4'
        }, {
          type: 'NumberLiteral',
          value: '2'
        }]
      }]
    }]
  };
  const newAst = {
    type: 'Program',
    body: [{
      type: 'ExpressionStatement',
      expression: {
        type: 'CallExpression',
        callee: {
          type: 'Identifier',
          name: 'add'
        },
        arguments: [{
          type: 'NumberLiteral',
          value: '2'
        }, {
          type: 'CallExpression',
          callee: {
            type: 'Identifier',
            name: 'subtract'
          },
          arguments: [{
            type: 'NumberLiteral',
            value: '4'
          }, {
            type: 'NumberLiteral',
            value: '2'
          }]
        }]
      }
    }]
  };

  it('`Tokenizer`는 `input`문자열을 `token`배열로 변환한다.', () => {
    expect(tokenizer(input)).toEqual(tokens);
  });

  it('`parser`는 `tokens`배열을 `ast`로 변환한다.', () => {
    expect(parser(tokens)).toEqual(ast);
  });

  it('`transformer`는 `ast`를 `newAst`로 변환한다', () => {
    expect(transformer(ast)).toEqual(newAst);
  });

  it('`codeGenerator`는 `newAst`를 `output` 문자열로 변환한다.', () => {
    expect(codeGenerator(newAst)).toEqual(output);
  });

  it('`compiler`는 `input`을 `output`으로 변환한다', () => {
    expect(compiler(input)).toEqual(output);
  });
});
