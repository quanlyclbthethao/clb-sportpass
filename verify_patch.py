import sys, re, json
sys.stdout.reconfigure(encoding='utf-8')

with open('index.html', encoding='utf-8') as f:
    html = f.read()

errors = []

# 1. Check Tây Bắc
if 'Tây Bắc' in html:
    errors.append("Still contains 'Tây Bắc'")

# 2. Check Trải nghiệm nhanh
if 'Trải nghiệm nhanh' in html:
    errors.append("Still contains 'Trải nghiệm nhanh'")

# 3. Check quickFillLogin
if 'quickFillLogin' in html:
    errors.append("Still contains 'quickFillLogin'")

# 4. Check toggleDemoRole in UI
if 'lblSwitchRole' in html or 'toggleDemoRole()' in html:
    errors.append("Still contains 'lblSwitchRole' or 'toggleDemoRole'")

# 5. Check DEFAULT_MEMBERS_DIRECTORY admins
m_dir = re.search(r'const DEFAULT_MEMBERS_DIRECTORY = (\[.*?\]);', html)
if m_dir:
    members = json.loads(m_dir.group(1))
    admins = [m for m in members if m.get('isAdmin')]
    if len(admins) != 1 or admins[0]['id'] != 'DMC0806':
        errors.append(f"Admins in DEFAULT_MEMBERS_DIRECTORY should only be DMC0806, but got {len(admins)}: {[x['id'] for x in admins]}")
else:
    errors.append("Could not find DEFAULT_MEMBERS_DIRECTORY")

# 6. Check modalEditProfile
if 'id="modalEditProfile"' not in html:
    errors.append("modalEditProfile is missing")

# 7. Check saveMemberProfileEdit and openEditProfileModal
if 'openEditProfileModal' not in html or 'saveMemberProfileEdit' not in html:
    errors.append("Profile edit functions missing")

# 8. Check notes in tasks
if 'iptTaskNotes' not in html:
    errors.append("iptTaskNotes is missing")
if 'Ghi chú nhiệm vụ:' not in html:
    errors.append("Ghi chú nhiệm vụ display missing in renderTasksList")

# 9. Check deleteTask and deletePost tombstones
if 'saveDeletedTaskId' not in html or 'saveDeletedPostId' not in html:
    errors.append("Tombstone functions missing")

# 10. Check notification
if 'requestNotificationPermission' not in html:
    errors.append("requestNotificationPermission missing")

if errors:
    print("VERIFICATION FAILED:")
    for e in errors:
        print("  ❌", e)
    sys.exit(1)
else:
    print("ALL 10 VERIFICATION CHECKS PASSED PERFECTLY! ✅")
