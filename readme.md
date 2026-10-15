<br />
<img src="assets/images/logo-transparent.png" width="80"/>

<a id="zh"></a>

### Bruno - 开源的 API 调试与测试 IDE

> **本仓库** 是 [usebruno/bruno](https://github.com/usebruno/bruno) 的增强分支：在上游基础上补齐中文本地化，并加入系统托盘常驻、浏览器 Web 客户端、内置工具箱等实用功能。详见下方[本分支新增功能](#本分支新增功能-)。

[![Fork](https://img.shields.io/badge/fork-qiuhai182%2Fbruno-blue)](https://github.com/qiuhai182/bruno)
[![GitHub version](https://badge.fury.io/gh/usebruno%2Fbruno.svg)](https://badge.fury.io/gh/usebruno%2Fbruno)
[![CI](https://github.com/usebruno/bruno/actions/workflows/tests.yml/badge.svg?branch=main)](https://github.com/usebruno/bruno/actions/workflows/tests.yml)
[![Commit Activity](https://img.shields.io/github/commit-activity/m/usebruno/bruno)](https://github.com/usebruno/bruno/pulse)
[![X](https://img.shields.io/twitter/follow/use_bruno?style=social&logo=x)](https://twitter.com/use_bruno)
[![Website](https://img.shields.io/badge/Website-Visit-blue)](https://www.usebruno.com)
[![Download](https://img.shields.io/badge/Download-Latest-brightgreen)](https://www.usebruno.com/downloads)

**语言 / Language**
| [English](#en)
| [正體中文](docs/readme/readme_zhtw.md)
| [日本語](docs/readme/readme_ja.md)
| [한국어](docs/readme/readme_kr.md)
| [Français](docs/readme/readme_fr.md)
| [Deutsch](docs/readme/readme_de.md)
| [Español](docs/readme/readme_es.md)
| [Português (BR)](docs/readme/readme_pt_br.md)
| [Italiano](docs/readme/readme_it.md)
| [Русский](docs/readme/readme_ru.md)
| [Українська](docs/readme/readme_ua.md)
| [Türkçe](docs/readme/readme_tr.md)
| [Polski](docs/readme/readme_pl.md)
| [Română](docs/readme/readme_ro.md)
| [Nederlands](docs/readme/readme_nl.md)
| [বাংলা](docs/readme/readme_bn.md)
| [العربية](docs/readme/readme_ar.md)
| [ქართული](docs/readme/readme_ka.md)
| [فارسی](docs/readme/readme_fa.md)

Bruno 是一款全新且富有创新精神的 API 客户端，旨在革新 Postman 及同类工具所代表的现状。

Bruno 会把你的集合直接存储在文件系统的一个文件夹中。我们使用纯文本标记语言 Bru 来保存 API 请求信息。

你可以使用 Git 或任何你熟悉的版本控制系统，围绕你的 API 集合进行协作。

Bruno 是纯离线的。我们没有任何为 Bruno 添加云同步的计划。我们重视你的数据隐私，并认为它应当保留在你的设备上。阅读我们的长期愿景请见[这里](https://github.com/usebruno/bruno/discussions/269)。

[下载 Bruno](https://www.usebruno.com/downloads)

📢 观看我们在 India FOSS 3.0 大会上的演讲[点此](https://www.youtube.com/watch?v=7bSMFpbcPiY)

![bruno](assets/images/landing-2-dark.png#gh-light-mode-only)
![bruno](assets/images/landing-2-light.png#gh-dark-mode-only) <br /><br />

## 本分支新增功能 ✨

以下功能为本分支相对上游 [usebruno/bruno](https://github.com/usebruno/bruno) 的增强，可与上游功能共存，随时可同步上游更新。

### 简体中文本地化 🈶

- **默认语言即简体中文** —— 启动即为中文界面（`DEFAULT_LANGUAGE = 'zh-CN'`），未翻译的条目自动回退英文
- **中英文全覆盖** —— `en.json` 与 `zh-CN.json` 两侧词条数完全一致（3155 / 3155，零缺失），界面不留英文残缺
- 系统托盘菜单、错误提示、导入导出对话框等全部中文化

### 系统托盘常驻 📌

- 关闭主窗口后 Bruno 继续驻留系统托盘（偏好设置中的「关闭窗口后保持在托盘运行」，默认开启）
- 托盘菜单提供：**显示主窗口**、**在浏览器中打开**、**设置**、**退出**，标签随界面语言切换
- 退出流程更稳健：未捕获异常立即退出并写入 `%APPDATA%\Bruno\logs\main-crash.log`，清理操作带 4 秒超时，Windows 下用 `taskkill /T /F` 杀掉完整进程树，避免残留

### 浏览器 Web 客户端 🌐

- 在偏好设置中开启「启用浏览器 Web 客户端（127.0.0.1）」后，可在浏览器里访问同一套界面
- 端口默认 `43110`（可配置，冲突时自动顺延），主进程通过 IPC 桥复用与桌面端完全相同的处理器
- 适合远程调试、容器/服务器环境或不想安装桌面端的场景

### 内置工具箱 🧰

侧边栏新增 **Tools** 面板，内置常用开发工具（支持一键复制）：

| 工具 | 说明 |
| --- | --- |
| UUID | 批量生成 UUID v4 |
| 时间戳 | Unix 时间戳 ⇄ ISO 8601 互转 |
| Base64 | 编码 / 解码 |
| URL | 编码 / 解码 |
| JWT | 解析 JWT 结构 |
| 正则 | 正则表达式实时测试 |
| 哈希 | MD5 / SHA 系列摘要计算 |

### Mock 服务器增强 🔁

单条 Mock 响应可配置更细的行为（**Mock Response Behavior**）：

- **响应延迟**、**返回概率**（0-100%）
- **轮询计数** —— 每 N 次命中返回该响应，可偏移计数相位
- 模板渲染与**提取规则**（从 query / header / param / body / form 中提取）

### 集合分享导出增强 📤

右键集合的「**分享导出**」提供多种主流格式：

- **Bruno (ZIP)** —— 保留文件夹结构的压缩包，适合版本管理与团队协作
- **Bruno (YAML)** —— 单文件 OpenCollection 格式
- **Postman (JSON)** —— 可直接导入 Postman，可选保留脚本
- **OpenAPI (YAML)** —— 导出 OpenAPI 3.0 规范，自动解析 `{{baseUrl}}` 与环境变量

### Windows 打包增强 📦

- 同时产出 **NSIS 安装版**（`_win_setup.exe`）与**免安装便携版**（`_win_portable.exe`），文件名互不覆盖
- `build.bat` 一键构建 VS Code 扩展 + Electron 应用，输出到独立 `output` 目录
- 构建输出目录支持 `BRUNO_BUILDER_OUT` 覆盖、禁用发布自动检测（`publish: null`），规避 IDE 文件占用导致的打包失败；Electron 下载使用 npmmirror 镜像加速
- 仓库自带 `convert_to_utf8.py`，提交前统一把文本文件规整为 UTF-8（无 BOM），避免中文乱码

### 内置 VS Code 扩展 🧩

`packages/bruno-vscode` 提供与桌面端同源的 VS Code 扩展，包含完整 e2e 测试套件（OAuth2、gRPC、脚本、Prompt 变量等）。

## 商业版本 ✨

我们的大部分功能是免费且开源的。
我们努力在[开源原则与可持续发展](https://github.com/usebruno/bruno/discussions/269)之间取得和谐平衡。

你可以浏览我们的[付费版本](https://www.usebruno.com/pricing)，看看其中是否有你或你的团队可能觉得有用的额外功能！<br/>

## 目录

- [本分支新增功能 ✨](#本分支新增功能-)
- [安装](#安装)
- [Bruno CLI](#bruno-cli)
- [使用 Docker 运行](#使用-docker-运行)
- [功能特性](#功能特性)
  - [跨平台运行 🖥️](#跨平台运行-️)
  - [通过 Git 协作 👩‍💻🧑‍💻](#通过-git-协作--)
- [重要链接 📌](#重要链接-)
- [案例展示 🎥](#案例展示-)
- [分享你的使用反馈 📣](#分享你的使用反馈-)
- [发布到新的包管理器](#发布到新的包管理器)
- [保持联系 🌐](#保持联系-)
- [商标](#商标)
- [贡献 👩‍💻🧑‍💻](#贡献--)
- [作者](#作者)
- [许可证 📄](#许可证-)

## 安装

Bruno 可在[我们的官网](https://www.usebruno.com/downloads)上以二进制安装包的形式下载，支持 Mac、Windows 和 Linux。

你也可以通过 Homebrew、Chocolatey、Scoop、Snap、Flatpak、Apt 等包管理器安装 Bruno。

```sh
# Mac 上通过 Homebrew 安装
brew install bruno

# Windows 上通过 Chocolatey 安装
choco install bruno

# Windows 上通过 Scoop 安装
scoop bucket add extras
scoop install bruno

# Windows 上通过 winget 安装
winget install Bruno.Bruno

# Linux 上通过 Snap 安装
snap install bruno

# Linux 上通过 Flatpak 安装
flatpak install com.usebruno.Bruno

# Arch Linux 上通过 AUR 安装
yay -S bruno

# Linux 上通过 Apt 安装
sudo mkdir -p /etc/apt/keyrings
sudo apt update && sudo apt install gpg curl
curl -fsSL "https://keyserver.ubuntu.com/pks/lookup?op=get&search=0x9FA6017ECABE0266" \
  | gpg --dearmor \
  | sudo tee /etc/apt/keyrings/bruno.gpg > /dev/null
sudo chmod 644 /etc/apt/keyrings/bruno.gpg
echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/bruno.gpg] http://debian.usebruno.com/ bruno stable" \
  | sudo tee /etc/apt/sources.list.d/bruno.list
sudo apt update && sudo apt install bruno
```

## Bruno CLI

**Bruno CLI** 让你可以从命令行运行你的 API 集合，非常适合自动化测试和 CI/CD 流水线。使用你喜欢的包管理器从 npm 安装：

```sh
npm install -g @usebruno/cli
```

进入包含你的集合的目录并运行：

```sh
# 运行集合中的每一个请求
bru run

# 运行单个请求
bru run request.bru

# 在指定环境下运行某个文件夹
bru run folder --env Local
```

完整的命令参考请见 [Bruno CLI 文档](https://docs.usebruno.com/bru-cli/overview)。

## 使用 Docker 运行

**Bruno CLI** 的官方 Docker 镜像让你无需在宿主机上安装 Node.js 或 npm，即可在 CI/CD 流水线和本地运行 API 集合。每次 CLI 发布时都会将镜像推送到 [Docker Hub](https://hub.docker.com/r/usebruno/cli) 和 [GitHub Container Registry](https://ghcr.io/usebruno/cli)，并提供适用于 `linux/amd64` 和 `linux/arm64` 的 `alpine` 与 `debian` 两种变体。

```sh
# 从 Docker Hub 拉取
docker pull usebruno/cli:latest

# 或从 GitHub Container Registry 拉取
docker pull ghcr.io/usebruno/cli:latest

# 挂载当前目录来运行一个集合
docker run -v $(pwd):/bruno usebruno/cli run
```

关于镜像变体、标签矩阵、环境文件以及 CI 示例（GitHub Actions、GitLab CI、Jenkins），请参阅完整的 [Bruno CLI Docker 文档](https://docs.usebruno.com/bru-cli/docker)。

## 功能特性

### 跨平台运行 🖥️

![bruno](assets/images/run-anywhere.png) <br /><br />

### 通过 Git 协作 👩‍💻🧑‍💻

或任何你选择的版本控制系统

![bruno](assets/images/version-control.png) <br /><br />

## 重要链接 📌

- [我们的长期愿景](https://github.com/usebruno/bruno/discussions/269)
- [路线图](https://www.usebruno.com/roadmap)
- [文档](https://docs.usebruno.com)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/bruno)
- [官网](https://www.usebruno.com)
- [定价](https://www.usebruno.com/pricing)
- [下载](https://www.usebruno.com/downloads)

## 案例展示 🎥

- [使用反馈](https://github.com/usebruno/bruno/discussions/343)
- [知识中心](https://github.com/usebruno/bruno/discussions/386)
- [脚本精选](https://github.com/usebruno/bruno/discussions/385)

## 分享你的使用反馈 📣

如果 Bruno 在工作和团队中帮到了你，请别忘了在 [GitHub 讨论区分享你的使用反馈](https://github.com/usebruno/bruno/discussions/343)。

## 发布到新的包管理器

更多信息请见[这里](publishing.md)。

## 保持联系 🌐

[𝕏 (Twitter)](https://twitter.com/use_bruno) <br />
[官网](https://www.usebruno.com) <br />
[Discord](https://discord.com/invite/KgcZUncpjq) <br />
[LinkedIn](https://www.linkedin.com/company/usebruno)

## 商标

**名称**

`Bruno` 是由 [Anoop M D](https://www.helloanoop.com/) 持有的商标。

**Logo**

Logo 来自 [OpenMoji](https://openmoji.org/library/emoji-1F436/)。许可证：CC [BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)

## 贡献 👩‍💻🧑‍💻

很高兴你愿意改进 Bruno，请查看[贡献指南](contributing.md)。

即使你无法通过代码做出贡献，也请随时提交 Bug 和功能需求，以便解决你的使用场景。

## 作者

<div align="center">
    <a href="https://github.com/usebruno/bruno/graphs/contributors">
        <img src="https://contrib.rocks/image?repo=usebruno/bruno" />
    </a>
</div>

## 许可证 📄

[MIT](license.md)

<br />

---

<a id="en"></a>

<details>
<summary><b>English</b></summary>

### Bruno - Opensource IDE for exploring and testing APIs.

> This repository is an **enhanced fork** of [usebruno/bruno](https://github.com/usebruno/bruno): complete Simplified Chinese localization plus extras like system-tray residency, a browser-based web client, and a built-in tools panel. See [Fork Enhancements](#fork-enhancements-) below.

[![Fork](https://img.shields.io/badge/fork-qiuhai182%2Fbruno-blue)](https://github.com/qiuhai182/bruno)
[![GitHub version](https://badge.fury.io/gh/usebruno%2Fbruno.svg)](https://badge.fury.io/gh/usebruno%2Fbruno)
[![CI](https://github.com/usebruno/bruno/actions/workflows/tests.yml/badge.svg?branch=main)](https://github.com/usebruno/bruno/actions/workflows/tests.yml)
[![Commit Activity](https://img.shields.io/github/commit-activity/m/usebruno/bruno)](https://github.com/usebruno/bruno/pulse)
[![X](https://img.shields.io/twitter/follow/use_bruno?style=social&logo=x)](https://twitter.com/use_bruno)
[![Website](https://img.shields.io/badge/Website-Visit-blue)](https://www.usebruno.com)
[![Download](https://img.shields.io/badge/Download-Latest-brightgreen)](https://www.usebruno.com/downloads)

**English**
| [简体中文](#zh)
| [Українська](docs/readme/readme_ua.md)
| [Русский](docs/readme/readme_ru.md)
| [Türkçe](docs/readme/readme_tr.md)
| [Deutsch](docs/readme/readme_de.md)
| [Français](docs/readme/readme_fr.md)
| [Português (BR)](docs/readme/readme_pt_br.md)
| [한국어](docs/readme/readme_kr.md)
| [বাংলা](docs/readme/readme_bn.md)
| [Español](docs/readme/readme_es.md)
| [Italiano](docs/readme/readme_it.md)
| [Română](docs/readme/readme_ro.md)
| [Polski](docs/readme/readme_pl.md)
| [正體中文](docs/readme/readme_zhtw.md)
| [العربية](docs/readme/readme_ar.md)
| [日本語](docs/readme/readme_ja.md)
| [ქართული](docs/readme/readme_ka.md)
| [Nederlands](docs/readme/readme_nl.md)
| [فارسی](docs/readme/readme_fa.md)

Bruno is a new and innovative API client, aimed at revolutionizing the status quo represented by Postman and similar tools out there.

Bruno stores your collections directly in a folder on your filesystem. We use a plain text markup language, Bru, to save information about API requests.

You can use Git or any version control of your choice to collaborate over your API collections.

Bruno is offline-only. There are no plans to add cloud-sync to Bruno, ever. We value your data privacy and believe it should stay on your device. Read our long-term vision [here](https://github.com/usebruno/bruno/discussions/269)

[Download Bruno](https://www.usebruno.com/downloads)

📢 Watch our recent talk at India FOSS 3.0 Conference [here](https://www.youtube.com/watch?v=7bSMFpbcPiY)

![bruno](assets/images/landing-2-dark.png#gh-light-mode-only)
![bruno](assets/images/landing-2-light.png#gh-dark-mode-only) <br /><br />

## Fork Enhancements ✨

These features are additions to this fork on top of upstream [usebruno/bruno](https://github.com/usebruno/bruno); they coexist with upstream features and stay easy to rebase.

- **Simplified Chinese localization** — `zh-CN` is the default UI language (`DEFAULT_LANGUAGE = 'zh-CN'`) with English fallback; `en.json` and `zh-CN.json` stay fully in sync (3155 keys each, zero missing), including tray menus, error toasts and import/export dialogs.
- **System tray residency** — closing the main window keeps Bruno in the tray ("Keep running in tray when the window is closed", on by default). The tray menu offers Show Window / Open in Browser / Settings / Quit, following the UI language. Exit is hardened: uncaught exceptions exit immediately with a crash log at `%APPDATA%\Bruno\logs\main-crash.log`, cleanup carries a 4-second timeout, and Windows tears down the full process tree with `taskkill /T /F`.
- **Browser web client** — toggle "Enable browser web client (127.0.0.1)" in preferences to use the same UI in a browser. Port defaults to `43110` (configurable, auto-increments on conflict); the main process reuses the exact desktop IPC handlers through a bridge. Handy for remote debugging, containers/servers, or when you'd rather not install the desktop app.
- **Built-in tools panel** — a new **Tools** sidebar section: UUID (batch v4), timestamp ⇄ ISO 8601, Base64, URL, JWT, regex tester, and hash (MD5/SHA), each with one-click copy.
- **Mock server enhancements** — per-response mock behavior: delay, probability (0–100%), round-robin counter (return every Nth hit with phase offset), template rendering, and extract rules (query/header/param/body/form).
- **Collection share/export enhancements** — right-click → **Share Collection** exports Bruno (ZIP), Bruno (YAML), Postman (JSON, optional scripts), and OpenAPI (YAML) with `{{baseUrl}}` and environment variables resolved.
- **Windows packaging** — ships both an NSIS installer (`_win_setup.exe`) and a portable build (`_win_portable.exe`) with non-colliding names; `build.bat` one-shot builds the VS Code extension + Electron app into a separate `output` dir; `BRUNO_BUILDER_OUT` overrides the build output and `publish: null` disables publish auto-detection to dodge IDE file locks, with Electron downloads accelerated via npmmirror; `convert_to_utf8.py` normalizes text files to UTF-8 (no BOM) before commits to prevent mojibake.
- **Bundled VS Code extension** — `packages/bruno-vscode` ships an in-repo extension with a full e2e suite (OAuth2, gRPC, scripting, prompt variables, and more).

## Commercial Versions ✨

Majority of our features are free and open source.
We strive to strike a harmonious balance between [open-source principles and sustainability](https://github.com/usebruno/bruno/discussions/269)

You can explore our [paid versions](https://www.usebruno.com/pricing) to see if there are additional features that you or your team may find useful! <br/>

## Table of Contents

- [Fork Enhancements ✨](#fork-enhancements-)
- [Installation](#installation)
- [Bruno CLI](#bruno-cli-1)
- [Run with Docker](#run-with-docker)
- [Features](#features)
  - [Run across multiple platforms 🖥️](#run-across-multiple-platforms-%EF%B8%8F)
  - [Collaborate via Git 👩‍💻🧑‍💻](#collaborate-via-git-%E2%80%8D%E2%80%8D)
- [Important Links 📌](#important-links-)
- [Showcase 🎥](#showcase-)
- [Share Testimonials 📣](#share-testimonials-)
- [Publishing to New Package Managers](#publishing-to-new-package-managers)
- [Stay in touch 🌐](#stay-in-touch-)
- [Trademark](#trademark)
- [Contribute 👩‍💻🧑‍💻](#contribute-%E2%80%8D%E2%80%8D)
- [Authors](#authors)
- [License 📄](#license-)

## Installation

Bruno is available as binary download [on our website](https://www.usebruno.com/downloads) for Mac, Windows and Linux.

You can also install Bruno via package managers like Homebrew, Chocolatey, Scoop, Snap, Flatpak and Apt.

```sh
# On Mac via Homebrew
brew install bruno

# On Windows via Chocolatey
choco install bruno

# On Windows via Scoop
scoop bucket add extras
scoop install bruno

# On Windows via winget
winget install Bruno.Bruno

# On Linux via Snap
snap install bruno

# On Linux via Flatpak
flatpak install com.usebruno.Bruno

# On Arch Linux via AUR
yay -S bruno

# On Linux via Apt
sudo mkdir -p /etc/apt/keyrings
sudo apt update && sudo apt install gpg curl
curl -fsSL "https://keyserver.ubuntu.com/pks/lookup?op=get&search=0x9FA6017ECABE0266" \
  | gpg --dearmor \
  | sudo tee /etc/apt/keyrings/bruno.gpg > /dev/null
sudo chmod 644 /etc/apt/keyrings/bruno.gpg
echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/bruno.gpg] http://debian.usebruno.com/ bruno stable" \
  | sudo tee /etc/apt/sources.list.d/bruno.list
sudo apt update && sudo apt install bruno
```

## Bruno CLI

The **Bruno CLI** lets you run your API collections from the command line, which is ideal for automated testing and CI/CD pipelines. Install it from npm using the package manager of your choice:

```sh
npm install -g @usebruno/cli
```

Navigate to the directory containing your collection and run it:

```sh
# Run every request in the collection
bru run

# Run a single request
bru run request.bru

# Run a folder against a specific environment
bru run folder --env Local
```

For the full command reference, see the [Bruno CLI documentation](https://docs.usebruno.com/bru-cli/overview).

## Run with Docker

Official Docker images for the **Bruno CLI** let you run API collections in CI/CD pipelines and locally without installing Node.js or npm on the host. Images are published to both [Docker Hub](https://hub.docker.com/r/usebruno/cli) and the [GitHub Container Registry](https://ghcr.io/usebruno/cli) on every CLI release, with `alpine` and `debian` variants for `linux/amd64` and `linux/arm64`.

```sh
# Pull from Docker Hub
docker pull usebruno/cli:latest

# Or pull from the GitHub Container Registry
docker pull ghcr.io/usebruno/cli:latest

# Run a collection by mounting the current directory
docker run -v $(pwd):/bruno usebruno/cli run
```

For variants, tag matrix, environment files, and CI examples (GitHub Actions, GitLab CI, Jenkins), see the full [Bruno CLI Docker documentation](https://docs.usebruno.com/bru-cli/docker).

## Features

### Run across multiple platforms 🖥️

![bruno](assets/images/run-anywhere.png) <br /><br />

### Collaborate via Git 👩‍💻🧑‍💻

Or any version control system of your choice

![bruno](assets/images/version-control.png) <br /><br />

## Important Links 📌

- [Our Long Term Vision](https://github.com/usebruno/bruno/discussions/269)
- [Roadmap](https://www.usebruno.com/roadmap)
- [Documentation](https://docs.usebruno.com)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/bruno)
- [Website](https://www.usebruno.com)
- [Pricing](https://www.usebruno.com/pricing)
- [Download](https://www.usebruno.com/downloads)

## Showcase 🎥

- [Testimonials](https://github.com/usebruno/bruno/discussions/343)
- [Knowledge Hub](https://github.com/usebruno/bruno/discussions/386)
- [Scriptmania](https://github.com/usebruno/bruno/discussions/385)

## Share Testimonials 📣

If Bruno has helped you at work and your teams, please don't forget to share your [testimonials on our GitHub discussion](https://github.com/usebruno/bruno/discussions/343)

## Publishing to New Package Managers

Please see [here](publishing.md) for more information.

## Stay in touch 🌐

[𝕏 (Twitter)](https://twitter.com/use_bruno) <br />
[Website](https://www.usebruno.com) <br />
[Discord](https://discord.com/invite/KgcZUncpjq) <br />
[LinkedIn](https://www.linkedin.com/company/usebruno)

## Trademark

**Name**

`Bruno` is a trademark held by [Anoop M D](https://www.helloanoop.com/)

**Logo**

The logo is sourced from [OpenMoji](https://openmoji.org/library/emoji-1F436/). License: CC [BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)

## Contribute 👩‍💻🧑‍💻

I am happy that you are looking to improve bruno. Please check out the [contributing guide](contributing.md)

Even if you are not able to make contributions via code, please don't hesitate to file bugs and feature requests that needs to be implemented to solve your use case.

## Authors

<div align="center">
    <a href="https://github.com/usebruno/bruno/graphs/contributors">
        <img src="https://contrib.rocks/image?repo=usebruno/bruno" />
    </a>
</div>

## License 📄

[MIT](license.md)

</details>
