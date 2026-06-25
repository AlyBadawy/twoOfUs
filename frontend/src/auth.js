import { UserManager, WebStorageStateStore } from 'oidc-client-ts';

let _manager = null;
let _initPromise = null;

async function init() {
  const res = await fetch('/api/config');
  if (!res.ok) throw new Error(`Failed to load OIDC config: ${res.status}`);
  const { authority, clientId, redirectUri } = await res.json();
  return new UserManager({
    authority,
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid profile email',
    userStore: new WebStorageStateStore({ store: window.localStorage }),
  });
}

export async function getUserManager() {
  if (_manager) return _manager;
  if (!_initPromise) _initPromise = init();
  _manager = await _initPromise;
  return _manager;
}
