# -*- mode: python ; coding: utf-8 -*-

a = Analysis(
    ['/Users/cjd/Dropbox/CJD/github_projects/lazyeat/src-py/main.py'],
    pathex=[],
    binaries=[],
    datas=[
        ('/Users/cjd/miniconda3/lib/python3.12/site-packages/vosk/*', 'vosk'),
        ('/Users/cjd/miniconda3/lib/python3.12/site-packages/mediapipe/*', 'mediapipe'),
        # Update paths for other `datas` entries
    ],
    hiddenimports=['vosk', 'mediapipe', 'uvicorn', 'uvicorn.logging', 'uvicorn.protocols'],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)
exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='Lazyeat Backend-macos',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,
)
coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='backend-py',
)