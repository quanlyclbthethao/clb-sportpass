// SportPass V6.0 — Club Community Forum Feed, Media Lightbox & Reactions

function renderForumFeed() {
  const container = document.getElementById('postsListContainer');
  if (!container) return;

  const deleted = getDeletedPostIds();
  const visible = (currentPosts || []).filter(p => p && !deleted.includes(p.id));
  currentPosts = visible;

  if (visible.length === 0) {
    container.innerHTML = '<div class="sp-empty">Chưa có bài viết nào trên diễn đàn CLB.</div>';
    return;
  }

  const uid = currentUser ? currentUser.id : '';
  const isAdmin = Boolean(currentUser && currentUser.isAdmin);

  container.innerHTML = visible.map((post) => {
    const canEdit = isAdmin || (uid && post.authorId === uid);
    const rx = post.reactions || { like: 0, love: 0, wow: 0, userReactions: {} };
    const myReact = (rx.userReactions && uid) ? rx.userReactions[uid] : null;
    const mediaHtml = Array.isArray(post.mediaList) && post.mediaList.length > 0
      ? `<div class="media-reel">${post.mediaList.map((src, idx) => `<img src="${escapeHtml(src)}" alt="Ảnh bài viết" class="media-thumb" onclick="openLightboxByPost('${escapeHtml(post.id)}', ${idx})">`).join('')}</div>`
      : '';

    const commentsHtml = Array.isArray(post.comments) && post.comments.length > 0
      ? post.comments.map(c => `
        <div class="comment-item">
          <div style="display:flex;justify-content:space-between;gap:8px;font-weight:700;font-size:12px;">
            <span>${escapeHtml(c.authorName || c.authorId)}</span>
            <span class="mono-num" style="color:var(--sp-muted);">${escapeHtml(c.createdAt || '')}</span>
          </div>
          <div style="margin-top:2px;color:var(--sp-text);">${escapeHtml(c.content)}</div>
        </div>
      `).join('')
      : '';

    return `
      <article class="acrylic-card forum-post stagger-item">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:38px;height:38px;border-radius:12px;background:var(--sp-accent-soft);color:var(--sp-brand);font-weight:700;display:grid;place-items:center;font-size:13px;">
              ${escapeHtml(post.isAnonymous ? 'ẨD' : getSportPassInitials(post.authorName))}
            </div>
            <div>
              <div style="font-weight:700;font-size:14px;">${escapeHtml(post.isAnonymous ? 'Thành viên ẩn danh' : post.authorName)}</div>
              <div class="mono-num" style="font-size:11px;color:var(--sp-muted);">${escapeHtml(post.createdAt || 'Vừa xong')}</div>
            </div>
          </div>
          ${canEdit ? `
            <div style="display:flex;gap:6px;">
              <button type="button" class="focus-ring spring-touch mini-icon-btn" aria-label="Sửa bài" onclick="openEditPostModal('${escapeHtml(post.id)}')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
              </button>
              <button type="button" class="focus-ring spring-touch mini-icon-btn danger" aria-label="Xóa bài" onclick="confirmDeletePost('${escapeHtml(post.id)}')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
              </button>
            </div>
          ` : ''}
        </div>

        <p style="margin:0;font-size:13.5px;line-height:1.55;color:var(--sp-text);white-space:pre-line;">${escapeHtml(post.content)}</p>

        ${mediaHtml}

        <div class="reaction-bar">
          <button type="button" class="focus-ring spring-touch react-pill ${myReact === 'like' ? 'active' : ''}" onclick="setReaction('${escapeHtml(post.id)}', 'like')">Thích • <span class="mono-num">${Number(rx.like || 0)}</span></button>
          <button type="button" class="focus-ring spring-touch react-pill ${myReact === 'love' ? 'active' : ''}" onclick="setReaction('${escapeHtml(post.id)}', 'love')">Yêu thích • <span class="mono-num">${Number(rx.love || 0)}</span></button>
          <button type="button" class="focus-ring spring-touch react-pill ${myReact === 'wow' ? 'active' : ''}" onclick="setReaction('${escapeHtml(post.id)}', 'wow')">Ấn tượng • <span class="mono-num">${Number(rx.wow || 0)}</span></button>
        </div>

        <div class="comment-box">
          ${commentsHtml}
          <div style="display:flex;gap:8px;">
            <input type="text" id="iptComment_${escapeHtml(post.id)}" class="sp-input" style="min-height:38px;padding:6px 12px;font-size:13px;" placeholder="Viết bình luận...">
            <button type="button" class="focus-ring spring-touch sp-btn sp-btn-sm sp-btn-primary" onclick="submitCommentAction('${escapeHtml(post.id)}')">Gửi</button>
          </div>
        </div>
      </article>
    `;
  }).join('');

  applyStaggerFallback(container);
}

