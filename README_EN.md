<h1 align="center">
  <a href="https://github.com/maplelost/lazy-eat/releases">
    <img src="https://github.com/maplelost/lazy-eat/blob/master/public/lazyeat.png?raw=true" width="150" height="150" alt="banner" /><br>
  </a>
<div align="center">

![GitHub stars](https://img.shields.io/github/stars/maplelost/lazyeat)
![GitHub forks](https://img.shields.io/github/forks/maplelost/lazyeat?style=flat)
![Github Downloads](https://img.shields.io/github/downloads/lanxiuyun/lazyeat/total)

[中文 README](README.md)

</div>
</h1>

# 🍕 Lazyeat

Lazyeat is a touch-free controller for eating! Don't want to get your hands greasy while watching videos or browsing the
web while eating?

Just make hand gestures in front of your camera to pause videos, toggle fullscreen, or switch videos!

If you find this useful, please give it a star! ⭐

We really need everyone to promote this software to gain more attention! 🚀

Feel free to join
our [![Discord](https://img.shields.io/discord/1357641609176551566?label=Join%20Discord&logo=discord)](https://discord.gg/nTH6qRng)
community to share your ideas and suggestions!

|   Platform   |   Status    |                              Download                              |
|:------------:|:----------:|:------------------------------------------------------------------:|
| 🪟 Windows | ✅ Supported | [Latest Release](https://github.com/maplelost/lazyeat/releases/latest) |
|   🍎 Mac   | ✅ Supported | [Latest Release](https://github.com/maplelost/lazyeat/releases/latest) |
|  🐧 Linux  | ⏳ In Development |                               /                                |
| 🤖 Android | ⏳ In Development |                               /                                |
|   📱 iOS   | ⏳ In Development |                               /                                |

## Features

- Single finger slide to control cursor
- Two fingers/Rock gesture for mouse click
- OK gesture to control page scrolling
- Four fingers together to send keys
- Voice input support

![demo.gif](.readme/demo.gif)

# 🌠 Screenshots

Video Demo: https://www.bilibili.com/video/BV11SXTYTEJi/?spm_id_from=333.1387.homepage.video_card.click

<div align="center">
<img src=.readme/img.png width="800" height="600" />
</div>

# Quick Start

```
# Version Information (Development Environment)
\Desktop\lazyeat> python --version
Python 3.11.11
(Note: As of April 19, 2025, pyinstaller packaging will fail with Python 3.12.7 and above)

Desktop\lazyeat> rustc --version
rustc 1.85.1 (4eb161250 2025-03-15)

\Desktop\lazyeat> node --version
v22.14.0
```

### Install Rust and Node

Install [Rust](https://www.rust-lang.org/tools/install) and [Node](https://nodejs.org/)

### Open Project in Root Directory

Open the project in the root directory (i.e., lazyeat root directory)
(e.g., C:\Users\YourUsername\Desktop\lazyeat, or open the folder and type cmd in the address bar)

### Install pnpm and Python Environment

```bash
npm install -g pnpm
pnpm install-reqs
```

If you encounter issues, try running the command in administrator mode.

### Build Tauri Icons

```bash
pnpm build:icons
```

### Pyinstaller Packaging

```bash
pnpm build:py
# For Mac version
# pnpm build:py-mac
# For Linux version
# pnpm build:py-linux
```

### Download Voice Recognition Model

Download and extract to the model folder:
```bash
https://alphacephei.com/vosk/models/vosk-model-small-cn-0.22.zip
```

![img.png](.readme/img_model_example_inside.png)

### Run Tauri Dev Environment

```bash
pnpm tauri dev
```

### Additional Notes

#### Production Build (Optional)

```bash
pnpm tauri build
```

After building, find the executable in the **lazyeat\src-tauri\target\release** directory.

#### Python Backend Debug

If you need to debug the Python backend, first use pyinstaller to package, then run `python src-py/main.py`.

`pnpm tauri dev` requires generating the sidecar written in [tauri.conf.json](src-tauri/tauri.conf.json).
See: https://v2.tauri.app/develop/sidecar/

# 📢 Voice Recognition Model Replacement

[Small Model](https://alphacephei.com/vosk/models/vosk-model-small-cn-0.22.zip) [Large Model](https://alphacephei.com/vosk/models/vosk-model-cn-0.22.zip)

The steps above download the small model. If you need to use the large model, download and extract it to `model/` to replace the existing one.

![img.png](.readme/img_model_example.png)

# 📝 TODO

- [ ] (March 12, 2025) Integrate browser-use for voice-controlled browser navigation
- [ ] (March 24, 2025) Develop Android version

# Development Issues

## Tauri Build Issues

If you encounter build failures with Tauri, check out this
issue: [tauri build failure](https://github.com/tauri-apps/tauri/issues/7338)

If the build fails, check if the size of src-tauri/bin exceeds 200MB. If it does, verify that your Python environment is correctly set up.

## Cargo Network Issues

If you're experiencing network issues with Cargo (common in some regions), you can try changing the
source: [cargo blocked, change source](https://www.chenreal.com/post/599)

[Non-code Exception Issues Summary](https://github.com/maplelost/lazyeat/issues/30)

```bash
# May or may not help
rm -rf ~/.cargo/.package-cache
```

# Star History

[![Star History Chart](https://api.star-history.com/svg?repos=maplelost/lazyeat&type=Date)](https://www.star-history.com/#maplelost/lazyeat&Date)
