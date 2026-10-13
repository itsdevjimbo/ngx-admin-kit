import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import { createMockApiServer } from './server.mjs';

const seeds = [
  { id: '1', name: 'Avery Morgan', email: 'avery.morgan@example.com' },
  { id: '2', name: 'Riley Chen', email: 'riley.chen@example.com' },
  { id: '3', name: 'Jordan Reyes', email: 'jordan.reyes@example.com' },
];
const newUser = { name: 'Casey Taylor', email: 'casey.taylor@example.com' };

async function startServer(t) {
  const server = createMockApiServer();
  t.after(
    () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  );
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  return async (path = '/api/users', options = {}) => {
    const response = await fetch(`${baseUrl}${path}`, options);
    const text = await response.text();
    return {
      status: response.status,
      headers: response.headers,
      body: text ? JSON.parse(text) : null,
    };
  };
}

function json(method, body) {
  return { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

function assertError(response, status) {
  assert.equal(response.status, status);
  assert.match(response.headers.get('content-type'), /^application\/json/);
  assert.deepEqual(Object.keys(response.body), ['message']);
  assert.equal(typeof response.body.message, 'string');
  assert.ok(response.body.message.length > 0);
}

test('returns the three seeded users and their details, including query strings', async (t) => {
  const request = await startServer(t);
  const list = await request('/api/users?example=true');
  assert.equal(list.status, 200);
  assert.match(list.headers.get('content-type'), /^application\/json/);
  assert.deepEqual(list.body, seeds);
  for (const seed of seeds) {
    const detail = await request(`/api/users/${seed.id}`);
    assert.equal(detail.status, 200);
    assert.deepEqual(detail.body, seed);
  }
  assert.deepEqual((await request('/api/users/%31?example=true')).body, seeds[0]);
});

test('creates, replaces, partially updates, and deletes a user', async (t) => {
  const request = await startServer(t);
  const created = await request('/api/users', json('POST', newUser));
  assert.equal(created.status, 201);
  assert.equal(typeof created.body.id, 'string');
  assert.ok(created.body.id.length > 0);
  assert.deepEqual(created.body, { id: created.body.id, ...newUser });
  assert.equal((await request()).body.length, 4);
  const path = `/api/users/${created.body.id}`;
  assert.deepEqual((await request(path)).body, created.body);

  const replacement = { name: 'Casey Quinn', email: 'casey.quinn@example.com' };
  const replaced = await request(path, json('PUT', replacement));
  assert.equal(replaced.status, 200);
  assert.deepEqual(replaced.body, { id: created.body.id, ...replacement });

  const renamed = await request(path, json('PATCH', { name: 'Casey Parker' }));
  assert.equal(renamed.status, 200);
  assert.deepEqual(renamed.body, { ...replaced.body, name: 'Casey Parker' });
  const emailed = await request(path, json('PATCH', { email: 'casey.parker@example.com' }));
  assert.equal(emailed.status, 200);
  assert.deepEqual(emailed.body, { ...renamed.body, email: 'casey.parker@example.com' });
  assert.deepEqual((await request(path)).body, emailed.body);
  assert.deepEqual((await request(path, json('PATCH', {}))).body, emailed.body);

  const deleted = await request(path, { method: 'DELETE' });
  assert.equal(deleted.status, 204);
  assert.equal(deleted.body, null);
  assert.equal(deleted.headers.get('content-type'), null);
  assert.deepEqual((await request()).body, seeds);
  assertError(await request(path), 404);
  assertError(await request(path, { method: 'DELETE' }), 404);
});

test('generates unique string IDs, including after deletion', async (t) => {
  const request = await startServer(t);
  const ids = new Set(seeds.map((user) => user.id));
  for (let index = 0; index < 3; index++) {
    const created = await request('/api/users', json('POST', newUser));
    assert.equal(created.status, 201);
    assert.equal(typeof created.body.id, 'string');
    assert.ok(created.body.id.length > 0);
    assert.ok(!ids.has(created.body.id));
    ids.add(created.body.id);
    assert.equal(
      (await request(`/api/users/${created.body.id}`, { method: 'DELETE' })).status,
      204,
    );
  }
});

test('rejects malformed JSON for every write method without changing data', async (t) => {
  const request = await startServer(t);
  for (const method of ['POST', 'PUT', 'PATCH']) {
    const path = method === 'POST' ? '/api/users' : '/api/users/1';
    for (const body of ['', '{', '{"name": "Casey",}']) {
      assertError(await request(path, { method, body }), 400);
    }
  }
  assert.deepEqual((await request()).body, seeds);
});

test('validates JSON objects and nonempty string fields without changing data', async (t) => {
  const request = await startServer(t);
  const invalidBodies = [null, [], 'Casey', 42, true];
  for (const field of ['name', 'email']) {
    for (const value of ['', ' \n\t ', null, 42, true, [], {}]) {
      invalidBodies.push({ ...newUser, [field]: value });
    }
  }
  for (const method of ['POST', 'PUT', 'PATCH']) {
    const path = method === 'POST' ? '/api/users' : '/api/users/1';
    for (const body of invalidBodies) {
      assertError(await request(path, json(method, body)), 400);
    }
  }
  for (const method of ['POST', 'PUT']) {
    const path = method === 'POST' ? '/api/users' : '/api/users/1';
    for (const body of [{}, { name: newUser.name }, { email: newUser.email }]) {
      assertError(await request(path, json(method, body)), 400);
    }
  }
  assertError(await request('/api/users/1', json('PATCH', { name: 'Valid', email: '' })), 400);
  assert.deepEqual((await request()).body, seeds);
});

test('keeps IDs server-owned and ignores unrelated fields', async (t) => {
  const request = await startServer(t);
  for (const method of ['POST', 'PUT', 'PATCH']) {
    const path = method === 'POST' ? '/api/users' : '/api/users/1';
    assertError(await request(path, json(method, { ...newUser, id: 'custom-id' })), 400);
  }
  assert.deepEqual((await request()).body, seeds);
  const created = await request('/api/users', json('POST', { ...newUser, extra: 'ignored' }));
  assert.equal(created.status, 201);
  assert.deepEqual(created.body, { id: created.body.id, ...newUser });
  const patched = await request('/api/users/1', json('PATCH', { extra: 'ignored' }));
  assert.equal(patched.status, 200);
  assert.deepEqual(patched.body, seeds[0]);
});

test('returns JSON 404 errors for missing users and unknown paths', async (t) => {
  const request = await startServer(t);
  for (const method of ['GET', 'PUT', 'PATCH', 'DELETE']) {
    const options = ['PUT', 'PATCH'].includes(method) ? json(method, newUser) : { method };
    assertError(await request('/api/users/missing', options), 404);
  }
  for (const path of ['/api', '/api/posts', '/api/users/1/edit', '/users']) {
    assertError(await request(path), 404);
    assertError(await request(path, json('POST', newUser)), 404);
  }
});

test('returns JSON 405 errors and Allow headers on recognized endpoints', async (t) => {
  const request = await startServer(t);
  for (const method of ['PUT', 'PATCH', 'DELETE', 'OPTIONS']) {
    const response = await request('/api/users', { method });
    assertError(response, 405);
    assert.equal(response.headers.get('allow'), 'GET, POST');
  }
  for (const path of ['/api/users/1', '/api/users/missing']) {
    for (const method of ['POST', 'OPTIONS']) {
      const response = await request(path, { method });
      assertError(response, 405);
      assert.equal(response.headers.get('allow'), 'GET, PUT, PATCH, DELETE');
    }
  }
  // HEAD responses have no body, including when the status is an error.
  const head = await request('/api/users', { method: 'HEAD' });
  assert.equal(head.status, 405);
  assert.equal(head.body, null);
  assert.deepEqual((await request()).body, seeds);
});

test('returns a JSON 400 error for malformed user ID encoding', async (t) => {
  const request = await startServer(t);
  assertError(await request('/api/users/%ZZ'), 400);
});

test('isolates server state and starts each instance with fresh seeds', async (t) => {
  const first = await startServer(t);
  const second = await startServer(t);
  await first('/api/users/1', json('PUT', newUser));
  await first('/api/users/2', { method: 'DELETE' });
  await first('/api/users', json('POST', newUser));
  assert.notDeepEqual((await first()).body, seeds);
  assert.deepEqual((await second()).body, seeds);
  assert.deepEqual((await second('/api/users/1')).body, seeds[0]);
  const restarted = await startServer(t);
  assert.deepEqual((await restarted()).body, seeds);
});