async function handlePostMediaSelect(event) {
  const files = event && event.target && event.target.files ? Array.from(event.target.files) : [];
  for (const file of files.slice(0, 4)) {
    const compressed = await compressImage(file, 960, 960, 0.76);
    if (compressed) currentComposerMedia.push(compressed);
  }
  renderComposerMediaReel();
}

function renderComposerMediaReel() {
  const box = document.getElementById('composerMediaReel');
  if (!box) return;
  if (currentComposerMedia.length === 0) {
    box.innerHTML = '';
    box.classList.add('hidden');
    return;
  }
  box.classList.remove('hidden');
  box.innerHTML = currentComposerMedia.map((src, idx) => `
    <div style="position:relative;">
      <img src="${escapeHtml(src)}" alt="Ảnh đính kèm" class="media-thumb">
      <button type="button" class="focus-ring spring-touch sp-close-btn" style="position:absolute;top:6px;right:6px;width:28px;height:28px;" onclick="removeComposerMediaItem(${idx})" aria-label="Gỡ ảnh">×</button>
    </div>
  `).join('');
}

function removeComposerMediaItem(idx) {
  currentComposerMedia.splice(idx, 1);
  renderComposerMediaReel();
}

function submitNewPostAction() {
  if (!currentUser) return;
  const content = (document.getElementById('iptPostContent')?.value || '').trim();
  const isAnonymous = Boolean(document.getElementById('chkPostAnonymous')?.checked);
  if (!content && currentComposerMedia.length === 0) {
    showAquaIsland('Hãy nhập nội dung hoặc đính kèm ảnh.', '⚠️');
    return;
  }
  const newPost = {
    id: 'POST_' + Date.now(),
    authorId: currentUser.id,
    authorName: currentUser.hoTen,
    authorAvatar: currentUser.avatar || '',
    content,
    createdAt: 'Vừa xong',
    isAnonymous,
    reactions: { like: 0, love: 0, wow: 0, userReactions: {} },
    comments: [],
    mediaList: currentComposerMedia.slice(),
    localCreatedAt: Date.now()
  };

  currentPosts.unshift(newPost);
  safeSetValue('iptPostContent', '');
  currentComposerMedia = [];
  renderComposerMediaReel();
  saveLocalState();
  renderForumFeed();

  if (navigator.onLine) {
    fetch(`${GAS_API_URL}?action=createPost`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'createPost', post: newPost })
    }).catch(() => enqueueOfflineMutation('CREATE_POST', newPost));
  } else {
    enqueueOfflineMutation('CREATE_POST', newPost);
  }
  showAquaIsland('Đã đăng bài lên Diễn Đàn CLB.', '📝');
}

