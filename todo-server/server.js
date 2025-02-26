import Fastify from 'fastify';

export function buildApp() {
  const fastify = Fastify({ logger: true });
  const port = 3000;
  let todos = [];

  // Create a new todo
  fastify.post('/todos', async (request, reply) => {
      const todo = { id: todos.length + 1, ...request.body };
      todos.push(todo);
      reply.code(201).send(todo);
  });

  // Read all todos
  fastify.get('/todos', async (request, reply) => {
      reply.send(todos);
  });

  // Read a single todo by id
  fastify.get('/todos/:id', async (request, reply) => {
      const todo = todos.find(t => t.id === parseInt(request.params.id));
      if (!todo) {
          reply.code(404).send('Todo not found');
      } else {
          reply.send(todo);
      }
  });

  // Update a todo by id
  fastify.put('/todos/:id', async (request, reply) => {
      const todo = todos.find(t => t.id === parseInt(request.params.id));
      if (!todo) {
          reply.code(404).send('Todo not found');
      } else {
          Object.assign(todo, request.body);
          reply.send(todo);
      }
  });

  // Delete a todo by id
  fastify.delete('/todos/:id', async (request, reply) => {
      const todoIndex = todos.findIndex(t => t.id === parseInt(request.params.id));
      if (todoIndex === -1) {
          reply.code(404).send('Todo not found');
      } else {
          const deletedTodo = todos.splice(todoIndex, 1);
          reply.send(deletedTodo);
      }
  });

  return fastify;
}