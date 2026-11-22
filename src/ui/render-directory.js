// SportPass V7.0 — 125-Member Directory, 8-Column Inspector & Shift Adjustments (Zero innerHTML)

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
    mount(filterBar, buildDeptFilterChips(currentDirDeptFilter, setDirectoryDeptFilter));
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
    mount(box, el('div', { className: 'sp-empty' }, 'Không tìm thấy thành viên phù hợp.'));
    return;
  }

  const items = list.map(m =>
    el('button', {
      type: 'button',
      className: 'focus-ring spring-touch acrylic-card member-item-card',
      style: { width: '100%', textAlign: 'left' },
      onClick: () => openOtherMemberInspector(m.id)
    },
      el('div', { style: { minWidth: '0' } },
        el('div', { style: { fontWeight: '600', fontSize: '14px', color: 'var(--sp-text)' } }, m.hoTen),
        el('div', { style: { fontSize: '12px', color: 'var(--sp-text2)' } }, `${m.boMon} • ${m.chucVu}`)
      ),
      el('div', { style: { display: 'flex', alignItems: 'center', gap: '6px', flexShrink: '0' } },
        el('span', { className: 'sp-badge sp-badge-accent mono-num' }, m.id),
        el('span', { className: 'sp-badge sp-badge-muted mono-num' }, `${Number(m.soCaHoanThanh ?? m.soCa ?? 0)} ca`)
      )
    )
  );
  mount(box, items);
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
