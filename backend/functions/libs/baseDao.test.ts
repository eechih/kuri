import { toExpression } from './baseDao'

describe('Convert patches to Expression', () => {
  test('Adding an Object Member', () => {
    const patches = [
      {
        op: 'add',
        path: '/baz',
        value: 'qux',
      },
    ]
    const extected = {
      updateExpression: 'SET #baz = :baz',
      expressionAttributeNames: { '#baz': 'baz' },
      expressionAttributeValues: { ':baz': 'qux' },
    }
    expect(toExpression(patches)).toEqual(extected)
  })

  test('Adding an Array Element', () => {
    const patches = [
      {
        op: 'add',
        path: '/foo/1',
        value: 'qux',
      },
    ]
    const extected = {
      updateExpression: 'SET #foo[1] = :foo_1',
      expressionAttributeNames: { '#foo': 'foo' },
      expressionAttributeValues: { ':foo_1': 'qux' },
    }
    expect(toExpression(patches)).toEqual(extected)
  })

  test('Removing an Object Member', () => {
    const patches = [
      {
        op: 'remove',
        path: '/baz',
      },
    ]
    const extected = {
      updateExpression: 'REMOVE #baz',
      expressionAttributeNames: { '#baz': 'baz' },
      expressionAttributeValues: {},
    }
    expect(toExpression(patches)).toEqual(extected)
  })

  test('Removing an Array Element', () => {
    const patches = [
      {
        op: 'remove',
        path: '/foo/1',
      },
    ]
    const extected = {
      updateExpression: 'REMOVE #foo[1]',
      expressionAttributeNames: { '#foo': 'foo' },
      expressionAttributeValues: {},
    }
    expect(toExpression(patches)).toEqual(extected)
  })

  test('Replacing a Value', () => {
    const patches = [
      {
        op: 'replace',
        path: '/baz',
        value: 'boo',
      },
    ]
    const extected = {
      updateExpression: 'SET #baz = :baz',
      expressionAttributeNames: { '#baz': 'baz' },
      expressionAttributeValues: { ':baz': 'boo' },
    }
    expect(toExpression(patches)).toEqual(extected)
  })

  test('Adding a Nested Member Object', () => {
    const patches = [
      {
        op: 'add',
        path: '/child',
        value: { grandchild: {} },
      },
    ]
    const extected = {
      updateExpression: 'SET #child = :child',
      expressionAttributeNames: { '#child': 'child' },
      expressionAttributeValues: { ':child': { grandchild: {} } },
    }
    expect(toExpression(patches)).toEqual(extected)
  })

  test('Ignoring Unrecognized Elements', () => {
    const patches = [
      {
        op: 'add',
        path: '/baz',
        value: 'qux',
        xyz: 123,
      },
    ]
    const extected = {
      updateExpression: 'SET #baz = :baz',
      expressionAttributeNames: { '#baz': 'baz' },
      expressionAttributeValues: { ':baz': 'qux' },
    }
    expect(toExpression(patches)).toEqual(extected)
  })

  test('Removing an Array Element and Replacing an Array Element', () => {
    const patches = [
      {
        op: 'remove',
        path: '/foo/1',
      },
      {
        op: 'replace',
        path: '/foo/0',
        value: 'qux',
      },
    ]
    const extected = {
      updateExpression: 'REMOVE #foo[1] SET #foo[0] = :foo_0',
      expressionAttributeNames: { '#foo': 'foo' },
      expressionAttributeValues: { ':foo_0': 'qux' },
    }
    expect(toExpression(patches)).toEqual(extected)
  })
})
