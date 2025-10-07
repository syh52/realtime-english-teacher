#!/usr/bin/env bash
# Real-time English Teacher - 自动化部署到阿里云新加坡
# 作者: syh
# 日期: 2025-10-08

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 配置变量
PROJECT_NAME="realtime-english-teacher"
GITHUB_REPO="https://github.com/cameronking4/openai-realtime-api-nextjs.git"
REGION_ID="ap-southeast-1"  # 新加坡
ZONE_ID="ap-southeast-1a"
INSTANCE_TYPE="ecs.t6-c1m1.large"  # 最低配：2核2GB
IMAGE_ID="ubuntu_22_04_x64_20G_alibase_20240220.vhd"  # Ubuntu 22.04
SYSTEM_DISK_SIZE="40"  # 40GB 系统盘
INSTANCE_NAME="${PROJECT_NAME}-server"

# ============================================================
# Step 1: 检查依赖
# ============================================================
check_dependencies() {
    log_info "检查必要的依赖..."

    # 检查 aliyun CLI
    if ! command -v aliyun &> /dev/null; then
        log_error "阿里云 CLI 未安装"
        log_info "请访问 https://help.aliyun.com/zh/cli/install-cli 安装"
        exit 1
    fi

    # 检查 jq
    if ! command -v jq &> /dev/null; then
        log_error "jq 未安装，正在安装..."
        sudo apt-get update && sudo apt-get install -y jq
    fi

    # 检查 git
    if ! command -v git &> /dev/null; then
        log_error "git 未安装"
        exit 1
    fi

    log_info "✓ 所有依赖检查完成"
}

# ============================================================
# Step 2: 检查阿里云 CLI 配置
# ============================================================
check_aliyun_credentials() {
    log_info "检查阿里云 CLI 配置..."

    if ! aliyun configure list &> /dev/null; then
        log_error "阿里云 CLI 未配置"
        log_info "请运行: aliyun configure"
        log_info "需要提供: Access Key ID, Access Key Secret, Region ID (ap-southeast-1)"
        exit 1
    fi

    log_info "✓ 阿里云 CLI 已配置"
}

# ============================================================
# Step 3: 克隆开源项目
# ============================================================
clone_project() {
    log_info "克隆开源项目..."

    if [ -d "$PROJECT_NAME" ]; then
        log_warn "项目目录已存在，跳过克隆"
    else
        git clone $GITHUB_REPO $PROJECT_NAME
        log_info "✓ 项目克隆完成"
    fi

    cd $PROJECT_NAME
}

# ============================================================
# Step 4: 创建安全组（如果不存在）
# ============================================================
create_security_group() {
    log_info "检查/创建安全组..."

    # 查询是否存在同名安全组
    sg_id=$(aliyun ecs DescribeSecurityGroups \
        --RegionId $REGION_ID \
        --SecurityGroupName "${PROJECT_NAME}-sg" \
        | jq -r '.SecurityGroups.SecurityGroup[0].SecurityGroupId // empty')

    if [ -z "$sg_id" ]; then
        log_info "创建新的安全组..."

        # 首先创建 VPC（如果需要）
        vpc_id=$(aliyun ecs DescribeVpcs \
            --RegionId $REGION_ID \
            | jq -r '.Vpcs.Vpc[0].VpcId // empty')

        if [ -z "$vpc_id" ]; then
            log_info "创建新的 VPC..."
            vpc_id=$(aliyun vpc CreateVpc \
                --RegionId $REGION_ID \
                --CidrBlock "192.168.0.0/16" \
                --VpcName "${PROJECT_NAME}-vpc" \
                | jq -r '.VpcId')
            log_info "VPC 创建完成: $vpc_id"

            # 等待 VPC 可用
            sleep 5
        fi

        # 创建安全组
        sg_id=$(aliyun ecs CreateSecurityGroup \
            --RegionId $REGION_ID \
            --SecurityGroupName "${PROJECT_NAME}-sg" \
            --Description "Security group for ${PROJECT_NAME}" \
            --VpcId $vpc_id \
            | jq -r '.SecurityGroupId')

        log_info "安全组创建完成: $sg_id"

        # 添加安全组规则：允许 SSH (22)
        aliyun ecs AuthorizeSecurityGroup \
            --RegionId $REGION_ID \
            --SecurityGroupId $sg_id \
            --IpProtocol tcp \
            --PortRange "22/22" \
            --SourceCidrIp "0.0.0.0/0" \
            --Priority 1

        # 添加安全组规则：允许 HTTP (80)
        aliyun ecs AuthorizeSecurityGroup \
            --RegionId $REGION_ID \
            --SecurityGroupId $sg_id \
            --IpProtocol tcp \
            --PortRange "80/80" \
            --SourceCidrIp "0.0.0.0/0" \
            --Priority 1

        # 添加安全组规则：允许 HTTPS (443)
        aliyun ecs AuthorizeSecurityGroup \
            --RegionId $REGION_ID \
            --SecurityGroupId $sg_id \
            --IpProtocol tcp \
            --PortRange "443/443" \
            --SourceCidrIp "0.0.0.0/0" \
            --Priority 1

        # 添加安全组规则：允许 Next.js 默认端口 (3000)
        aliyun ecs AuthorizeSecurityGroup \
            --RegionId $REGION_ID \
            --SecurityGroupId $sg_id \
            --IpProtocol tcp \
            --PortRange "3000/3000" \
            --SourceCidrIp "0.0.0.0/0" \
            --Priority 1

        log_info "✓ 安全组规则配置完成"
    else
        log_info "使用现有安全组: $sg_id"
    fi

    echo $sg_id
}