function setReaction(postId, rType) {
  if (!currentUser) return;
  const post = (currentPosts || []).find(p => p.id === postId);
  if (!post) return;
  post.reactions = post.reactions || { like: 0, love: 0, wow: 0, userReactions: {} };
  post.reactions.userReactions = post.reactions.userReactions || {};
  const prev = post.reactions.userReactions[currentUser.id];
  if (prev === rType) {
    post.reactions[rType] = Math.max(0, (post.reactions[rType] || 0) - 1);
    delete post.reactions.userReactions[currentUser.id];
  } else {
    if (prev) post.reactions[prev] = Math.max(0, (post.reactions[prev] || 0) - 1);
    post.reactions[rType] = (post.reactions[rType] || 0) + 1;
    post.reactions.userReactions[currentUser.id] = rType;
  }
  saveLocalState();
  renderForumFeed();
}

function toggleReactionDock(postId) {
  setReaction(postId, 'like');
}

function submitCommentAction(postId) {
  if (!currentUser) return;
  const post = (currentPosts || []).find(p => p.id === postId);
  const ipt = document.getElementById('iptComment_' + postId);
  const text = ipt ? ipt.value.trim() : '';
  if (!post || !text) return;
  post.comments = Array.isArray(post.comments) ? post.comments : [];
  post.comments.push({
    id: 'CMT_' + Date.now(),
    authorId: currentUser.id,
    authorName: currentUser.hoTen,
    content: text,
    createdAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    replies: []
  });
  saveLocalState();
  renderForumFeed();
}

function prepareReplyComment() {}
function cancelReplyComment() {}
function confirmDeleteComment() {}

function openEditPostModal(postId) {
  const post = (currentPosts || []).find(p => p.id === postId);
  if (!post) return;
  safeSetValue('iptEditPostId', post.id);
  safeSetValue('iptEditPostContent', post.content);
  openGenericModal('modalEditPost');
}

function closeEditPostModal() {
  closeGenericModal('modalEditPost');
}

function submitEditPostAction() {
  const id = document.getElementById('iptEditPostId')?.value || '';
  const content = (document.getElementById('iptEditPostContent')?.value || '').trim();
  const post = (currentPosts || []).find(p => p.id === id);
  if (!post || !content) return;
  post.content = content;
  saveLocalState();
  renderForumFeed();
  closeEditPostModal();
  showAquaIsland('Đã cập nhật bài viết.', '✏️');
}

function confirmDeletePost(postId) {
  openConfirmDialog('Xóa bài viết', 'Bài viết này sẽ bị xóa khỏi diễn đàn CLB. Tiếp tục?', 'Xóa bài', () => {
    saveDeletedPostId(postId);
    currentPosts = (currentPosts || []).filter(p => p.id !== postId);
    saveLocalState();
    renderForumFeed();
    if (navigator.onLine) {
      fetch(`${GAS_API_URL}?action=deletePost&postId=${encodeURIComponent(postId)}`)
        .catch(() => enqueueOfflineMutation('DELETE_POST', { postId }));
    } else {
      enqueueOfflineMutation('DELETE_POST', { postId });
    }
    showAquaIsland('Đã xóa bài viết.', '🗑️');
  });
}

function openLightboxByPost(postId, idx = 0) {
  const post = (currentPosts || []).find(p => p.id === postId);
  if (!post || !Array.isArray(post.mediaList) || post.mediaList.length === 0) return;
  currentLightboxImages = post.mediaList.slice();
  currentLightboxIdx = Math.max(0, Math.min(idx, currentLightboxImages.length - 1));
  const img = document.getElementById('lightboxImageEl');
  if (img) img.src = currentLightboxImages[currentLightboxIdx];
  openGenericModal('modalLightbox');
}

function stepLightboxMedia(delta) {
  if (!currentLightboxImages.length) return;
  currentLightboxIdx = (currentLightboxIdx + delta + currentLightboxImages.length) % currentLightboxImages.length;
  const img = document.getElementById('lightboxImageEl');
  if (img) img.src = currentLightboxImages[currentLightboxIdx];
}

function closeLightboxModal() {
  closeGenericModal('modalLightbox');
}
