#!/usr/bin/env bash
# 自动配置阿里云 CLI
# 从 .env.local 读取凭证并配置

set -e

# 读取环境变量
ENV_FILE="/home/dministrator/Newproject/.env.local"

if [ ! -f "$ENV_FILE" ]; then
    echo "错误: 找不到 $ENV_FILE"
    exit 1
fi

# 加载环境变量
source $ENV_FILE

# 配置阿里云 CLI
echo "正在配置阿里云 CLI..."

aliyun configure set \
    --profile default \
    --mode AK \
    --region ap-southeast-1 \
    --access-key-id "$ALIYUN_ACCESS_KEY_ID" \
    --access-key-secret "$ALIYUN_ACCESS_KEY_SECRET"

echo "✓ 阿里云 CLI 配置完成"

# 验证配置
echo "验证配置..."
aliyun ecs DescribeRegions --output cols=RegionId,LocalName rows=Regions.Region[] | head -5

echo ""
echo "✓ 配置成功！现在可以运行部署脚本了"
