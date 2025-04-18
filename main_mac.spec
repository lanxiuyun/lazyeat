# -*- mode: python ; coding: utf-8 -*-
import sys
import site

# Get site-packages directory
site_packages = site.getsitepackages()[0]

a = Analysis(
    ['src-py/main.py'],
    pathex=[],
    binaries=[],
    datas=[
        (f'{site_packages}/vosk/*', 'vosk'),
        # Update paths for other `datas` entries
    ],
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
    name='Lazyeat Backend-aarch64-apple-darwin',
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