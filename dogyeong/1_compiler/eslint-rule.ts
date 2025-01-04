import type { Rule } from 'eslint'

export default {
  meta: {
    messages: {
      avoidName: "Avoid using variables named '{{ name }}'",
    },
  },
  create(context) {
    return {
      Identifier(node) {
        if (node.name === 'foo') {
          context.report({
            node,
            messageId: 'avoidName',
            data: {
              name: 'foo',
            },
          })
        }
      },
    }
  },
} satisfies Rule.RuleModule
