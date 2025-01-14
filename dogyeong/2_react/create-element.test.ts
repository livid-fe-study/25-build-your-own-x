import { describe, expect, it } from 'vitest'
import { createElement } from './create-element'

describe('create-element', () => {
  it('should create element', () => {
    expect(createElement('div')).toEqual({
      type: 'div',
      props: { children: [] },
    })

    expect(createElement('div', null)).toEqual({
      type: 'div',
      props: { children: [] },
    })

    expect(createElement('div', null, 'a')).toEqual({
      type: 'div',
      props: {
        children: [
          {
            props: {
              children: [],
              nodeValue: 'a',
            },
            type: 'TEXT_ELEMENT',
          },
        ],
      },
    })

    expect(createElement('div', null, 'a', 'b')).toEqual({
      type: 'div',
      props: {
        children: [
          {
            props: {
              children: [],
              nodeValue: 'a',
            },
            type: 'TEXT_ELEMENT',
          },
          {
            props: {
              children: [],
              nodeValue: 'b',
            },
            type: 'TEXT_ELEMENT',
          },
        ],
      },
    })

    expect(createElement('div', { id: 'foo' })).toEqual({
      type: 'div',
      props: {
        id: 'foo',
        children: [],
      },
    })

    expect(createElement('div', { id: 'foo' }, 'a', 'b')).toEqual({
      type: 'div',
      props: {
        id: 'foo',
        children: [
          {
            props: {
              children: [],
              nodeValue: 'a',
            },
            type: 'TEXT_ELEMENT',
          },
          {
            props: {
              children: [],
              nodeValue: 'b',
            },
            type: 'TEXT_ELEMENT',
          },
        ],
      },
    })
  })
})
