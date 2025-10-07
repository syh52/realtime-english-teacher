# 回滚指南 🔄

## 快速使用

### 使用交互式回滚工具（推荐）

```bash
cd deployment
./rollback.sh
```

然后按照提示选择回滚方式。

---

## 常见回滚场景

### 场景 1：最后一次改动有问题，想重新做

```bash
# 撤销最后一次提交，但保留代码修改
git reset --soft HEAD~1

# 现在你可以重新编辑代码
# 编辑完成后重新提交
git add .
git commit -m "新的提交消息"
```

### 场景 2：最后一次改动完全不要了

```bash
# ⚠️ 警告：这会丢失所有修改！
git reset --hard HEAD~1

# 部署到服务器
cd deployment
./update-server.sh
```

### 场景 3：回到"改造前"的原始状态

```bash
# 查看改造前的版本
git log --oneline | grep "rebrand"

# 回滚到品牌重塑版本（移除所有教练改造）
git reset --hard 0806148

# 部署
cd deployment
./update-server.sh
```

### 场景 4：只想恢复某个文件

```bash
# 例如：恢复教练指令到之前的版本
git log --oneline config/coach-instructions.ts

# 恢复到指定版本
git checkout 3db99f8 -- config/coach-instructions.ts

# 提交修改
git commit -m "恢复教练指令到之前的版本"

# 部署
cd deployment
./update-server.sh
```

### 场景 5：想看看之前的版本长什么样（不修改代码）

```bash
# 查看某个提交的详细信息
git show 7e38628

# 查看某个文件在特定版本的内容
git show 0806148:components/header.tsx

# 临时切换到某个版本查看（不修改）
git checkout 0806148
# 查看完后回到当前版本
git checkout main
```

---

## 重要版本节点

```
5e79a3e - 优化提问策略（最新）
3db99f8 - 增强 AI 教练主动引导
7e38628 - 改造为智能英语教练（第一次大改）
0806148 - 品牌重塑（移除开源痕迹）
b47841d - 初始提交（原始开源版本）
```

### 如果想回到...

**原始开源版本**：
```bash
git reset --hard b47841d
```

**品牌重塑后，但没有教练改造**：
```bash
git reset --hard 0806148
```

**第一版教练改造（没有后续优化）**：
```bash
git reset --hard 7e38628
```

---

## 安全提示 ⚠️

1. **回滚前先备份**
   ```bash
   # 创建备份分支
   git branch backup-$(date +%Y%m%d-%H%M%S)
   ```

2. **查看将要丢失的内容**
   ```bash
   # 查看将要丢失的提交
   git log HEAD~3..HEAD

   # 查看将要丢失的代码修改
   git diff 0806148..HEAD
   ```

3. **回滚后如何恢复**
   ```bash
   # 查看所有操作历史（包括已删除的提交）
   git reflog

   # 恢复到某个操作
   git reset --hard HEAD@{2}
   ```

---

## 紧急恢复

如果回滚后发现搞错了：

```bash
# 1. 查看操作历史
git reflog

# 输出示例：
# 5e79a3e HEAD@{0}: reset: moving to 5e79a3e
# 3db99f8 HEAD@{1}: commit: feat: 增强 AI 教练主动引导能力
# 7e38628 HEAD@{2}: commit: feat: 改造为智能英语教练模式

# 2. 恢复到回滚前的状态
git reset --hard HEAD@{1}
```

---

## 快速参考

| 目标 | 命令 |
|------|------|
| 撤销最后一次提交（保留修改） | `git reset --soft HEAD~1` |
| 撤销最后一次提交（丢弃修改） | `git reset --hard HEAD~1` |
| 回滚到指定版本 | `git reset --hard <commit-id>` |
| 只恢复某个文件 | `git checkout <commit-id> -- <file>` |
| 查看历史记录 | `git log --oneline --graph` |
| 查看操作历史（可恢复已删除提交） | `git reflog` |
| 创建备份分支 | `git branch backup-$(date +%Y%m%d)` |

---

## 小贴士

1. **使用 `rollback.sh` 脚本**最安全，它会提示确认
2. **回滚前先备份**，万一需要恢复
3. **先用 `git show` 查看**，确认是你想要的版本
4. **记住 `git reflog`**，这是反悔药💊

