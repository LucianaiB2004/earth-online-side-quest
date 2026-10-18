# 地球 Online 之人生支线

**主线由世界安排，支线由你触发。**

[在线体验](https://lucianaib2004.github.io/earth-online-side-quest/) · [GitHub 源码](https://github.com/LucianaiB2004/earth-online-side-quest) · [部署状态](https://github.com/LucianaiB2004/earth-online-side-quest/actions/workflows/deploy.yml)

EARTH ONLINE: SIDE QUEST 是一个像素风现实生活支线小游戏：生成一件几分钟就能完成的小事，自主接受、完成或跳过；完成时揭晓本次属性奖励。HUMAN SERVER 是世界观设定，不代表真实多人服务器。

项目采用 Vite + React + TypeScript、原生 CSS 和 `fetch`，构建产物为纯静态文件。没有账号、数据库、自建后端、任务历史、累计属性或等级系统。页面刷新后，API 配置、任务、热点、奖励全部清空。

## 本地运行

使用 Node.js 22 LTS 和 npm。首次安装：

```sh
npm ci
npm run dev
```

打开终端给出的本地地址。生产构建与预览：

```sh
npm run build
npm run preview
```

`build` 先执行 TypeScript 检查，再输出 `dist/`。不要直接双击 `dist/index.html`；请使用 HTTP 静态服务器。

## 游戏体验

右上角的世界时钟自动读取设备系统时间，按北京时间显示年月日、星期及 `HH:mm:ss`，每秒刷新；无需配置或额外 API。

1. 无密钥时可直接生成明确标记的演示支线。
2. 打开 API 设置，选择服务商，填写自己的 API Key 和模型，测试连接后返回游戏。
3. 生成今日支线，阅读目标、行动步骤、完成条件和安全替代方案。
4. 接受后自主完成任务，领取一次即时奖励；奖励只属于当前任务，不累计、不评价现实人格。
5. 可以跳过或重新生成。打开世界事件区域，获取热点或体验演示事件，再选择可转化的事件生成支线。

任务以安全、免费、低压力、15 分钟以内的现实行动为目标。玩家可拒绝任何不适合自己的任务；涉及社交的任务提供非社交替代方案。AI 输出经过结构校验，但仍需要玩家根据现实环境判断是否适合执行。

## AI 和热点配置

| 服务 | 默认模型 | 任务生成地址 | 今日热点 |
| --- | --- | --- | --- |
| 阿里云百炼（北京地域） | `qwen-plus` | `https://dashscope.aliyuncs.com/compatible-mode/v1` | 使用原生 DashScope 联网搜索，要求返回搜索来源 |
| DeepSeek | `deepseek-flash` | `https://api.deepseek.com` | 本项目未接入其联网搜索；使用用户提供新闻转化或演示事件 |

两家服务商的官方地址和模型均已自动配置；通常选择服务商并输入密钥即可。设置面板提供阿里云百炼和 DeepSeek 的官方密钥获取入口，使用新标签页打开，取完密钥后可回到游戏继续填写。模型与 API Base URL 收在「高级设置」，阿里云默认地址适用于北京地域；其他地域或工作空间专属地址可按官方控制台信息调整。

聊天任务通过 OpenAI 兼容的 `/chat/completions` 接口生成；阿里云热点在所配置的同一官方主机使用原生路径 `/api/v1/services/aigc/text-generation/generation` 请求联网搜索，并检查 `output.search_info.search_results` 中的来源。任务生成与热点转换是独立业务流程。新闻原始来源与 AI 游戏化描述分别保留，不用模型自己写出的链接代替搜索证据。

不同地域、账号权限、模型和服务套餐的可用能力可能不同。请勿将其他地域密钥直接套用到北京地域地址。Base URL 仅允许所选服务商的官方 HTTPS 域名，不支持第三方代理；阿里云也允许已实现白名单中的历史 DashScope 官方域名和其他地域业务空间域名。密钥会发送到配置的官方地址，请按自己账号的控制台信息填写。接口兼容不代表模型与账号一定具备原生搜索权限。本项目对 DeepSeek 的搜索接入边界不代表 DeepSeek 服务本身没有搜索能力。

参考官方文档：[百炼首次调用与业务空间地址](https://help.aliyun.com/zh/model-studio/first-api-call-to-qwen)、[百炼 OpenAI 兼容接口](https://help.aliyun.com/zh/model-studio/compatibility-of-openai-with-dashscope)、[百炼联网搜索与来源返回](https://help.aliyun.com/en/model-studio/web-search)、[DeepSeek API](https://api-docs.deepseek.com/)。

### 密钥与隐私边界

- API Key 由用户自行提供，只保存在当前页面的内存中，可主动清除；刷新或关闭页面后不保留。
- 应用不使用 localStorage、sessionStorage、IndexedDB 或 Cookie 保存业务数据，不包含埋点或密钥收集服务。
- 浏览器直接向所选服务商发送密钥、提示词、兴趣和用户提交的新闻文本。请勿粘贴不希望交给该服务商处理的信息。
- 密钥可在浏览器开发者工具和请求中被观察；公开静态网页不能把客户端使用的密钥变成服务器秘密。
- 不要把真实密钥放入源代码、`.env`、仓库、截图、URL 或 GitHub Actions Secrets。部署该前端不需要任何模型密钥。
- 模型请求可能产生服务商费用；实际计费和限额以用户自己的服务账号为准。

### 跨域与错误处理

服务商的 CORS 策略决定浏览器能否直连。即便接口地址正确，账号或浏览器环境也可能阻止调用。应用展示连接、HTTP、超时或输出格式错误，不把失败伪装成成功；演示内容始终单独标记。

若出现网络/CORS 错误，先检查服务商控制台中的权限、余额、地域及官方浏览器调用支持。不能通过关闭浏览器安全策略解决。可继续使用演示模式，或在已有可用 AI 连接时粘贴新闻转化；DeepSeek 的新闻转化不会自动抓取链接正文，也不等于实时新闻核实。本项目不偷偷引入代理、云函数或后端。

真实热点只有获得搜索来源证据后才能标为搜索结果。无法确认的发布时间、事件时间和信息应明确标注；演示世界事件不表示今天真实发生的新闻。严重灾害、伤亡等不适合娱乐化的事件不应强行生成任务。

## 测试

```sh
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

单元测试验证数据校验、任务状态和 API 适配等逻辑；浏览器测试用于验证交互、响应式布局、刷新清空与错误路径。受控接口响应只能证明应用的请求处理和界面行为，不能证明真实服务商调用成功。

2026-10-18 验收：27 项单元测试、17 项浏览器测试、TypeScript 检查及生产构建通过。桌面端采用导航、任务、世界热点三栏布局；已验证 1280×720、1366×768、1440×900、1600×800、1600×900、1920×900、1920×1080 的页面和标准任务/奖励无需上下滚动。宽度至少 1600px 且高度至少 900px 时，使用接近原浏览器 125% 缩放的默认视觉比例，放大字号、按钮、素材及侧栏；不改变浏览器缩放值。较矮窗口使用紧凑布局，超长 AI 内容或展开的来源资料在面板内阅读，手机端保留自然纵向布局。浏览器测试在 Windows 使用已安装的 Microsoft Edge；其他系统使用 Playwright Chromium。请先构建，再运行浏览器测试，其中包含 `/earth-online/` 子路径下的真实静态产物加载检查。截图见 [验收记录](docs/VERIFICATION.md)。

未提供真实 API 凭证，因此真实付费模型响应、真实联网搜索和生产环境 CORS 尚未验证。公开仓库已关联 GitHub Pages，`main` 推送后由 Actions 自动构建部署；最新上线状态见上方部署状态链接。

## GitHub Pages 自动部署

1. 将项目上传至你自己的 GitHub 仓库，包含 `package-lock.json`。
2. 在仓库 **Settings → Pages → Build and deployment → Source** 中选择 **GitHub Actions**。
3. 默认主分支为 `main`。推送到 `main` 或手动运行 **Deploy to GitHub Pages** 工作流。
4. 工作流执行 `npm ci`、`npm test`、`npm run build`，上传 `dist/` 并部署到 `github-pages` 环境；成功后在工作流部署步骤查看访问链接。

若仓库默认分支不是 `main`，修改 `.github/workflows/deploy.yml` 的分支过滤。工作流仅构建任务具有 `contents: read`，部署任务具有 `pages: write` 与 `id-token: write`；不需要个人访问令牌。浏览器测试在本地运行，不属于当前部署工作流。

Vite 使用 `base: './'`，资源使用相对路径，适配 `https://<用户名>.github.io/<仓库名>/` 项目子路径。应用不使用需要服务器回退规则的 History 路由。API 请求使用服务商绝对地址，不拼接 GitHub Pages 路径。不要上传整个开发目录作为网站，部署内容仅为 `dist/`。

本项目仓库为 `LucianaiB2004/earth-online-side-quest`，Pages 已设为 GitHub Actions 发布；后续推送 `main` 即可更新同一个在线地址。

## 素材与开发过程

像素素材来自用户提供的 `UI素材包/`，用于品牌、场景、装饰及奖励视觉。原始素材归其权利人所有；本项目不替素材授予额外许可。公开发布前，应由用户确认相应素材的使用与分发授权。

需求与设计文档位于 `.kiro/specs/earth-online-side-quest/`，按 Requirements → Design → Tasks 组织，可供 Kiro 读取。本次实际实现工具为 Codex；提供 Kiro 兼容 Spec 不等于实际运行了 Kiro，比赛材料不得作此宣称。[Demo 说明](docs/DEMO.md) 提供简短介绍与演示顺序。
