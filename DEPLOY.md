# 部署到 GitHub Pages

本项目是纯静态站点，通过 GitHub Actions 自动发布，完全免费。

## 你需要做的事

1. 在 GitHub 新建一个**空**仓库（建议不要勾选 Add a README，避免初次推送冲突）。
   - 想要最干净的网址，仓库名直接用 `<你的GitHub用户名>.github.io`（例如 `joseph.github.io`）。
   - 否则任意名字（如 `homepage`）也可以，网址会是 `<用户名>.github.io/<仓库名>`。
2. 在**本机 `academic-homepage/` 文件夹内**执行下面的 git 命令，把内容推送到仓库的 `main` 分支。
   注意必须在该文件夹内执行，保证 `index.html` 等文件位于仓库根目录（不要多套一层 `academic-homepage/` 子目录）：

   ```bash
   # 进入项目文件夹（本机实际路径）
   cd /Users/joseph/WorkBuddy/2026-08-25-18-41-01/academic-homepage

   # 初始化并提交全部文件
   git init
   git add .
   git commit -m "Initial homepage"

   # 关联远程仓库：把 <仓库地址> 换成你的，例如
   #   https://github.com/用户名/用户名.github.io.git
   #   git@github.com:用户名/用户名.github.io.git   （SSH 方式）
   git branch -M main
   git remote add origin <仓库地址>
   git push -u origin main
   ```

   > 认证说明：GitHub 已不支持用账号密码推送。请用 **Personal Access Token (PAT)** 代替密码，
   > 或提前配置好 SSH key；也可以先执行 `gh auth login` 再用 `gh` 命令管理。
   > 如果远程仓库已存在 README，先 `git pull origin main --rebase` 再 push。
3. 仓库中打开：`Settings → Pages`。
4. 在 `Build and deployment` 区域，把 `Source` 改为 **GitHub Actions**。
5. 回到仓库的 `Actions` 标签页：第 2 步的 `push` 通常会自动触发
   `Deploy static content to Pages`；等它变绿即可。若列表里没有该任务，点 **Run workflow** 手动触发一次。
6. 访问 `https://<用户名>.github.io/` （或带仓库名的地址）即可看到你的主页。

## 注意事项

- `content.xlsx`、照片（`photo.svg` / `photo.jpg`）、PDF（`CV.pdf`）等必须和 `index.html` 一起提交到仓库根目录。
- 改完 Excel 内容后，只要 `git push`，网站就会自动更新。
- 本地预览请用 HTTP 服务（见 README），直接双击 `index.html` 会因浏览器安全策略无法读取 xlsx。
