(() => {
  const root = document.getElementById('private-post');
  const payloadNode = document.getElementById('private-post-payload');
  if (!root || !payloadNode) return;

  const apiUrl = root.dataset.apiUrl.replace(/\/$/, '');
  const form = document.getElementById('private-reader-login');
  const passwordInput = document.getElementById('private-reader-password');
  const status = document.getElementById('private-reader-status');
  const locked = document.getElementById('private-reader-locked');
  const content = document.getElementById('private-reader-content');
  const tokenKey = 'weekend_admin_session';
  const objectUrls = [];
  let payload;

  try {
    payload = JSON.parse(payloadNode.textContent);
  } catch {
    status.textContent = 'This encrypted post is malformed.';
    return;
  }

  const getSession = () => {
    try {
      const session = JSON.parse(sessionStorage.getItem(tokenKey));
      if (!session?.token || Date.now() >= session.expiresAt) return null;
      return session;
    } catch {
      return null;
    }
  };

  const apiRequest = async (path, options = {}) => {
    const response = await fetch(`${apiUrl}${path}`, options);
    if (!response.ok) {
      let message = `Request failed (${response.status})`;
      try {
        const body = await response.json();
        if (body.error) message = body.error;
      } catch {
        // Keep the status-based message.
      }
      const error = new Error(message);
      error.status = response.status;
      throw error;
    }
    return response;
  };

  const escapeAttribute = (value) =>
    String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('"', '&quot;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');

  const renderPrivateMarkdown = async (markdown, assets, token) => {
    const assetMap = new Map(assets.map((asset) => [asset.id, asset]));
    const prepared = markdown.replace(
      /!\[([^\]]*)\]\(private-asset:\/\/([a-f0-9-]+)\)/gi,
      (_, alt, id) =>
        `<span class="private-asset-placeholder" data-private-asset="${escapeAttribute(id)}" ` +
        `data-alt="${escapeAttribute(alt)}">Decrypting image…</span>`
    );

    content.innerHTML = DOMPurify.sanitize(marked.parse(prepared), {
      ADD_ATTR: ['data-private-asset', 'data-alt']
    });

    const placeholders = [...content.querySelectorAll('[data-private-asset]')];
    await Promise.all(
      placeholders.map(async (placeholder) => {
        const asset = assetMap.get(placeholder.dataset.privateAsset);
        if (!asset) {
          placeholder.textContent = 'Encrypted image is unavailable.';
          return;
        }
        try {
          const response = await apiRequest('/api/private/asset', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token: asset.token })
          });
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          objectUrls.push(url);
          const image = document.createElement('img');
          image.src = url;
          image.alt = placeholder.dataset.alt || 'Private image';
          image.loading = 'lazy';
          placeholder.replaceWith(image);
        } catch (error) {
          placeholder.textContent = `Unable to decrypt image: ${error.message}`;
        }
      })
    );
  };

  const unlock = async (token) => {
    status.textContent = 'Decrypting…';
    try {
      const response = await apiRequest('/api/private/decrypt', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ payload })
      });
      const result = await response.json();
      await renderPrivateMarkdown(result.markdown, result.assets || [], token);
      locked.classList.add('d-none');
      content.classList.remove('d-none');
      status.textContent = '';
    } catch (error) {
      if (error.status === 401) sessionStorage.removeItem(tokenKey);
      status.textContent = error.message;
      locked.classList.remove('d-none');
    }
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (apiUrl.includes('YOUR-VERCEL-PROJECT')) {
      status.textContent = 'The editor API has not been configured yet.';
      return;
    }
    status.textContent = 'Signing in…';
    try {
      const response = await apiRequest('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput.value })
      });
      const session = await response.json();
      sessionStorage.setItem(tokenKey, JSON.stringify(session));
      passwordInput.value = '';
      await unlock(session.token);
    } catch (error) {
      status.textContent = error.message;
    }
  });

  const session = getSession();
  if (session && !apiUrl.includes('YOUR-VERCEL-PROJECT')) unlock(session.token);

  window.addEventListener('beforeunload', () => objectUrls.forEach((url) => URL.revokeObjectURL(url)));
})();