# ============================================================
# Step 5: 创建交换机（如果不存在）
# ============================================================
create_vswitch() {
    local vpc_id=$1
    log_info "检查/创建交换机..."

    vsw_id=$(aliyun vpc DescribeVSwitches \
        --RegionId $REGION_ID \
        --VpcId $vpc_id \
        | jq -r '.VSwitches.VSwitch[0].VSwitchId // empty')

    if [ -z "$vsw_id" ]; then
        log_info "创建新的交换机..."
        vsw_id=$(aliyun vpc CreateVSwitch \
            --RegionId $REGION_ID \
            --ZoneId $ZONE_ID \
            --VpcId $vpc_id \
            --CidrBlock "192.168.1.0/24" \
            --VSwitchName "${PROJECT_NAME}-vsw" \
            | jq -r '.VSwitchId')

        log_info "交换机创建完成: $vsw_id"
        sleep 5  # 等待交换机可用
    else
        log_info "使用现有交换机: $vsw_id"
    fi

    echo $vsw_id
}

# ============================================================
# Step 6: 创建 ECS 实例
# ============================================================
create_ecs_instance() {
    local sg_id=$1
    local vsw_id=$2

    log_info "创建 ECS 实例（新加坡）..."

    # 检查是否已存在同名实例
    existing_instance=$(aliyun ecs DescribeInstances \
        --RegionId $REGION_ID \
        --InstanceName "$INSTANCE_NAME" \
        | jq -r '.Instances.Instance[0].InstanceId // empty')

    if [ -n "$existing_instance" ]; then
        log_warn "实例已存在: $existing_instance"
        echo $existing_instance
        return
    fi

    # 创建实例
    instance_id=$(aliyun ecs RunInstances \
        --RegionId $REGION_ID \
        --ImageId $IMAGE_ID \
        --InstanceType $INSTANCE_TYPE \
        --SecurityGroupId $sg_id \
        --VSwitchId $vsw_id \
        --InstanceName $INSTANCE_NAME \
        --InternetChargeType "PayByTraffic" \
        --InternetMaxBandwidthOut 5 \
        --SystemDisk.Category "cloud_essd" \
        --SystemDisk.Size $SYSTEM_DISK_SIZE \
        --InstanceChargeType "PostPaid" \
        --Password "YourPassword123!" \
        | jq -r '.InstanceIdSets.InstanceIdSet[0]')

    log_info "ECS 实例创建成功: $instance_id"

    # 等待实例运行
    log_info "等待实例启动..."
    sleep 30

    # 启动实例
    aliyun ecs StartInstance --InstanceId $instance_id

    # 等待实例进入运行状态
    log_info "等待实例进入运行状态..."
    while true; do
        status=$(aliyun ecs DescribeInstances \
            --RegionId $REGION_ID \
            --InstanceIds "['$instance_id']" \
            | jq -r '.Instances.Instance[0].Status')

        if [ "$status" == "Running" ]; then
            log_info "✓ 实例已运行"
            break
        fi

        log_info "当前状态: $status，等待中..."
        sleep 10
    done

    # 分配公网 IP
    log_info "分配公网 IP..."
    aliyun ecs AllocatePublicIpAddress --InstanceId $instance_id

    echo $instance_id
}

