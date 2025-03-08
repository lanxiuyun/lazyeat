# -*- mode: python ; coding: utf-8 -*-


a = Analysis(
    ['py_src\\main.py'],
    pathex=[],
    binaries=[],
        datas=[
        ('C:\\Users\\xu\\.conda\\envs\\lazy-eat\\Lib\\site-packages\\vosk\\*', 'vosk'),
        ('C:\\Users\\xu\\.conda\\envs\\lazy-eat\\Lib\\site-packages\\mediapipe\\*', 'mediapipe'),
        ('C:\\Users\\xu\\.conda\\envs\\lazy-eat\\Lib\\site-packages\\mediapipe\\modules\\*', 'mediapipe/modules'),
        ('C:\\Users\\xu\\.conda\\envs\\lazy-eat\\Lib\\site-packages\\mediapipe\\modules\\palm_detection\\*', 'mediapipe/modules/palm_detection'),
        ('C:\\Users\\xu\\.conda\\envs\\lazy-eat\\Lib\\site-packages\\mediapipe\\modules\\hand_landmark\\*', 'mediapipe/modules/hand_landmark'),
        ('C:\\Users\\xu\\.conda\\envs\\lazy-eat\\Lib\\site-packages\\mediapipe\\python\\*', 'mediapipe/python'),
        ('C:\\Users\\xu\\.conda\\envs\\lazy-eat\\Lib\\site-packages\\uvicorn\\*', 'uvicorn'),
        ('C:\\Users\\xu\\.conda\\envs\\lazy-eat\\Lib\\site-packages\\win10toast\\*', 'win10toast'),
    ],

    hiddenimports=[
        'vosk',
        'mediapipe',
        'uvicorn',
        'uvicorn.logging',
        'uvicorn.protocols',
        'win10toast',
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
    name='LazyeatBackend',
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
    name='main',
)
