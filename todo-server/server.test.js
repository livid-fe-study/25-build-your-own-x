import assert from 'assert';
import { describe, test, beforeEach, afterEach } from 'node:test';
import { buildApp } from './server.js';

describe('Todo API', () => {
  let app;

  beforeEach(async () => {
    app = await buildApp();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /todos', () => {
    test('상태코드 200을 응답해야 한다.', async () => {
      const response = await app.inject({
        url: '/todos',
      });
      assert.deepStrictEqual(response.statusCode, 200);
      assert.strictEqual(
        response.headers['content-type'],
        'application/json; charset=utf-8'
      );
    });
  });

  describe('GET /todos/:id', () => {
    test('존재하지 않는 todo에 대해 상태코드 404를 응답해야 한다.', async () => {
      const response = await app.inject({
        url: '/todos/999',
      });
      assert.deepStrictEqual(response.statusCode, 404);
    });

    test('존재하는 todo에 대해 상태코드 200을 응답해야 한다.', async () => {
      const postResponse = await app.inject({
        method: 'POST',
        url: '/todos',
        payload: { title: 'Test Todo' },
      });
      const todo = JSON.parse(postResponse.body);

      const getResponse = await app.inject({
        url: `/todos/${todo.id}`,
      });
      assert.deepStrictEqual(getResponse.statusCode, 200);
      const fetchedTodo = JSON.parse(getResponse.body);
      assert.strictEqual(fetchedTodo.title, 'Test Todo');
    });
  });

  describe('POST /todos', () => {
    test('새로운 todo를 생성하고 상태코드 201을 응답해야 한다.', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/todos',
        payload: { title: 'New Todo' },
      });
      assert.deepStrictEqual(response.statusCode, 201);
      const todo = JSON.parse(response.body);
      assert.strictEqual(todo.title, 'New Todo');
    });

    test('빈 payload에 대해 상태코드 400을 응답해야 한다.', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/todos',
        payload: {},
      });
      assert.deepStrictEqual(response.statusCode, 400);
    });
  });

  describe('PUT /todos/:id', () => {
    test('존재하지 않는 todo에 대해 상태코드 404를 응답해야 한다.', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/todos/999',
        payload: { title: 'Updated Todo' },
      });
      assert.deepStrictEqual(response.statusCode, 404);
    });

    test('존재하는 todo를 업데이트하고 상태코드 200을 응답해야 한다.', async () => {
      const postResponse = await app.inject({
        method: 'POST',
        url: '/todos',
        payload: { title: 'Test Todo' },
      });
      const todo = JSON.parse(postResponse.body);

      const putResponse = await app.inject({
        method: 'PUT',
        url: `/todos/${todo.id}`,
        payload: { title: 'Updated Todo' },
      });
      assert.deepStrictEqual(putResponse.statusCode, 200);
      const updatedTodo = JSON.parse(putResponse.body);
      assert.strictEqual(updatedTodo.title, 'Updated Todo');
    });

    test('빈 payload에 대해 상태코드 400을 응답해야 한다.', async () => {
      const postResponse = await app.inject({
        method: 'POST',
        url: '/todos',
        payload: { title: 'Test Todo' },
      });
      const todo = JSON.parse(postResponse.body);

      const putResponse = await app.inject({
        method: 'PUT',
        url: `/todos/${todo.id}`,
        payload: {},
      });
      assert.deepStrictEqual(putResponse.statusCode, 400);
    });
  });

  describe('DELETE /todos/:id', () => {
    test('존재하지 않는 todo에 대해 상태코드 404를 응답해야 한다.', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/todos/999',
      });
      assert.deepStrictEqual(response.statusCode, 404);
    });

    test('존재하는 todo를 삭제하고 상태코드 200을 응답해야 한다.', async () => {
      const postResponse = await app.inject({
        method: 'POST',
        url: '/todos',
        payload: { title: 'Test Todo' },
      });
      const todo = JSON.parse(postResponse.body);

      const deleteResponse = await app.inject({
        method: 'DELETE',
        url: `/todos/${todo.id}`,
      });
      assert.deepStrictEqual(deleteResponse.statusCode, 200);
      const deletedTodo = JSON.parse(deleteResponse.body);
      assert.strictEqual(deletedTodo[0].title, 'Test Todo');
    });
  });
});
