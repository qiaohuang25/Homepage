# 个人学术主页（英文版 · 免费 GitHub Pages 模板）

一个零成本、零后端、用 Excel 管内容的学术主页。你以后改内容只改 `content.xlsx`，
不用碰任何代码；每次 `git push` 自动部署。

## 文件结构

```
academic-homepage/
├── index.html          # 页面骨架（固定，一般不用改）
├── style.css           # 样式（想换配色改这里）
├── script.js           # 读取 Excel 并渲染（一般不用改）
├── content.xlsx        # ★ 你的全部内容都在这里（重点改这个）
├── photo.svg           # 占位头像，替换成你的 photo.jpg
├── generate_content.py # 重新生成 content.xlsx 的脚本（可选）
├── .github/workflows/static.yml  # 自动部署配置
├── DEPLOY.md           # 部署步骤
└── README.md           # 本文件
```

## 怎么改内容（最重要）

打开 `content.xlsx`，里面有这些 sheet：

1. **Profile**（两列 Key / Value）
   - `name` 姓名、`title` 头衔、`affiliation` 单位、`bio` 自我介绍
   - `photo` 头像文件名（放 `photo.jpg` 就写 `photo.jpg`）
   - `email` 邮箱
   - `googleScholar` / `github` / `linkedin` 填主页链接（留空就不显示）
   - `cv` 简历 PDF 文件名（如 `CV.pdf`，留空则顶栏不显示 CV 按钮）
2. **Publications**（表头 Year / Title / Authors / Venue / Link）
   - 每行一篇论文；`Link` 填 DOI / PDF 网址，标题会自动变成链接。
3. **Research**（表头 Title / Description / Image）
   - 每个研究方向一行。
4. **News**（表头 Date / Text）
   - 每条动态一行。
5. **Teaching**（示例板块）— 演示"加 sheet = 加板块"，可随意删除/改名。

> **板块完全由 Excel 驱动**：除了 `Profile` 之外，工作簿里的**每一个 sheet 都会自动变成一个导航 tab + 一个板块**，
> 顺序与 Excel 里 sheet 的排列顺序一致。所以加新板块 = 在 Excel 里加一个新 sheet，
> 完全不用打开或改动 `index.html` / `script.js`。

改完保存，推送即可。想批量生成/重置 xlsx，可运行 `python generate_content.py`
（需先 `pip install openpyxl`，脚本里的示例数据在文件顶部，改完重跑即可）。

## 本地预览

浏览器出于安全限制，不能直接用 `file://` 打开读取 xlsx，需要起一个本地服务：

```bash
cd academic-homepage
python -m http.server 8000
# 然后浏览器打开 http://localhost:8000
```

## 部署

见 `DEPLOY.md`。一句话：建仓库 → 推送 → `Settings → Pages → Source = GitHub Actions`。

## 进阶

- 换配色：编辑 `style.css` 顶部的 CSS 变量（`--accent` 等）。
- **加板块（无需碰代码）**：在 `content.xlsx` 里新建一个 sheet（如 `Awards`、`Projects`、
  `Teaching`），第一行写表头、下面每行一条内容，保存后推送即可。它会自动出现在导航栏。
  通用板块推荐的列名：`Title` / `Name`（标题）、`Date` / `Year`（日期）、
  `Description` / `Text`（正文），其余列会自动以"列名: 内容"形式显示（网址会变成链接）。
- 想要出版物自动生成 BibTeX / Google Scholar 联动，可考虑 `al-folio` 模板。
