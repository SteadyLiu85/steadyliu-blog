# Steady Log - 个人日志

## 文件夹架构说明

### 1. 前端 (client/src/)

采用 **React + Tailwind CSS + Lucide Icons**。

| **文件名**            | **核心功能含义**      | **技术要点**                                                 |
| --------------------- | --------------------- | ------------------------------------------------------------ |
| **App.jsx**           | 全局路由中心 & 导航栏 | 使用 `NavLink` 实现选中区分                                  |
| **PostList.jsx**      | 首页文章流            | 解耦组件，支持实时搜索过滤                                   |
| **PostDetail.jsx**    | 文章详情页            | **Scroll Spy** 滚动追踪、**TOC** 自动提取、**Prose** 深度定制渲染 |
| **CreatePost.jsx**    | 创作中心 (编辑器)     | 适配 Markdown 输入，支持合集与标签管理                       |
| **SeriesList.jsx**    | 合集汇总页            | 实现差异化显示                                               |
| **TagCloud.jsx**      | 标签云                | 基于3D 悬浮感标签组                                          |
| **FilteredPosts.jsx** | 筛选结果页            | 点击标签或合集后的结果聚合展示                               |
| **About.jsx**         | 个人简介占位页        | 预留的测试页面                                               |

### 2. 后端 (server/index.js)

采用 **Node.js + Express + MongoDB**。

- **API 接口设计**：
  - `/api/posts`: 文章的增删改查。
  - `/api/series/stats`: 聚合计算每个合集的文章数、目标进度和最后更新时间。
  - `/api/tags`: 遍历所有文章并去重，返回全站标签列表。

------

## 功能用法

### 1. 目录 (TOC) 自动生成

- **用法**：在 Markdown 撰写时，只要使用 `##` 或 `###` 开头，右侧（或左侧，取决于你的微调）会自动生成导航链接。
- **Debug 点**：如果点击目录不跳转，请检查 `PostDetail.jsx` 中 `generateTOC` 的正则生成逻辑是否与 `ReactMarkdown` 的 `components` 渲染出的 `id` 一致。

### 2. 进度条

- **用法**：在后端 `goals` 对象中配置。
  - 设置 `目标数 > 0`：显示蓝色进度条。
  - 设置 `目标数 = 0`：显示绿色无限符号。

### 3. 数学公式与代码高亮

- **LaTeX**：支持行内 `$E=mc^2$` 和块级 `$$...$$`。
- **代码**：在 Markdown 围栏内标注语言即可，如 ````cpp`。

------

## 视觉微调

- **调屏占比**：在 `PostDetail.jsx` 搜索 `lg:w-[82%]` (正文) 和 `lg:w-[18%]` (目录)。
- **调全站宽度**：搜索 `max-w-[1600px]` (或 `w-screen`)。
- **调标题字号**：在 `components` 映射里找 `h2` 的 `text-4xl` 或 `text-6xl`。
- **调发光效果**：搜索 `shadow-[0_0_10px_...]`。

------

## 待办清单 (Next Steps)

- [ ] **图片上传系统**：实现后端存储，支持 Markdown 贴图。
- [ ] **评论系统**：接入 Giscus (GitHub Discussion)。
- [ ] [ ] **暗色/亮色切换**
- [ ] **正式部署**：将前后端部署到 Vercel/Render 并上线。

