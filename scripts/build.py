#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SportPass V6.0 Build Compiler & Deterministic Verification Gate
Assembles src/styles/* + src/data/* + src/core/* + src/ui/* into standalone index.html
"""

import os
import re
import sys
import tempfile
import subprocess
from collections import Counter
from html.parser import HTMLParser

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(ROOT_DIR, 'src')

CSS_FILES = [
    os.path.join(SRC_DIR, 'styles', '01-tokens.css'),
    os.path.join(SRC_DIR, 'styles', '02-base.css'),
    os.path.join(SRC_DIR, 'styles', '03-components.css'),
    os.path.join(SRC_DIR, 'styles', '04-motion.css'),
]

JS_FILES = [
    os.path.join(SRC_DIR, 'data', 'members.js'),
    os.path.join(SRC_DIR, 'data', 'defaults.js'),
    os.path.join(SRC_DIR, 'core', 'state.js'),
    os.path.join(SRC_DIR, 'core', 'security.js'),
    os.path.join(SRC_DIR, 'core', 'sync.js'),
    os.path.join(SRC_DIR, 'core', 'rotation.js'),
    os.path.join(SRC_DIR, 'core', 'qr.js'),
    os.path.join(SRC_DIR, 'core', 'notifications.js'),
    os.path.join(SRC_DIR, 'ui', 'theme.js'),
    os.path.join(SRC_DIR, 'ui', 'modals.js'),
    os.path.join(SRC_DIR, 'ui', 'navigation.js'),
    os.path.join(SRC_DIR, 'ui', 'render-profile.js'),
    os.path.join(SRC_DIR, 'ui', 'render-tasks.js'),
    os.path.join(SRC_DIR, 'ui', 'render-directory.js'),
    os.path.join(SRC_DIR, 'ui', 'render-admin.js'),
    os.path.join(SRC_DIR, 'ui', 'render-forum.js'),
    os.path.join(SRC_DIR, 'ui', 'app.js'),
]

SHELL_PATH = os.path.join(SRC_DIR, 'ui', 'shell.html')
OUT_PATH = os.path.join(ROOT_DIR, 'index.html')


class TagBalanceChecker(HTMLParser):
    VOID_TAGS = {'meta', 'link', 'input', 'img', 'br', 'hr', 'source', 'track', 'wbr', 'area', 'base', 'col', 'embed', 'param'}

    def __init__(self):
        super().__init__()
        self.stack = []
        self.in_raw = False

    def handle_starttag(self, tag, attrs):
        t = tag.lower()
        if t in ('script', 'style'):
            self.in_raw = True
            self.stack.append((t, self.getpos()[0]))
            return
        if not self.in_raw and t not in self.VOID_TAGS:
            self.stack.append((t, self.getpos()[0]))

    def handle_endtag(self, tag):
        t = tag.lower()
        if t in ('script', 'style'):
            self.in_raw = False
        if t in self.VOID_TAGS:
            return
        if not self.stack or self.stack[-1][0] != t:
            raise AssertionError(f"Unbalanced HTML end tag </{t}> at line {self.getpos()[0]} (stack top: {self.stack[-1] if self.stack else 'EMPTY'})")
        self.stack.pop()


def read_utf8(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()


def main():
    shell = read_utf8(SHELL_PATH)
    css_bundle = '\n\n'.join(f'/* === {os.path.basename(p)} === */\n' + read_utf8(p).strip() for p in CSS_FILES)
    js_bundle = '\n\n'.join(f'// === {os.path.basename(p)} ===\n' + read_utf8(p).strip() for p in JS_FILES)

    # Gate 1: Node syntax check on full JS bundle
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as tmp:
        tmp.write(js_bundle)
        tmp_path = tmp.name
    try:
        res = subprocess.run(['node', '--check', tmp_path], capture_output=True, text=True, encoding='utf-8')
        if res.returncode != 0:
            print('JS SYNTAX CHECK FAILED:\n', res.stderr)
            sys.exit(1)
    finally:
        os.unlink(tmp_path)

    # Gate 2: Duplicate top-level function detection
    fn_names = re.findall(r'^(?:async\s+)?function\s+([a-zA-Z0-9_]+)\s*\(', js_bundle, re.M)
    dups = [k for k, v in Counter(fn_names).items() if v > 1]
    if dups:
        print(f'DUPLICATE FUNCTION DECLARATIONS DETECTED: {dups}')
        sys.exit(1)

    assert '/* STYLES_BUNDLE */' in shell, 'Missing STYLES_BUNDLE placeholder'
    assert '/* APP_BUNDLE */' in shell, 'Missing APP_BUNDLE placeholder'

    output = shell.replace('/* STYLES_BUNDLE */', css_bundle, 1).replace('/* APP_BUNDLE */', js_bundle, 1)

    # Gate 3: HTML balance validation (on static shell outside template literals)
    shell_check = shell.replace('/* STYLES_BUNDLE */', '').replace('/* APP_BUNDLE */', '')
    checker = TagBalanceChecker()
    checker.feed(shell_check)
    if checker.stack:
        print(f'UNCLOSED HTML TAGS IN SHELL: {checker.stack}')
        sys.exit(1)

    # Gate 4: Banned strings scan
    banned = ['cdn.tailwindcss.com', 'transition-all', '#000000', 'Tây Bắc', 'quickFillLogin', 'btnOfflineSync']
    for b in banned:
        if b in output:
            print(f'BANNED TOKEN FOUND IN BUILD OUTPUT: {b}')
            sys.exit(1)

    with open(OUT_PATH, 'w', encoding='utf-8', newline='\n') as f:
        f.write(output)

    print(f'[BUILD OK] Assembled {len(CSS_FILES)} CSS + {len(JS_FILES)} JS modules -> {OUT_PATH}')
    print(f'[METRICS] Output size: {len(output):,} bytes | Top-level functions: {len(fn_names)} (0 duplicates) | JS AST: VALID')


if __name__ == '__main__':
    main()
