import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';

const seedUsers = [
  { id: '1', name: 'Avery Morgan', email: 'avery.morgan@example.com' },
  { id: '2', name: 'Riley Chen', email: 'riley.chen@example.com' },
  { id: '3', name: 'Jordan Reyes', email: 'jordan.reyes@example.com' },
];

function sendJson(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function validateUser(body, partial) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return 'Request body must be a JSON object.';
  }
  if (Object.hasOwn(body, 'id')) {
    return 'id is server-owned and cannot be supplied.';
  }
  for (const field of ['name', 'email']) {
    if (partial && !Object.hasOwn(body, field)) {
      continue;
    }
    if (typeof body[field] !== 'string' || body[field].trim().length === 0) {
      return `${field} must be a nonempty string.`;
    }
  }
  return null;
}

// Each server has its own seed state and does not listen until the caller starts it.
export function createMockApiServer() {
  const users = seedUsers.map((user) => ({ ...user }));

  return createServer(async (request, response) => {
    let pathname;
    try {
      pathname = new URL(request.url, 'http://127.0.0.1').pathname;
    } catch {
      sendJson(response, 400, { message: 'Invalid request URL.' });
      return;
    }

    const route = /^\/api\/users(?:\/([^/]+))?$/.exec(pathname);
    if (!route) {
      sendJson(response, 404, { message: 'Not found.' });
      return;
    }

    const isDetail = route[1] !== undefined;
    const allowedMethods = isDetail ? ['GET', 'PUT', 'PATCH', 'DELETE'] : ['GET', 'POST'];
    if (!allowedMethods.includes(request.method)) {
      response.setHeader('Allow', allowedMethods.join(', '));
      sendJson(response, 405, { message: 'Method not allowed.' });
      return;
    }

    let userIndex;
    if (isDetail) {
      let id;
      try {
        id = decodeURIComponent(route[1]);
      } catch {
        sendJson(response, 400, { message: 'Invalid user ID encoding.' });
        return;
      }
      userIndex = users.findIndex((user) => user.id === id);
      if (userIndex === -1) {
        sendJson(response, 404, { message: 'User not found.' });
        return;
      }
    }

    if (request.method === 'GET') {
      sendJson(response, 200, isDetail ? users[userIndex] : users);
      return;
    }
    if (request.method === 'DELETE') {
      users.splice(userIndex, 1);
      response.writeHead(204);
      response.end();
      return;
    }

    let body;
    try {
      body = await readJson(request);
    } catch {
      sendJson(response, 400, { message: 'Request body must contain valid JSON.' });
      return;
    }
    const validationError = validateUser(body, request.method === 'PATCH');
    if (validationError) {
      sendJson(response, 400, { message: validationError });
      return;
    }

    if (request.method === 'POST') {
      const user = { id: randomUUID(), name: body.name, email: body.email };
      users.push(user);
      sendJson(response, 201, user);
      return;
    }

    // Look up again after reading the body in case another request deleted this user.
    userIndex = users.findIndex((user) => user.id === decodeURIComponent(route[1]));
    if (userIndex === -1) {
      sendJson(response, 404, { message: 'User not found.' });
      return;
    }
    const user = users[userIndex];
    for (const field of ['name', 'email']) {
      if (Object.hasOwn(body, field)) {
        user[field] = body[field];
      }
    }
    sendJson(response, 200, user);
  });
}