# ============================================================
# Step 7: 获取实例信息
# ============================================================
get_instance_info() {
    local instance_id=$1

    log_info "获取实例信息..."

    instance_info=$(aliyun ecs DescribeInstances \
        --RegionId $REGION_ID \
        --InstanceIds "['$instance_id']")

    public_ip=$(echo $instance_info | jq -r '.Instances.Instance[0].PublicIpAddress.IpAddress[0]')

    log_info "实例 ID: $instance_id"
    log_info "公网 IP: $public_ip"

    # 保存到配置文件
    cat > deployment-config.json <<EOF
{
  "instance_id": "$instance_id",
  "public_ip": "$public_ip",
  "region": "$REGION_ID",
  "deployed_at": "$(date -Iseconds)"
}
EOF

    log_info "✓ 实例信息已保存到 deployment-config.json"

    echo $public_ip
}

# ============================================================
# Step 8: 部署项目到服务器
# ============================================================
deploy_to_server() {
    local public_ip=$1

    log_info "准备部署脚本..."

    # 创建远程部署脚本
    cat > remote-deploy.sh <<'EOF'
#!/bin/bash
set -e

# 更新系统
sudo apt-get update

# 安装 Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 Git
sudo apt-get install -y git

# 克隆项目
cd /home/ubuntu
if [ -d "openai-realtime-api-nextjs" ]; then
    cd openai-realtime-api-nextjs
    git pull
else
    git clone https://github.com/cameronking4/openai-realtime-api-nextjs.git
    cd openai-realtime-api-nextjs
fi

# 安装依赖
npm install

# 创建 .env.local 文件（需要用户手动填写 OPENAI_API_KEY）
cat > .env.local <<ENV
OPENAI_API_KEY=your_openai_api_key_here
NEXT_PUBLIC_API_URL=http://$(curl -s ifconfig.me):3000
ENV

echo "======================================"
echo "部署完成！"
echo "请手动编辑 /home/ubuntu/openai-realtime-api-nextjs/.env.local"
echo "填写你的 OPENAI_API_KEY"
echo "然后运行: npm run dev"
echo "======================================"
EOF

    log_info "上传部署脚本到服务器..."
    scp -o StrictHostKeyChecking=no remote-deploy.sh ubuntu@$public_ip:/home/ubuntu/

    log_info "执行远程部署..."
    ssh -o StrictHostKeyChecking=no ubuntu@$public_ip 'bash /home/ubuntu/remote-deploy.sh'

    log_info "✓ 部署完成"
}

# ============================================================
# Main 主流程
# ============================================================
main() {
    log_info "=========================================="
    log_info "Real-time English Teacher 自动化部署"
    log_info "目标区域: 阿里云新加坡"
    log_info "=========================================="

    # Step 1: 检查依赖
    check_dependencies

    # Step 2: 检查阿里云配置
    check_aliyun_credentials

    # Step 3: 克隆项目（可选，本地验证）
    # clone_project

    # Step 4: 创建安全组
    sg_id=$(create_security_group)

    # Step 5: 获取 VPC 和创建交换机
    vpc_id=$(aliyun ecs DescribeSecurityGroups \
        --RegionId $REGION_ID \
        --SecurityGroupId $sg_id \
        | jq -r '.SecurityGroups.SecurityGroup[0].VpcId')

    vsw_id=$(create_vswitch $vpc_id)

    # Step 6: 创建 ECS 实例
    instance_id=$(create_ecs_instance $sg_id $vsw_id)

    # Step 7: 获取实例信息
    public_ip=$(get_instance_info $instance_id)

    # Step 8: 部署到服务器
    # deploy_to_server $public_ip

    log_info "=========================================="
    log_info "部署完成！"
    log_info "=========================================="
    log_info "实例 ID: $instance_id"
    log_info "公网 IP: $public_ip"
    log_info ""
    log_info "下一步操作："
    log_info "1. SSH 登录: ssh ubuntu@$public_ip"
    log_info "2. 密码: YourPassword123!"
    log_info "3. 手动运行部署脚本进行项目配置"
    log_info ""
    log_info "预估成本: ~100-200 元/月"
    log_info "=========================================="
}

# 运行主流程
main "$@"
