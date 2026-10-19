# 验收记录

验证日期：2026-10-18。环境：Windows、Node.js 24.16.0、npm 11.13.0、Microsoft Edge。生产依赖仅 React / React DOM，原生 CSS 与 fetch。

## 已执行

- `npm test`：27 项单元测试通过。覆盖 JSON、字段和奖励范围、服务商地址白名单、HTTP 错误脱敏、超时、取消、有限重试、来源匹配、用户新闻原文保护、绑定事件的演示任务。
- `npm run test:e2e`：17 项浏览器测试通过。接受→完成→一次奖励、刷新重置、跳过、API 设置与密钥清除、受控 AI 响应、401 演示回退、390px 手机布局与弹窗、演示事件转支线；覆盖七种桌面尺寸、热点分类与长标题操作入口、服务商自动配置及密钥入口检查。
- 浏览器测试还使用真实 `dist/` 静态文件，在 `/earth-online/` 子路径检查脚本、样式、所有图片加载、页面无 JS 异常、任务按钮可用。
- `npm run build`：TypeScript strict 检查与 Vite 静态生产构建通过。
- `npm audit`：0 漏洞。测试工具的旧版漏洞已升级修复。
- 独立代码审查后修复了演示事件与任务不相关、粘贴新闻链接丢失、输入长度不一致的问题，并添加回归验证。

28 张已切分 WebP 素材，含真实木牌素材、路灯、小猫、店铺和主题灵感卡。构建 JS gzip 约 84 KiB，CSS gzip 约 10 KiB。原始图集未修改。素材切分脚本为 `scripts/prepare_assets.py`，只在需要重制素材时使用 Python + Pillow，运行应用不需要 Python。

## 界面证据

右上角世界时钟自动读取设备系统时间，统一按 Asia/Shanghai 显示年月日、星期、时分秒，每秒更新；切回页面时立即读取最新时间。时钟状态独立于任务组件，不会每秒重渲染整个游戏。浏览器回归使用纽约时区验证北京时间显示，并将 23:59:58 推进至次日 00:00:00，验证秒数、日期及 `datetime`。未接入第三方网络授时服务。

桌面首页：

![桌面首页](screenshots/desktop-1440.png)

完成奖励：

![完成奖励](screenshots/rewards-desktop-new.png)

[手机首页](screenshots/mobile.png) · [手机世界事件](screenshots/world-mobile.png)

[新版 API 设置](screenshots/api-settings-new.png) · [1280×720](screenshots/desktop-1280.png) · [1366×768](screenshots/desktop-1366.png) · [1920×1080](screenshots/desktop-1920.png)

默认视觉比例调整后：[1920×900](screenshots/desktop-1920-900.png) · [1600×900](screenshots/desktop-1600-900.png) · [1600×800 紧凑布局](screenshots/desktop-1600.png)。宽屏（至少 1600×900）采用接近原 125% 缩放的尺寸比例，普通浏览器 100% 下直接显示；未设置 CSS zoom、页面 transform 或设备像素比。回归测试同时断言宽屏侧栏、正文标题和按钮达到可读尺寸，初始卡片/演示热点没有内部溢出，并覆盖任务与完成奖励的完整展示。独立审查发现的 800px 高窗口挤压已通过紧凑布局修复。

桌面一屏断言覆盖首页、标准演示任务、完成奖励，并检查文档没有横向或纵向溢出、主要按钮位于视口内。长新闻或长 AI 任务允许面板内阅读，页面主体不随内容增长；宽度低于 1100px 或高度低于 620px 使用可滚动响应式布局。密钥页面默认只展示服务商与密钥输入，模型与地址在高级设置内；官方密钥获取入口使用新标签页。

## 验证边界

API 测试使用受控响应和虚假测试密钥，不证明真实付费推理、实时新闻搜索、真实服务商浏览器 CORS 已成功。联网事件仅在阿里原生搜索返回来源且与生成结果匹配后展示；未提供的发布时间标为未知，匹配来源仍不等于独立事实核查。

当前目录最初不是 Git 仓库。用户授权发布后，已创建公开仓库 `LucianaiB2004/earth-online-side-quest` 并启用 GitHub Pages 的 Actions 部署模式。线上状态可在 [部署工作流](https://github.com/LucianaiB2004/earth-online-side-quest/actions/workflows/deploy.yml) 查看。

## GitHub Pages 首次上线验收

2026-10-18 首次部署：[Actions #39122022309](https://github.com/LucianaiB2004/earth-online-side-quest/actions/runs/39122022309) 的 build / deploy 均成功，部署提交 `9f44975`。正式站点为 [在线体验](https://lucianaib2004.github.io/earth-online-side-quest/)，HTTPS 已启用。

对正式网址实际验证：首页 HTTP 200、城市图片 HTTP 200，浏览器内所有图片完整加载；1280×720 视口页面无需滚动，生成演示支线→接受→完成→展示探索 +2、感知 +1 的流程正常；刷新后任务重置。此线上验收仍未使用真实付费 API 密钥。

![GitHub Pages 线上页面](screenshots/live-production.png)

提供 Kiro 兼容 Requirements / Design / Tasks 文档，但本次实际开发工具是 Codex，未操作 Kiro IDE。
