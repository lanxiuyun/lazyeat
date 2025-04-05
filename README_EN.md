<h1 align="center">
  <a href="https://github.com/maplelost/lazy-eat/releases">
    <img src="https://github.com/maplelost/lazy-eat/blob/master/public/lazyeat.png?raw=true" width="150" height="150" alt="banner" /><br>
  </a>
<div align="center">

![GitHub stars](https://img.shields.io/github/stars/maplelost/lazyeat)
![GitHub forks](https://img.shields.io/github/forks/maplelost/lazyeat?style=flat)

[中文 README](README.md)

</div>
</h1>

# 🍕 Lazyeat

Lazyeat is a touch-free controller for eating! Don't want to get your hands greasy while watching videos or browsing the
web while eating?

Just make hand gestures in front of your camera to pause videos, toggle fullscreen, or switch videos!

If you find this useful, please give it a star!

Feel free to join
our [![Discord](https://img.shields.io/discord/1357641609176551566?label=Join%20Discord&logo=discord)](https://discord.gg/nTH6qRng)
community to share your ideas and suggestions!

# 🌠 Screenshots

Video Demo: https://www.bilibili.com/video/BV11SXTYTEJi/?spm_id_from=333.1387.homepage.video_card.click

![img.png](.readme/img.png)

# Quick Start

```
# Version Information
\Desktop\lazyeat> python --version
Python 3.11.11

Desktop\lazyeat> rustc --version
rustc 1.85.1 (4eb161250 2025-03-15)

\Desktop\lazyeat> node --version
v22.14.0
```

```bash
# 1. Install npm and python environment
npm run install-reqs

# 2. Build tauri icons
npm run build:icons

# 3. pyinstaller packaging
npm run py-build

# 4. tauri development mode
npm run tauri dev

# 5. tauri production build
# npm run tauri build
```

If you need to debug the backend, first use pyinstaller to package, then run `python src-py/main.py`.
`npm run tauri dev` requires first generating the sidecar written in [tauri.conf.json](src-tauri/tauri.conf.json).
See: https://v2.tauri.app/zh-cn/develop/sidecar/

# 📢 Speech Recognition Model Download

[Small Model](https://alphacephei.com/vosk/models/vosk-model-small-cn-0.22.zip)

[Large Model](https://alphacephei.com/vosk/models/vosk-model-cn-0.22.zip)

After downloading, extract to the `model` folder at the same level as the `exe` to use the speech recognition feature

![img.png](.readme/img_model_example.png)

# 📝 TODO

- [ ] (March 12, 2025) Integrate browser-use for voice-controlled browser navigation
- [ ] (March 24, 2025) Develop Android version

# Development Issues

## Tauri Build Issues

If you encounter build failures with Tauri, check out this
issue: [tauri build failure](https://github.com/tauri-apps/tauri/issues/7338)

## Cargo Network Issues

If you're experiencing network issues with Cargo (common in some regions), you can try changing the
source: [cargo blocked, change source](https://www.chenreal.com/post/599)

```bash
# Clear cargo cache (may help with some issues)
rm -rf ~/.cargo/.package-cache
```

# Star History

[![Star History Chart](https://api.star-history.com/svg?repos=maplelost/lazyeat&type=Date)](https://www.star-history.com/#maplelost/lazyeat&Date)
