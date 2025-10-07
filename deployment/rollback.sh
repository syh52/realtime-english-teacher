#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== 代码回滚工具 ===${NC}"
echo ""

# 显示最近的提交历史
echo -e "${YELLOW}最近的提交历史：${NC}"
git log --oneline --graph -10
echo ""

# 询问用户
echo -e "${YELLOW}选择回滚方式：${NC}"
echo "1. 撤销最后一次提交（保留代码修改）"
echo "2. 撤销最后一次提交（完全丢弃修改）⚠️"
echo "3. 回滚到指定提交（需要输入提交 ID）⚠️"
echo "4. 只查看某个提交的内容（不做修改）"
echo "5. 取消"
echo ""

read -p "请输入选项 (1-5): " choice

case $choice in
  1)
    echo -e "${GREEN}撤销最后一次提交，保留修改...${NC}"
    git reset --soft HEAD~1
    echo -e "${GREEN}✓ 完成！代码修改已保留，可以重新编辑后提交${NC}"
    git status
    ;;

  2)
    read -p "⚠️  确定要完全丢弃最后一次提交吗？(yes/no): " confirm
    if [ "$confirm" == "yes" ]; then
      echo -e "${YELLOW}完全撤销最后一次提交...${NC}"
      git reset --hard HEAD~1
      echo -e "${GREEN}✓ 完成！已回滚到上一个版本${NC}"
      git log --oneline -5
    else
      echo -e "${RED}已取消${NC}"
    fi
    ;;

  3)
    read -p "请输入要回滚到的提交 ID (例如: 0806148): " commit_id
    echo -e "${YELLOW}将回滚到: $commit_id${NC}"
    echo ""
    git show --stat $commit_id
    echo ""
    read -p "⚠️  确定要回滚到这个版本吗？当前的所有改动将丢失！(yes/no): " confirm
    if [ "$confirm" == "yes" ]; then
      git reset --hard $commit_id
      echo -e "${GREEN}✓ 已回滚到提交 $commit_id${NC}"
      echo ""
      echo -e "${YELLOW}现在需要强制推送到服务器吗？${NC}"
      read -p "是否部署到服务器？(yes/no): " deploy
      if [ "$deploy" == "yes" ]; then
        ./update-server.sh
      fi
    else
      echo -e "${RED}已取消${NC}"
    fi
    ;;

  4)
    read -p "请输入要查看的提交 ID: " commit_id
    echo -e "${YELLOW}提交详情：${NC}"
    git show $commit_id
    ;;

  5)
    echo -e "${RED}已取消${NC}"
    ;;

  *)
    echo -e "${RED}无效选项${NC}"
    ;;
esac
