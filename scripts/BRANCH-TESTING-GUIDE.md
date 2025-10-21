# 🔄 Git 分支测试快速指南

## 🚀 快速开始

### 使用自动化脚本（推荐）

```bash
# 测试任意分支
./scripts/test-branch.sh <branch-name>

# 示例
./scripts/test-branch.sh claude/code-library-documentation-011CUKjtQnZkMSEESXHmS78u
```

脚本会自动：
- ✅ 保存当前工作
- ✅ 切换到测试分支
- ✅ 安装依赖（如需要）
- ✅ 启动开发服务器
- ✅ 提示如何切回原分支

---

## 📋 手动测试（5 步法）

### 步骤 1：保存当前工作

```bash
# 查看状态
git status

# 如果有未提交的更改，暂存起来
git stash save "测试前的工作"
```

### 步骤 2：切换分支

```bash
# 查看可用分支
git branch -a

# 切换到测试分支
git checkout <branch-name>

# 拉取最新代码
git pull
```

### 步骤 3：安装依赖（如需要）

```bash
npm install
```

### 步骤 4：测试功能

```bash
npm run dev
# 访问 http://localhost:3000
```

### 步骤 5：切回原分支

```bash
# 停止服务器 (Ctrl+C)

# 切回 main
git checkout main

# 恢复之前的工作
git stash pop
```

---

## 🎯 常用命令速查

### 查看分支

```bash
# 本地分支
git branch

# 所有分支（包括远程）
git branch -a

# 分支详细信息
git branch -v
```

### 切换分支

```bash
# 切换到已存在的分支
git checkout <branch-name>

# 创建并切换到新分支
git checkout -b <new-branch>

# 切换到上一个分支
git checkout -
```

### 暂存工作

```bash
# 暂存当前工作
git stash

# 带描述的暂存
git stash save "描述信息"

# 查看暂存列表
git stash list

# 恢复最近的暂存
git stash pop

# 恢复特定的暂存
git stash apply stash@{0}

# 删除暂存
git stash drop
```

### 对比分支

```bash
# 查看差异
git diff main..other-branch

# 只看文件名
git diff --name-only main..other-branch

# 查看提交历史差异
git log main..other-branch
```

---

## ⚠️ 注意事项

### 切换分支前

- ✅ 确保工作区干净或已暂存
- ✅ 确认当前分支
- ✅ 查看可用分支列表

### 测试时

- ✅ 可能需要重新安装依赖
- ✅ 可能需要重启开发服务器
- ✅ 确认端口没有被占用

### 测试后

- ✅ 切回原分支
- ✅ 恢复暂存的工作
- ✅ 删除临时分支（如有）

---

## 🔧 故障排除

### 问题 1：切换时提示有冲突

```bash
# 暂存当前更改
git stash

# 或者提交更改
git add .
git commit -m "临时提交"
```

### 问题 2：依赖包报错

```bash
# 重新安装
npm install

# 或者清理后安装
rm -rf node_modules
npm install
```

### 问题 3：端口被占用

```bash
# 查找占用端口的进程
lsof -i :3000

# 或者换个端口
PORT=3001 npm run dev
```

---

## 📝 实用技巧

### 技巧 1：查看分支差异

```bash
# 图形化查看提交历史
git log --oneline --graph --all
```

### 技巧 2：只测试特定文件

```bash
# 只检出某个文件
git checkout <branch> -- path/to/file
```

### 技巧 3：创建临时测试分支

```bash
# 基于其他分支创建临时分支
git checkout -b temp-test <source-branch>

# 测试完成后删除
git branch -D temp-test
```

---

## 🎓 最佳实践

1. **测试前备份**：总是先 `git stash` 或提交
2. **测试后清理**：切回 main 并清理临时文件
3. **使用描述性暂存消息**：方便以后识别
4. **定期更新分支**：`git fetch` 获取最新信息
5. **使用脚本自动化**：减少手动操作错误

---

## 📚 更多资源

- [Git 官方文档 - 分支管理](https://git-scm.com/book/zh/v2/Git-%E5%88%86%E6%94%AF-%E5%88%86%E6%94%AF%E7%AE%A1%E7%90%86)
- [Git Cheat Sheet](https://education.github.com/git-cheat-sheet-education.pdf)
- 项目脚本：`./scripts/test-branch.sh`
