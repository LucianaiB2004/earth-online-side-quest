# 验收记录

验证日期：2026-10-18。环境：Windows、Node.js 24.16.0、npm 11.13.0、Microsoft Edge。生产依赖仅 React / React DOM，原生 CSS 与 fetch。

## 已执行

- `npm test`：27 项单元测试通过。覆盖 JSON、字段和奖励范围、服务商地址白名单、HTTP 错误脱敏、超时、取消、有限重试、来源匹配、用户新闻原文保护、绑定事件的演示任务。
- `npm run test:e2e`：13 项浏览器测试通过。接受→完成→一次奖励、刷新重置、跳过、API 设置与密钥清除、受控 AI 响应、401 演示回退、390px 手机布局与弹窗、演示事件转支线；新增四种桌面尺寸、热点分类与长标题操作入口、服务商自动配置及密钥入口检查。
- 浏览器测试还使用真实 `dist/` 静态文件，在 `/earth-online/` 子路径检查脚本、样式、所有图片加载、页面无 JS 异常、任务按钮可用。
- `npm run build`：TypeScript strict 检查与 Vite 静态生产构建通过。
- `npm audit`：0 漏洞。测试工具的旧版漏洞已升级修复。
- 独立代码审查后修复了演示事件与任务不相关、粘贴新闻链接丢失、输入长度不一致的问题，并添加回归验证。

28 张已切分 WebP 素材；本次补充真实木牌素材、路灯、小猫、店铺和主题灵感卡。构建 JS gzip 约 84 KiB，CSS gzip 约 9 KiB。原始图集未修改。素材切分脚本为 `scripts/prepare_assets.py`，只在需要重制素材时使用 Python + Pillow，运行应用不需要 Python。

## 界面证据

桌面首页：

![桌面首页](screenshots/desktop-1440.png)

完成奖励：

![完成奖励](screenshots/rewards-desktop-new.png)

[手机首页](screenshots/mobile.png) · [手机世界事件](screenshots/world-mobile.png)

[新版 API 设置](screenshots/api-settings-new.png) · [1280×720](screenshots/desktop-1280.png) · [1366×768](screenshots/desktop-1366.png) · [1920×1080](screenshots/desktop-1920.png)

桌面一屏断言覆盖首页、标准演示任务、完成奖励，并检查文档没有横向或纵向溢出、主要按钮位于视口内。长新闻或长 AI 任务允许面板内阅读，页面主体不随内容增长；宽度低于 1100px 或高度低于 620px 使用可滚动响应式布局。密钥页面默认只展示服务商与密钥输入，模型与地址在高级设置内；官方密钥获取入口使用新标签页。

## 验证边界

API 测试使用受控响应和虚假测试密钥，不证明真实付费推理、实时新闻搜索、真实服务商浏览器 CORS 已成功。联网事件仅在阿里原生搜索返回来源且与生成结果匹配后展示；未提供的发布时间标为未知，匹配来源仍不等于独立事实核查。

当前目录最初不是 Git 仓库。用户授权发布后，已创建公开仓库 `LucianaiB2004/earth-online-side-quest` 并启用 GitHub Pages 的 Actions 部署模式。线上状态可在 [部署工作流](https://github.com/LucianaiB2004/earth-online-side-quest/actions/workflows/deploy.yml) 查看。

提供 Kiro 兼容 Requirements / Design / Tasks 文档，但本次实际开发工具是 Codex，未操作 Kiro IDE。
