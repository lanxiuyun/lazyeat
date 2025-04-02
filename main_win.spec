# -*- mode: python ; coding: utf-8 -*-


a = Analysis(
    ['src-py\\main.py'],
    pathex=[],
    binaries=[],
        datas=[
        ('C:\\Users\\che\\miniconda3\\envs\\lazyeat\\Lib\\site-packages\\vosk\\*', 'vosk'),
        ('C:\\Users\\che\\miniconda3\\envs\\lazyeat\\Lib\\site-packages\\uvicorn\\*', 'uvicorn'),
    ],
    hiddenimports=[
        'vosk',
        'uvicorn',
        'uvicorn.logging',
        'uvicorn.protocols',
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
    name='Lazyeat Backend-x86_64-pc-windows-msvc',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
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
