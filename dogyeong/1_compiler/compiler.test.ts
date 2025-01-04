import { describe, expect, it } from 'vitest'
import { tokenizer, parser, transformer, AST, codeGenerator, compiler } from './compiler';


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

  const ast = {
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
  } satisfies AST;

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

  it('should tokenize the input', () => {
    expect(tokenizer(input)).toEqual(tokens);
  });

  it('should parse the tokens', () => {
    expect(parser(tokens)).toEqual(ast);
  });

  it('should transform the AST', () => {
    expect(transformer(ast)).toEqual(newAst);
  });

  it('should generate code from the new AST', () => {
    expect(codeGenerator(newAst)).toEqual(output);
  });

  it('should compile the input to output', () => {
    expect(compiler(input)).toEqual(output);
  });
})