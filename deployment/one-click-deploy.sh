#!/usr/bin/env bash
# Real-time English Teacher - 一键部署脚本
# 全自动部署到阿里云新加坡，零人工干预

set -e

# 颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# 加载配置
ENV_FILE="/home/dministrator/Newproject/.env.local"
[ -f "$ENV_FILE" ] && source $ENV_FILE || log_error "找不到 $ENV_FILE"

# 配置
REGION="ap-southeast-1"
INSTANCE_TYPE="ecs.t6-c1m2.large"  # 2核4G
IMAGE="ubuntu_22_04"

log_info "=========================================="
log_info "Real-time English Teacher 一键部署"
log_info "=========================================="

# 1. 配置阿里云 CLI
log_info "配置阿里云 CLI..."
aliyun configure set --profile default --mode AK \
    --region $REGION \
    --access-key-id "$ALIYUN_ACCESS_KEY_ID" \
    --access-key-secret "$ALIYUN_ACCESS_KEY_SECRET"

# 2. 查找镜像 ID
log_info "查找 Ubuntu 22.04 镜像..."
IMAGE_ID=$(aliyun ecs DescribeImages \
    --RegionId $REGION \
    --OSType linux \
    --ImageOwnerAlias system \
    --PageSize 100 \
    | jq -r '.Images.Image[] | select(.ImageName | contains("ubuntu_22_04_x64")) | .ImageId' | head -1)

# 如果还是找不到，使用默认最新镜像
if [ -z "$IMAGE_ID" ]; then
    IMAGE_ID="ubuntu_22_04_x64_20G_alibase_20250917.vhd"
fi

log_info "使用镜像: $IMAGE_ID"

# 验证镜像 ID
if [ -z "$IMAGE_ID" ]; then
    log_error "未找到可用的 Ubuntu 22.04 镜像"
fi

# 3. 创建或获取安全组
log_info "配置安全组..."
SG_NAME="realtime-english-sg"

SG_ID=$(aliyun ecs DescribeSecurityGroups --RegionId $REGION \
    | jq -r ".SecurityGroups.SecurityGroup[] | select(.SecurityGroupName==\"$SG_NAME\") | .SecurityGroupId" | head -1)

if [ -z "$SG_ID" ]; then
    # 获取默认 VPC
    VPC_ID=$(aliyun ecs DescribeVpcs --RegionId $REGION \
        | jq -r '.Vpcs.Vpc[0].VpcId')

    [ -z "$VPC_ID" ] && log_error "未找到 VPC"

    # 创建安全组
    SG_ID=$(aliyun ecs CreateSecurityGroup \
        --RegionId $REGION \
        --VpcId $VPC_ID \
        --SecurityGroupName $SG_NAME \
        | jq -r '.SecurityGroupId')

    log_info "创建安全组: $SG_ID"

    # 添加规则
    for port in 22 80 443 3000; do
        aliyun ecs AuthorizeSecurityGroup \
            --RegionId $REGION \
            --SecurityGroupId $SG_ID \
            --IpProtocol tcp \
            --PortRange "$port/$port" \
            --SourceCidrIp "0.0.0.0/0" &>/dev/null || true
    done
    log_info "✓ 安全组规则已配置"
else
    log_info "使用现有安全组: $SG_ID"
fi

# 4. 获取交换机
log_info "获取交换机..."
VPC_ID=$(aliyun ecs DescribeSecurityGroups \
    --RegionId $REGION \
    --SecurityGroupId $SG_ID \
    | jq -r '.SecurityGroups.SecurityGroup[0].VpcId')

VSW_ID=$(aliyun vpc DescribeVSwitches \
    --RegionId $REGION \
    --VpcId $VPC_ID \
    | jq -r '.VSwitches.VSwitch[0].VSwitchId')

[ -z "$VSW_ID" ] && log_error "未找到交换机"
log_info "使用交换机: $VSW_ID"

# 5. 创建 ECS 实例
log_info "创建 ECS 实例..."
INSTANCE_ID=$(aliyun ecs RunInstances \
    --RegionId $REGION \
    --ImageId $IMAGE_ID \
    --InstanceType $INSTANCE_TYPE \
    --SecurityGroupId $SG_ID \
    --VSwitchId $VSW_ID \
    --InstanceName "realtime-english-teacher" \
    --InternetChargeType "PayByTraffic" \
    --InternetMaxBandwidthOut 5 \
    --SystemDisk.Category "cloud_essd" \
    --SystemDisk.Size 40 \
    --InstanceChargeType "PostPaid" \
    --Password "RealTime2025!" \
    | jq -r '.InstanceIdSets.InstanceIdSet[0]')

log_info "实例创建成功: $INSTANCE_ID"

# 6. 启动并分配公网 IP
log_info "启动实例..."
sleep 10
aliyun ecs StartInstance --InstanceId $INSTANCE_ID

log_info "等待实例运行..."
for i in {1..30}; do
    STATUS=$(aliyun ecs DescribeInstances \
        --RegionId $REGION \
        --InstanceIds "['$INSTANCE_ID']" \
        | jq -r '.Instances.Instance[0].Status')

    [ "$STATUS" == "Running" ] && break
    echo -n "."
    sleep 5
done
echo ""

log_info "分配公网 IP..."
aliyun ecs AllocatePublicIpAddress --InstanceId $INSTANCE_ID

# 7. 获取 IP 地址
PUBLIC_IP=$(aliyun ecs DescribeInstances \
    --RegionId $REGION \
    --InstanceIds "['$INSTANCE_ID']" \
    | jq -r '.Instances.Instance[0].PublicIpAddress.IpAddress[0]')

log_info "公网 IP: $PUBLIC_IP"

# 8. 等待 SSH 就绪
log_info "等待 SSH 服务就绪（约 60 秒）..."
sleep 60

# 9. 部署项目
log_info "部署项目到服务器..."

ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ubuntu@$PUBLIC_IP << ENDSSH
# 更新系统
sudo apt-get update
sudo DEBIAN_FRONTEND=noninteractive apt-get upgrade -y

# 安装 Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git

# 安装 PM2
sudo npm install -g pm2

# 克隆项目
cd /home/ubuntu
git clone https://github.com/cameronking4/openai-realtime-api-nextjs.git
cd openai-realtime-api-nextjs

# 配置环境变量
cat > .env.local << ENV
OPENAI_API_KEY=${OPENAI_API_KEY}
NEXT_PUBLIC_API_URL=http://\$(curl -s ifconfig.me):3000
ENV

# 安装依赖
npm install

# 构建项目
npm run build

# 启动服务
pm2 start npm --name "realtime-english" -- start
pm2 save
pm2 startup | tail -1 | bash

echo "部署完成！"
ENDSSH

# 10. 保存配置
cat > deployment-config.json <<EOF
{
  "instance_id": "$INSTANCE_ID",
  "public_ip": "$PUBLIC_IP",
  "region": "$REGION",
  "ssh_command": "ssh ubuntu@$PUBLIC_IP",
  "ssh_password": "RealTime2025!",
  "url": "http://$PUBLIC_IP:3000",
  "deployed_at": "$(date -Iseconds)"
}
EOF

log_info "=========================================="
log_info "✓ 部署完成！"
log_info "=========================================="
log_info ""
log_info "访问地址: http://$PUBLIC_IP:3000"
log_info "SSH 登录: ssh ubuntu@$PUBLIC_IP"
log_info "密码: RealTime2025!"
log_info ""
log_info "配置已保存到: deployment-config.json"
log_info ""
log_info "预估成本: ~150-250 元/月"
log_info "=========================================="
