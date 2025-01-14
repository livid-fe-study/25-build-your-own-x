import { RuleTester } from 'eslint'
import { describe, it } from 'vitest'
import myRule from './eslint-rule'

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 'latest' },
})

describe('my-rule', () => {
  it('should pass', () => {
    ruleTester.run('my-rule', myRule, {
      valid: [
        {
          code: "const bar = 'bar';",
        },
      ],
      invalid: [
        {
          code: "const foo = 'baz';",
          errors: 1,
        },
      ],
    })
  })
})
