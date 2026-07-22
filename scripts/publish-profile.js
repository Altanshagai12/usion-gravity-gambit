'use strict';

const API_ORIGIN = 'https://mobile.mongolai.mn';
const PROFILE = Object.freeze({
  id: 'gravity-gambit-4a243753',
  name: 'Gravity Gambit',
  image: 'https://gravity-gambit-production.up.railway.app/profile-icon-v1.png',
});

function readToken(env = process.env) {
  const token = String(env.USION_API_TOKEN || '').trim();
  if (!/^usion_sk_[A-Za-z0-9_-]{20,}$/.test(token)) {
    throw new Error('Set a valid USION_API_TOKEN environment variable before publishing.');
  }
  return token;
}

async function expectJson(response, action) {
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 300);
    throw new Error(`${action} failed (${response.status}): ${detail || response.statusText}`);
  }
  return response.json();
}

async function verifyImage(fetchImpl = fetch) {
  const response = await fetchImpl(PROFILE.image, { signal: AbortSignal.timeout(15000) });
  const contentType = response.headers.get('content-type') || '';
  await response.body?.cancel();
  if (!response.ok || !contentType.startsWith('image/png')) {
    throw new Error(`Profile image is not a public PNG (${response.status}, ${contentType || 'unknown type'}).`);
  }
}

async function publishProfile({ env = process.env, fetchImpl = fetch } = {}) {
  await verifyImage(fetchImpl);
  if (process.argv.includes('--dry-run')) return { ...PROFILE, dryRun: true };

  const token = readToken(env);
  const response = await fetchImpl(`${API_ORIGIN}/registry/services/my/${PROFILE.id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: PROFILE.image }),
    signal: AbortSignal.timeout(20000),
  });
  await expectJson(response, `Updating ${PROFILE.name}`);

  const publicServices = await expectJson(
    await fetchImpl(`${API_ORIGIN}/registry/services`, { signal: AbortSignal.timeout(20000) }),
    'Public registry verification',
  );
  const service = publicServices.find((item) => item.id === PROFILE.id);
  if (!service || service.image !== PROFILE.image) throw new Error('Public registry has not returned the new profile image yet.');
  return service;
}

if (require.main === module) {
  publishProfile()
    .then((service) => console.log(`${service.dryRun ? 'Ready' : 'Updated'} ${PROFILE.name}: ${service.image}`))
    .catch((error) => { console.error(error.message); process.exitCode = 1; });
}

module.exports = { API_ORIGIN, PROFILE, publishProfile, readToken, verifyImage };
