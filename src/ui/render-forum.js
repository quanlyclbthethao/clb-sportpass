// SportPass V7.0 — Club Community Forum Feed, Media Lightbox & Reactions (Zero innerHTML)

function renderForumFeed() {
  const container = document.getElementById('postsListContainer');
  if (!container) return;

  const deleted = getDeletedPostIds();
  const visible = (currentPosts || []).filter(p => p && !deleted.includes(p.id));
  currentPosts = visible;

  if (visible.length === 0) {
    mount(container, el('div', { className: 'sp-empty' }, 'Chưa có bài viết nào trên diễn đàn CLB.'));
    return;
  }

  const uid = currentUser ? currentUser.id : '';
  const isAdmin = Boolean(currentUser && currentUser.isAdmin);

  const postNodes = visible.map((post) => {
    const canEdit = isAdmin || (uid && post.authorId === uid);
    const rx = post.reactions || { like: 0, love: 0, wow: 0, userReactions: {} };
    const myReact = (rx.userReactions && uid) ? rx.userReactions[uid] : null;

    const headerActions = canEdit
      ? el('div', { style: { display: 'flex', gap: '6px' } },
          el('button', {
            type: 'button',
            className: 'focus-ring spring-touch mini-icon-btn',
            'aria-label': 'Sửa bài',
            onClick: () => openEditPostModal(post.id)
          }, spIconNode('edit', 14)),
          el('button', {
            type: 'button',
            className: 'focus-ring spring-touch mini-icon-btn danger',
            'aria-label': 'Xóa bài',
            onClick: () => confirmDeletePost(post.id)
          }, spIconNode('trash', 14))
        )
      : null;

    const mediaReel = (Array.isArray(post.mediaList) && post.mediaList.length > 0)
      ? el('div', { className: 'media-reel' },
          post.mediaList.map((src, idx) =>
            el('img', {
              src,
              alt: `Ảnh hoạt động bài viết ${post.authorName || 'CLB'}`,
              loading: 'lazy',
              decoding: 'async',
              className: 'media-thumb',
              onClick: () => openLightboxByPost(post.id, idx)
            })
          )
        )
      : null;

    const commentNodes = (Array.isArray(post.comments) ? post.comments : []).map(c =>
      el('div', { className: 'comment-item' },
        el('div', { style: { display: 'flex', justifyContent: 'space-between', gap: '8px', fontWeight: '600', fontSize: '12px' } },
          el('span', {}, c.authorName || c.authorId),
          el('span', { className: 'mono-num', style: { color: 'var(--sp-muted)' } }, c.createdAt || '')
        ),
        el('div', { style: { marginTop: '2px', color: 'var(--sp-text)' } }, c.content)
      )
    );

    const makeReactionPill = (type, iconName, label) =>
      el('button', {
        type: 'button',
        className: `focus-ring spring-touch react-pill${myReact === type ? ' active' : ''}`,
        onClick: () => setReaction(post.id, type)
      },
        spIconNode(iconName, 13),
        el('span', {}, label),
        el('span', { className: 'mono-num' }, String(Number(rx[type] || 0)))
      );

    return el('article', { className: 'acrylic-card forum-post stagger-item' },
      el('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' } },
        el('div', { style: { display: 'flex', alignItems: 'center', gap: '10px' } },
          el('div', { className: 'forum-author-avatar' },
            post.isAnonymous ? 'ẨD' : getSportPassInitials(post.authorName)
          ),
          el('div', {},
            el('div', { style: { fontWeight: '600', fontSize: '14px' } }, post.isAnonymous ? 'Thành viên ẩn danh' : post.authorName),
            el('div', { className: 'mono-num', style: { fontSize: '11px', color: 'var(--sp-muted)' } }, post.createdAt || 'Vừa xong')
          )
        ),
        headerActions
      ),
      el('p', { className: 'forum-post-body' }, post.content),
      mediaReel,
      el('div', { className: 'reaction-bar' },
        makeReactionPill('like', 'thumbs-up', 'Thích'),
        makeReactionPill('love', 'heart', 'Yêu thích'),
        makeReactionPill('wow', 'sparkles', 'Ấn tượng')
      ),
      el('div', { className: 'comment-box' },
        commentNodes,
        el('div', { style: { display: 'flex', gap: '8px' } },
          el('input', {
            type: 'text',
            id: `iptComment_${post.id}`,
            className: 'sp-input',
            style: { minHeight: '44px', padding: '8px 12px', fontSize: '13px' },
            placeholder: 'Viết bình luận...',
            'aria-label': `Viết bình luận cho bài của ${post.isAnonymous ? 'Thành viên ẩn danh' : post.authorName}`
          }),
          el('button', {
            type: 'button',
            className: 'focus-ring spring-touch sp-btn sp-btn-sm sp-btn-primary',
            onClick: () => submitCommentAction(post.id)
          }, 'Gửi')
        )
      )
    );
  });

  mount(container, postNodes);
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
    box.replaceChildren();
    box.classList.add('hidden');
    return;
  }
  box.classList.remove('hidden');
  const thumbs = currentComposerMedia.map((src, idx) =>
    el('div', { style: { position: 'relative' } },
      el('img', { src, alt: `Ảnh đính kèm ${idx + 1}`, className: 'media-thumb' }),
      el('button', {
        type: 'button',
        className: 'focus-ring spring-touch sp-close-btn composer-remove-btn',
        'aria-label': 'Gỡ ảnh',
        onClick: () => removeComposerMediaItem(idx)
      }, '×')
    )
  );
  mount(box, thumbs);
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
