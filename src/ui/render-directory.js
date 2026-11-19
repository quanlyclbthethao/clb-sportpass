// SportPass V6.0 — 125-Member Directory, 8-Column Inspector & Shift Adjustments

function openDirectoryModal() {
  filterDirectoryMembers();
  openGenericModal('modalDirectory');
}

function closeDirectoryModal() {
  closeGenericModal('modalDirectory');
}

function setDirectoryDeptFilter(dept) {
  currentDirDeptFilter = dept || 'ALL';
  filterDirectoryMembers();
}

function filterDirectoryMembers() {
  const filterBar = document.getElementById('directoryDeptFilterBar');
  if (filterBar) {
    const chips = [
      `<button type="button" class="focus-ring spring-touch filter-chip ${currentDirDeptFilter === 'ALL' ? 'active' : ''}" onclick="setDirectoryDeptFilter('ALL')">Tất cả</button>`
    ];
    for (const d of ALL_DEPARTMENTS) {
      const shortName = d.replace(/^Ban\s+/i, '');
      chips.push(`<button type="button" class="focus-ring spring-touch filter-chip ${currentDirDeptFilter === d ? 'active' : ''}" onclick="setDirectoryDeptFilter('${escapeHtml(d)}')">${escapeHtml(shortName)}</button>`);
    }
    filterBar.innerHTML = chips.join('');
  }

  const q = (document.getElementById('iptSearchDirectory')?.value || '').trim().toLowerCase();
  const list = (membersDirectory || []).filter(m => {
    if (currentDirDeptFilter !== 'ALL' && m.boMon !== currentDirDeptFilter) return false;
    if (!q) return true;
    return (
      String(m.hoTen || '').toLowerCase().includes(q) ||
      String(m.id || '').toLowerCase().includes(q) ||
      String(m.lop || '').toLowerCase().includes(q) ||
      String(m.boMon || '').toLowerCase().includes(q)
    );
  });

  safeSetText('directoryCountLabel', `${list.length} / ${(membersDirectory || []).length} hồ sơ`);
  const box = document.getElementById('directoryListContainer');
  if (!box) return;

  if (list.length === 0) {
    box.innerHTML = '<div class="sp-empty">Không tìm thấy thành viên phù hợp.</div>';
    return;
  }

  box.innerHTML = list.map(m => `
    <button type="button" class="focus-ring spring-touch acrylic-card member-item-card" style="width:100%;text-align:left;" onclick="openOtherMemberInspector('${escapeHtml(m.id)}')">
      <div style="min-width:0;">
        <div style="font-weight:700;font-size:14px;color:var(--sp-text);">${escapeHtml(m.hoTen)}</div>
        <div style="font-size:12px;color:var(--sp-text2);">${escapeHtml(m.boMon)} • ${escapeHtml(m.chucVu)}</div>
      </div>
      <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
        <span class="sp-badge sp-badge-accent mono-num">${escapeHtml(m.id)}</span>
        <span class="sp-badge sp-badge-muted mono-num">${Number(m.soCaHoanThanh ?? m.soCa ?? 0)} ca</span>
      </div>
    </button>
  `).join('');
}

function openOtherMemberInspector(memberId) {
  const m = (membersDirectory || []).find(x => x.id === memberId);
  if (!m) return;
  selectedOtherMember = m;

  safeSetText('otherMemNameVal', m.hoTen || '');
  safeSetText('otherMemIdVal', m.id || '');
  safeSetText('otherClass', m.lop || 'Chưa rõ');
  safeSetText('otherDept', m.boMon || '');
  safeSetText('otherRoleVal', m.chucVu || 'Thành viên');
  safeSetText('otherMed', m.yTe || 'Bình thường');
  safeSetText('otherPhone', m.sdt || 'Chưa cập nhật');
  safeSetText('otherIce', m.ice || m.sdt || 'Chưa cập nhật');
  safeSetText('otherShiftsCountVal', String(m.soCaHoanThanh ?? m.soCa ?? 0));

  const adjRow = document.getElementById('adminShiftAdjustRow');
  if (adjRow) {
    adjRow.classList.toggle('hidden', !(currentUser && currentUser.isAdmin));
  }

  openGenericModal('modalOtherMemberDetails');
}

