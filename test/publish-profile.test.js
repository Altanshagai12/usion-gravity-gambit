const test = require('node:test');
const assert = require('node:assert/strict');
const { API_ORIGIN, PROFILE, publishProfile, readToken } = require('../scripts/publish-profile');

test('profile publisher accepts only scoped Usion service tokens', () => {
  assert.throws(() => readToken({}), /USION_API_TOKEN/);
  assert.throws(() => readToken({ USION_API_TOKEN: 'wrong-token' }), /USION_API_TOKEN/);
  const token = `usion_sk_${'x'.repeat(24)}`;
  assert.equal(readToken({ USION_API_TOKEN: token }), token);
});

test('profile publisher sends only the configured image and verifies the public registry', async () => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url, options });
    if (url === PROFILE.image) return new Response('png', { headers: { 'content-type': 'image/png' } });
    if (url === `${API_ORIGIN}/registry/services/my/${PROFILE.id}`) return Response.json({ id: PROFILE.id });
    if (url === `${API_ORIGIN}/registry/services`) return Response.json([{ ...PROFILE }]);
    return new Response('not found', { status: 404 });
  };

  const token = `usion_sk_${'x'.repeat(24)}`;
  const service = await publishProfile({ env: { USION_API_TOKEN: token }, fetchImpl });
  const update = calls.find((call) => call.options.method === 'PUT');
  assert.deepEqual(JSON.parse(update.options.body), { image: PROFILE.image });
  assert.equal(update.options.headers.Authorization, `Bearer ${token}`);
  assert.equal(service.image, PROFILE.image);
});
