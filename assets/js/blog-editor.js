(() => {
  const app = document.getElementById('blog-editor-app');
  if (!app) return;

  const apiUrl = app.dataset.apiUrl.replace(/\/$/, '');
  const tokenKey = 'weekend_admin_session';
  const draftKey = 'current';
  const maxSuggestionChars = 1200;
  const maxImageBytes = 3 * 1024 * 1024;
  const state = {
    session: null,
    categories: [],
    stagedAssets: [],
    previewUrls: new Map(),
    suggestionWindow: null,
    suggestionController: null,
    suggestionTimer: null,
    lastSuggestedText: '',
    slugTouched: false,
    privacyValue: false,
    saveTimer: null
  };

  const el = (id) => document.getElementById(id);
  const loginPanel = el('editor-login');
  const workspace = el('editor-workspace');
  const loginForm = el('editor-login-form');
  const loginStatus = el('editor-login-status');
  const editorStatus = el('editor-status');
  const passwordInput = el('editor-password');
  const titleInput = el('post-title');
  const slugInput = el('post-slug');
  const categoryInput = el('post-category');
  const tagsInput = el('post-tags');
  const privateToggle = el('post-private');
  const privateAiOption = el('private-ai-option');
  const privateAiConsent = el('private-ai-consent');
  const autoAiToggle = el('auto-ai');
  const privateTagsNote = el('private-tags-note');
  const bodyInput = el('post-body');
  const preview = el('post-preview');
  const imageInput = el('post-image-input');
  const stagedPanel = el('staged-assets-panel');
  const stagedList = el('staged-assets-list');
  const suggestionsPanel = el('ai-suggestions');
  const polishPanel = el('polish-result-panel');
  const polishResult = el('polish-result');
  const polishSummary = el('polish-summary');

  const setStatus = (message, type = '') => {
    editorStatus.textContent = message;
    editorStatus.classList.toggle('is-error', type === 'error');
    editorStatus.classList.toggle('is-success', type === 'success');
  };

  const configured = () => !apiUrl.includes('YOUR-VERCEL-PROJECT');

  const loadSession = () => {
    try {
      const session = JSON.parse(sessionStorage.getItem(tokenKey));
      if (!session?.token || Date.now() >= session.expiresAt) return null;
      return session;
    } catch {
      return null;
    }
  };

  const saveSession = (session) => {
    state.session = session;
    sessionStorage.setItem(tokenKey, JSON.stringify(session));
  };

  const clearSession = () => {
    state.session = null;
    sessionStorage.removeItem(tokenKey);
  };

  const apiFetch = async (path, options = {}, requireAuth = true) => {
    const headers = new Headers(options.headers || {});
    if (requireAuth) {
      if (!state.session?.token) throw new Error('Please sign in again.');
      headers.set('Authorization', `Bearer ${state.session.token}`);
    }
    const response = await fetch(`${apiUrl}${path}`, { ...options, headers });
    if (!response.ok) {
      let message = `Request failed (${response.status})`;
      try {
        const result = await response.json();
        if (result.error) message = result.error;
      } catch {
        // Use the HTTP status message.
      }
      if (response.status === 401 && requireAuth) {
        clearSession();
        showLogin();
      }
      const error = new Error(message);
      error.status = response.status;
      throw error;
    }
    return response;
  };

  const postJson = async (path, payload, options = {}) => {
    const response = await apiFetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: options.signal
    }, options.requireAuth !== false);
    return response.json();
  };

  const openDraftDb = () =>
    new Promise((resolve, reject) => {
      const request = indexedDB.open('weekend-blog-editor', 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains('drafts')) {
          request.result.createObjectStore('drafts', { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

  const draftTransaction = async (mode, callback) => {
    const db = await openDraftDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('drafts', mode);
      const store = transaction.objectStore('drafts');
      callback(store, resolve, reject);
      transaction.oncomplete = () => db.close();
      transaction.onerror = () => reject(transaction.error);
    });
  };

  const collectDraft = () => ({
    id: draftKey,
    title: titleInput.value,
    slug: slugInput.value,
    category: categoryInput.value,
    tags: tagsInput.value,
    private: privateToggle.checked,
    privateAiConsent: privateAiConsent.checked,
    autoAi: autoAiToggle.checked,
    body: bodyInput.value,
    stagedAssets: state.stagedAssets,
    updatedAt: Date.now()
  });

  const saveDraft = async () => {
    try {
      const draft = collectDraft();
      await draftTransaction('readwrite', (store, resolve, reject) => {
        const request = store.put(draft);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      setStatus(`Draft saved locally at ${new Date().toLocaleTimeString()}.`);
    } catch {
      setStatus('Local draft autosave is unavailable in this browser.', 'error');
    }
  };

  const scheduleSave = () => {
    window.clearTimeout(state.saveTimer);
    state.saveTimer = window.setTimeout(saveDraft, 650);
  };

  const getDraft = async () => {
    try {
      return await draftTransaction('readonly', (store, resolve, reject) => {
        const request = store.get(draftKey);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch {
      return null;
    }
  };

  const deleteDraft = async () => {
    try {
      await draftTransaction('readwrite', (store, resolve, reject) => {
        const request = store.delete(draftKey);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch {
      // Clearing the visible editor remains useful if IndexedDB is unavailable.
    }
  };

  const slugify = (value) => {
    const slug = value
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 100);
    if (slug) return slug;
    const now = new Date();
    const stamp = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
      '-',
      String(now.getHours()).padStart(2, '0'),
      String(now.getMinutes()).padStart(2, '0')
    ].join('');
    return `post-${stamp}`;
  };

  const renderCategories = (selected = '') => {
    categoryInput.replaceChildren();
    state.categories.forEach((category) => {
      const option = document.createElement('option');
      option.value = category.folder;
      option.textContent = category.name;
      categoryInput.append(option);
    });
    if (selected && state.categories.some((category) => category.folder === selected)) {
      categoryInput.value = selected;
    }
  };

  const previewForAsset = (asset) => {
    if (!asset.previewBlob) return null;
    if (!state.previewUrls.has(asset.id)) {
      state.previewUrls.set(asset.id, URL.createObjectURL(asset.previewBlob));
    }
    return state.previewUrls.get(asset.id);
  };

  const escapeAttribute = (value) =>
    String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('"', '&quot;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');

  const renderPreview = () => {
    let markdown = bodyInput.value;
    markdown = markdown.replace(
      /!\[([^\]]*)\]\(private-asset:\/\/([a-f0-9-]+)\)/gi,
      (_, alt, id) =>
        `<span class="private-asset-placeholder" data-private-asset="${escapeAttribute(id)}" ` +
        `data-alt="${escapeAttribute(alt)}">Private image</span>`
    );
    preview.innerHTML = DOMPurify.sanitize(marked.parse(markdown), {
      ADD_ATTR: ['data-private-asset', 'data-alt']
    });

    state.stagedAssets.forEach((asset) => {
      const previewUrl = previewForAsset(asset);
      if (!previewUrl) return;
      if (asset.privacy === 'private') {
        const placeholder = [...preview.querySelectorAll('[data-private-asset]')].find(
          (node) => node.dataset.privateAsset === asset.id
        );
        if (placeholder) {
          const image = document.createElement('img');
          image.src = previewUrl;
          image.alt = placeholder.dataset.alt || asset.name;
          placeholder.replaceWith(image);
        }
      } else {
        [...preview.querySelectorAll('img')]
          .filter((image) => image.getAttribute('src') === asset.markdownUrl)
          .forEach((image) => {
            image.src = previewUrl;
          });
      }
    });
  };

  const renderStagedAssets = () => {
    stagedList.replaceChildren();
    state.stagedAssets.forEach((asset) => {
      const item = document.createElement('li');
      const name = document.createElement('span');
      name.textContent = `${asset.name} · ${asset.privacy}`;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'button-secondary';
      remove.textContent = 'Remove';
      remove.addEventListener('click', () => {
        const escapedUrl = asset.markdownUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        bodyInput.value = bodyInput.value.replace(
          new RegExp(`!\\[[^\\]]*\\]\\(${escapedUrl}\\)`, 'g'),
          ''
        );
        const previewUrl = state.previewUrls.get(asset.id);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        state.previewUrls.delete(asset.id);
        state.stagedAssets = state.stagedAssets.filter((candidate) => candidate.id !== asset.id);
        renderStagedAssets();
        renderPreview();
        scheduleSave();
      });
      item.append(name, remove);
      stagedList.append(item);
    });
    stagedPanel.classList.toggle('d-none', state.stagedAssets.length === 0);
  };

  const restoreDraft = async () => {
    const draft = await getDraft();
    if (!draft) {
      renderPreview();
      return;
    }
    titleInput.value = draft.title || '';
    slugInput.value = draft.slug || '';
    state.slugTouched = Boolean(draft.slug);
    renderCategories(draft.category);
    tagsInput.value = draft.tags || '';
    privateToggle.checked = Boolean(draft.private);
    state.privacyValue = privateToggle.checked;
    privateAiConsent.checked = Boolean(draft.privateAiConsent);
    autoAiToggle.checked = draft.autoAi !== false;
    bodyInput.value = draft.body || '';
    state.stagedAssets = Array.isArray(draft.stagedAssets) ? draft.stagedAssets : [];
    syncPrivacyUi();
    renderStagedAssets();
    renderPreview();
    setStatus(`Restored a local draft from ${new Date(draft.updatedAt).toLocaleString()}.`, 'success');
  };

  const clearEditor = async () => {
    state.previewUrls.forEach((url) => URL.revokeObjectURL(url));
    state.previewUrls.clear();
    state.stagedAssets = [];
    titleInput.value = '';
    slugInput.value = '';
    tagsInput.value = '';
    bodyInput.value = '';
    privateToggle.checked = false;
    state.privacyValue = false;
    privateAiConsent.checked = false;
    autoAiToggle.checked = true;
    state.slugTouched = false;
    renderCategories(state.categories[0]?.folder || '');
    renderStagedAssets();
    renderPreview();
    suggestionsPanel.innerHTML = '<p class="empty-state">Pause while writing, or select text and click “Suggest now”.</p>';
    polishPanel.classList.add('d-none');
    await deleteDraft();
    syncPrivacyUi();
    setStatus('Draft cleared.');
  };

  const showEditor = async () => {
    loginPanel.classList.add('d-none');
    workspace.classList.remove('d-none');
    await restoreDraft();
  };

  function showLogin() {
    workspace.classList.add('d-none');
    loginPanel.classList.remove('d-none');
  }

  const syncPrivacyUi = () => {
    const isPrivate = privateToggle.checked;
    privateAiOption.classList.toggle('d-none', !isPrivate);
    privateTagsNote.classList.toggle('d-none', !isPrivate);
    tagsInput.disabled = isPrivate;
    if (isPrivate) tagsInput.value = '';
  };

  const currentWindow = () => {
    let start = bodyInput.selectionStart;
    let end = bodyInput.selectionEnd;
    if (start === end) {
      const before = bodyInput.value.lastIndexOf('\n\n', Math.max(0, start - 1));
      const after = bodyInput.value.indexOf('\n\n', start);
      start = before === -1 ? 0 : before + 2;
      end = after === -1 ? bodyInput.value.length : after;
    }
    if (end - start > maxSuggestionChars) {
      const cursor = bodyInput.selectionStart;
      start = Math.max(start, cursor - Math.floor(maxSuggestionChars / 2));
      end = Math.min(end, start + maxSuggestionChars);
    }
    return { start, end, text: bodyInput.value.slice(start, end) };
  };

  const suggestionsAllowed = () => {
    if (!privateToggle.checked) return true;
    if (privateAiConsent.checked) return true;
    setStatus('Enable DeepSeek access explicitly before sending text from a private draft.', 'error');
    return false;
  };

  const renderSuggestions = (result, windowSnapshot) => {
    suggestionsPanel.replaceChildren();
    state.suggestionWindow = windowSnapshot;
    result.suggestions.forEach((suggestion) => {
      const card = document.createElement('article');
      card.className = 'suggestion-card';
      const label = document.createElement('strong');
      label.textContent = suggestion.label;
      const text = document.createElement('p');
      text.textContent = suggestion.text;
      const apply = document.createElement('button');
      apply.type = 'button';
      apply.textContent = 'Use this version';
      apply.addEventListener('click', () => {
        const currentText = bodyInput.value.slice(windowSnapshot.start, windowSnapshot.end);
        if (currentText !== windowSnapshot.text) {
          setStatus('That paragraph changed after the suggestion was generated. Request fresh suggestions.', 'error');
          return;
        }
        bodyInput.setRangeText(suggestion.text, windowSnapshot.start, windowSnapshot.end, 'end');
        renderPreview();
        scheduleSave();
        setStatus(`Applied the “${suggestion.label}” suggestion.`, 'success');
      });
      card.append(label, text, apply);
      suggestionsPanel.append(card);
    });
  };

  const requestSuggestions = async (manual = false) => {
    if (!state.session || !suggestionsAllowed()) return;
    const windowSnapshot = currentWindow();
    if (windowSnapshot.text.trim().length < 5) {
      if (manual) setStatus('Select or write at least a few words first.', 'error');
      return;
    }
    if (!manual && windowSnapshot.text === state.lastSuggestedText) return;

    state.suggestionController?.abort();
    state.suggestionController = new AbortController();
    suggestionsPanel.innerHTML = '<p class="empty-state">DeepSeek is preparing three alternatives…</p>';
    try {
      const result = await postJson(
        '/api/ai/suggest',
        { text: windowSnapshot.text },
        { signal: state.suggestionController.signal }
      );
      state.lastSuggestedText = windowSnapshot.text;
      renderSuggestions(result, windowSnapshot);
    } catch (error) {
      if (error.name === 'AbortError') return;
      suggestionsPanel.innerHTML = `<p class="empty-state"></p>`;
      suggestionsPanel.querySelector('p').textContent = error.message;
    }
  };

  const scheduleSuggestions = () => {
    window.clearTimeout(state.suggestionTimer);
    if (!autoAiToggle.checked) return;
    if (privateToggle.checked && !privateAiConsent.checked) return;
    state.suggestionTimer = window.setTimeout(() => requestSuggestions(false), 1200);
  };

  const wrapSelection = (before, after = before, placeholder = '') => {
    const start = bodyInput.selectionStart;
    const end = bodyInput.selectionEnd;
    const selected = bodyInput.value.slice(start, end) || placeholder;
    bodyInput.setRangeText(`${before}${selected}${after}`, start, end, 'select');
    bodyInput.selectionStart = start + before.length;
    bodyInput.selectionEnd = start + before.length + selected.length;
    bodyInput.focus();
    renderPreview();
    scheduleSave();
  };

  const optimizeImage = async (file) => {
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) throw new Error('Use a JPEG, PNG, WebP, or GIF image.');
    if (file.type === 'image/gif') {
      if (file.size > maxImageBytes) throw new Error('GIF files must be 3 MB or smaller.');
      return file;
    }
    const bitmap = await createImageBitmap(file);
    const maxDimension = 2000;
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    let quality = 0.86;
    let blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
    while (blob && blob.size > maxImageBytes && quality > 0.55) {
      quality -= 0.1;
      blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
    }
    if (!blob || blob.size > maxImageBytes) throw new Error('The optimized image is still larger than 3 MB.');
    return new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' });
  };

  const stageImage = async (file) => {
    if (!configured()) throw new Error('Set editor_api_url in _config.yml after deploying the Vercel API.');
    setStatus('Optimizing and encrypting/staging the image…');
    const optimized = await optimizeImage(file);
    const formData = new FormData();
    formData.append('file', optimized);
    formData.append('privacy', privateToggle.checked ? 'private' : 'public');
    const response = await apiFetch('/api/images/stage', { method: 'POST', body: formData });
    const result = await response.json();
    const asset = { ...result.asset, previewBlob: optimized };
    state.stagedAssets.push(asset);
    const alt = optimized.name.replace(/\.[^.]+$/, '');
    const insertion = `![${alt}](${asset.markdownUrl})`;
    bodyInput.setRangeText(insertion, bodyInput.selectionStart, bodyInput.selectionEnd, 'end');
    renderStagedAssets();
    renderPreview();
    scheduleSave();
    setStatus('Image staged. It will be attached atomically when the post is published.', 'success');
  };

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!configured()) {
      loginStatus.textContent = 'Deploy admin-api and set editor_api_url in _config.yml first.';
      return;
    }
    loginStatus.textContent = 'Signing in…';
    try {
      const session = await postJson('/api/auth/login', { password: passwordInput.value }, { requireAuth: false });
      saveSession(session);
      passwordInput.value = '';
      loginStatus.textContent = '';
      await showEditor();
    } catch (error) {
      loginStatus.textContent = error.message;
    }
  });

  el('editor-logout').addEventListener('click', () => {
    clearSession();
    showLogin();
  });

  el('editor-discard').addEventListener('click', () => {
    if (window.confirm('Discard the local draft and all staged image references?')) clearEditor();
  });

  titleInput.addEventListener('input', () => {
    if (!state.slugTouched) slugInput.value = slugify(titleInput.value);
    scheduleSave();
  });
  slugInput.addEventListener('input', () => {
    state.slugTouched = true;
    scheduleSave();
  });
  categoryInput.addEventListener('change', scheduleSave);
  tagsInput.addEventListener('input', scheduleSave);

  privateToggle.addEventListener('change', () => {
    if (state.stagedAssets.length > 0) {
      privateToggle.checked = state.privacyValue;
      setStatus('Remove staged images before changing the post privacy setting.', 'error');
      return;
    }
    state.privacyValue = privateToggle.checked;
    syncPrivacyUi();
    renderPreview();
    scheduleSave();
  });
  privateAiConsent.addEventListener('change', () => {
    scheduleSave();
    scheduleSuggestions();
  });
  autoAiToggle.addEventListener('change', () => {
    scheduleSave();
    scheduleSuggestions();
  });

  bodyInput.addEventListener('input', () => {
    renderPreview();
    scheduleSave();
    scheduleSuggestions();
  });

  document.querySelectorAll('[data-editor-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.editorAction;
      if (action === 'heading') wrapSelection('## ', '', 'Heading');
      if (action === 'bold') wrapSelection('**', '**', 'bold text');
      if (action === 'italic') wrapSelection('*', '*', 'italic text');
      if (action === 'quote') wrapSelection('> ', '', 'quote');
      if (action === 'list') wrapSelection('- ', '', 'list item');
      if (action === 'code') wrapSelection('`', '`', 'code');
      if (action === 'link') {
        const url = window.prompt('Link URL (https://…)');
        if (url) wrapSelection('[', `](${url})`, 'link text');
      }
      if (action === 'image') imageInput.click();
    });
  });

  imageInput.addEventListener('change', async () => {
    const file = imageInput.files?.[0];
    imageInput.value = '';
    if (!file) return;
    try {
      await stageImage(file);
    } catch (error) {
      setStatus(error.message, 'error');
    }
  });

  el('new-category').addEventListener('click', async () => {
    const name = window.prompt('New Blog category name');
    if (!name?.trim()) return;
    try {
      const result = await postJson('/api/categories', { name: name.trim() });
      state.categories = result.categories;
      renderCategories(result.created.folder);
      scheduleSave();
      setStatus(`Created Blog/${result.created.folder}.`, 'success');
    } catch (error) {
      setStatus(error.message, 'error');
    }
  });

  el('refresh-suggestions').addEventListener('click', () => requestSuggestions(true));

  el('polish-full').addEventListener('click', async () => {
    if (!bodyInput.value.trim()) {
      setStatus('Write the article before requesting a full polish.', 'error');
      return;
    }
    if (!suggestionsAllowed()) return;
    setStatus('DeepSeek is polishing a separate copy of the article…');
    try {
      const result = await postJson('/api/ai/polish', { markdown: bodyInput.value });
      polishResult.value = result.markdown;
      polishSummary.replaceChildren();
      result.summary.forEach((item) => {
        const li = document.createElement('li');
        li.textContent = item;
        polishSummary.append(li);
      });
      polishPanel.classList.remove('d-none');
      setStatus('Full-article candidate is ready. Review it before applying.', 'success');
    } catch (error) {
      setStatus(error.message, 'error');
    }
  });

  el('apply-polish').addEventListener('click', () => {
    if (!window.confirm('Replace the current draft with the polished candidate?')) return;
    bodyInput.value = polishResult.value;
    renderPreview();
    scheduleSave();
    setStatus('Applied the full-article polish.', 'success');
  });

  el('publish-post').addEventListener('click', async () => {
    const title = titleInput.value.trim();
    const slug = slugInput.value.trim();
    const markdown = bodyInput.value.trim();
    if (!title || !slug || !markdown || !categoryInput.value) {
      setStatus('Title, slug, category, and Markdown body are required.', 'error');
      return;
    }
    if (!configured()) {
      setStatus('Deploy admin-api and configure editor_api_url before publishing.', 'error');
      return;
    }
    const button = el('publish-post');
    button.disabled = true;
    setStatus('Creating an atomic Git commit on main…');
    try {
      const result = await postJson('/api/posts/publish', {
        title,
        slug,
        category: categoryInput.value,
        tags: privateToggle.checked
          ? []
          : tagsInput.value.split(',').map((tag) => tag.trim()).filter(Boolean),
        private: privateToggle.checked,
        markdown,
        stagedAssets: state.stagedAssets.map(({ previewBlob, ...asset }) => asset)
      });
      await clearEditor();
      const link = document.createElement('a');
      link.href = result.commitUrl;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = 'View commit';
      editorStatus.replaceChildren(document.createTextNode('Published. GitHub Pages is rebuilding · '), link);
      editorStatus.classList.add('is-success');
    } catch (error) {
      setStatus(error.message, 'error');
    } finally {
      button.disabled = false;
    }
  });

  try {
    state.categories = JSON.parse(el('blog-category-data').textContent);
  } catch {
    state.categories = [
      { name: 'Daily', folder: 'Daily' },
      { name: 'Math', folder: 'Math' },
      { name: 'MoA', folder: 'MoA' }
    ];
  }
  renderCategories();
  state.session = loadSession();
  if (state.session && configured()) showEditor();
  else showLogin();

  window.addEventListener('beforeunload', () => {
    state.previewUrls.forEach((url) => URL.revokeObjectURL(url));
  });
})();