function closeOtherMemberModal() {
  closeGenericModal('modalOtherMemberDetails');
}

function callTargetMemberPhone() {
  if (selectedOtherMember) makePhoneCall(selectedOtherMember.sdt);
}

function callTargetMemberIce() {
  if (selectedOtherMember) makePhoneCall(selectedOtherMember.ice || selectedOtherMember.sdt);
}

function promptAdjustSelectedMemberShifts(delta) {
  if (!selectedOtherMember) return;
  openAdjustShiftsModal(selectedOtherMember.id, delta);
}

function openAdjustShiftsModal(memberId, delta = 1) {
  const m = (membersDirectory || []).find(x => x.id === memberId);
  if (!m) return;
  adjustShiftsTargetId = memberId;
  adjustShiftsDelta = Number(delta) || 1;
  safeSetText('adjustShiftsMemberName', m.hoTen || '');
  safeSetText('adjustShiftsMemberInfo', `${m.id} • Hiện có ${Number(m.soCaHoanThanh ?? m.soCa ?? 0)} ca`);
  safeSetText('adjustDeltaDisplay', adjustShiftsDelta >= 0 ? `+${adjustShiftsDelta}` : String(adjustShiftsDelta));
  safeSetValue('iptAdjustShiftsReason', '');
  openGenericModal('modalAdjustShifts');
}

function closeAdjustShiftsModal() {
  closeGenericModal('modalAdjustShifts');
}

function changeAdjustDelta(d) {
  adjustShiftsDelta += Number(d) || 0;
  safeSetText('adjustDeltaDisplay', adjustShiftsDelta >= 0 ? `+${adjustShiftsDelta}` : String(adjustShiftsDelta));
}

function executeAdjustShiftsSubmit() {
  if (!adjustShiftsTargetId) return;
  const reason = (document.getElementById('iptAdjustShiftsReason')?.value || '').trim() || 'Điều chỉnh từ Ban Điều Phối';
  let newVal = 0;

  for (const m of (membersDirectory || [])) {
    if (m.id === adjustShiftsTargetId) {
      const next = Math.max(0, (Number(m.soCaHoanThanh ?? m.soCa ?? 0)) + adjustShiftsDelta);
      m.soCaHoanThanh = next;
      m.soCa = next;
      newVal = next;
    }
  }

  if (currentUser && currentUser.id === adjustShiftsTargetId) {
    currentUser.soCaHoanThanh = newVal;
    currentUser.soCa = newVal;
    renderProfileData();
  }
  if (selectedOtherMember && selectedOtherMember.id === adjustShiftsTargetId) {
    selectedOtherMember.soCaHoanThanh = newVal;
    selectedOtherMember.soCa = newVal;
    safeSetText('otherShiftsCountVal', String(newVal));
  }

  const adminActorId = currentUser ? currentUser.id : 'DMC0806';
  const payload = { memberId: adjustShiftsTargetId, delta: adjustShiftsDelta, reason, adminActorId };
  if (navigator.onLine) {
    fetch(`${GAS_API_URL}?action=adjustMemberShifts&memberId=${encodeURIComponent(payload.memberId)}&delta=${encodeURIComponent(payload.delta)}&reason=${encodeURIComponent(reason)}&adminActorId=${encodeURIComponent(adminActorId)}`)
      .catch(() => enqueueOfflineMutation('SHIFT_ADJUST', payload));
  } else {
    enqueueOfflineMutation('SHIFT_ADJUST', payload);
  }

  saveLocalState();
  closeAdjustShiftsModal();
  showAquaIsland(`Đã cập nhật ${adjustShiftsDelta >= 0 ? '+' : ''}${adjustShiftsDelta} ca cho ${adjustShiftsTargetId}.`, '⚖️');
}
