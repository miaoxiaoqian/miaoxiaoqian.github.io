# Qian — Deep Tech & Spatial Computing

`https://miaoxiaoqian.github.io/` 的生产源代码。

## 技术栈

- HTML5
- Tailwind CSS v4
- Vanilla JavaScript
- Three.js
- Vite

## 本地开发

```bash
npm install
npm run dev
```

## 生产构建

```bash
npm run build
```

构建结果位于 `dist/`。GitHub Pages 根目录需要使用其中的 `index.html`、`styles.css` 和 `main.js`。

## 内容维护

- 页面文案与结构：`index.html`
- 视觉系统与响应式布局：`src/styles.css`
- Three.js 图网络、研究抽屉和表单交互：`src/main.js`
- GitHub 热力图：由 `src/main.js` 读取 `miaoxiaoqian` 的公开贡献数据，不生成模拟记录
- SIM_DEMOS：LIBERO EP009 的 AllBase 失败轨迹与 Final Skill 成功轨迹对照轮播
- Intel Hub：论文阅读卡、研究日志和 GitHub 公开项目接口
- 个人照片：当前使用 GitHub 头像，可将图片地址替换为仓库内的本地图片

视频发布资源位于仓库根目录的 `media/`。网页会在浏览器内还原 `.b64` 视频资产并播放，
因此无需外部视频平台；替换视频时需要同步更新对应的 Base64 资源。

研究图谱不会虚构论文或成果。形成公开论文、代码或项目后，在 `src/main.js` 的 `researchNodes` 数据中补充链接即可。

联系表单不会在静态网站中存储数据；它会把内容带入 GitHub Issue 编辑器，由访客确认后提交。

修改源码后运行 `npm run build`，再把 `dist/index.html`、`dist/styles.css` 和
`dist/main.js` 同步到仓库根目录；GitHub Pages 会自动发布更新。
