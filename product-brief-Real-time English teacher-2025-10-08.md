# Product Brief: Real-time English teacher

**Date:** 2025-10-08
**Author:** syh
**Status:** Draft for PM Review

---

## Executive Summary

**项目概念**：测试将 OpenAI Realtime API 开源项目部署到阿里云新加坡，验证中国大陆用户是否能够正常使用实时语音对话功能。

**核心问题**：该开源项目在中国大陆无法直接使用，因为无法访问 OpenAI API。

**解决方案**：通过阿里云新加坡服务器作为中转，让国内用户间接访问 OpenAI Realtime API。

**验证目标**：1-2 周内完成部署和测试，确认技术可行性（重点关注延迟、稳定性和成本）。

**预算**：200-350 元（服务器 + API 测试费用）。

**下一步决策**：根据验证结果决定是否值得继续开发成完整产品。

---

## Problem Statement

**核心问题：**
发现了一个基于 OpenAI Realtime API 的开源项目（https://github.com/cameronking4/openai-realtime-api-nextjs），但在中国大陆无法直接访问 OpenAI API，导致项目无法使用。

**验证目标：**
测试通过阿里云新加坡服务器部署该项目，中国大陆用户能否正常使用实时语音对话功能。

**关键问题：**
1. 网络连接稳定性：国内访问新加坡服务器延迟是否可接受？
2. WebRTC 可用性：WebRTC 音频流在跨境场景下是否稳定？
3. API 调用成功率：新加坡服务器调用 OpenAI API 是否顺畅？

---

## Proposed Solution

**技术验证方案：**

1. 直接使用开源项目 [openai-realtime-api-nextjs](https://github.com/cameronking4/openai-realtime-api-nextjs)
2. 部署到阿里云新加坡服务器（ECS）
3. 配置 OpenAI API Key
4. 从中国大陆访问测试

**部署架构：**
```
中国大陆用户浏览器
    ↓ (WebRTC)
阿里云新加坡服务器 (Next.js + Node.js)
    ↓ (HTTPS)
OpenAI Realtime API
```

**验证指标：**
- 能否成功建立 WebRTC 连接
- 语音延迟是否小于 500ms（可接受范围）
- 对话是否流畅无明显卡顿
- 能否完成 5 分钟以上连续对话

---

## Target Users

**验证阶段测试用户：**
- 自己（项目发起人）
- 2-3 位朋友或同事
- 位于中国大陆不同城市，测试不同网络环境

**潜在用户（如果验证成功）：**
- 需要练习英语口语的学习者
- 无法访问 OpenAI API 的中国用户
- 希望简单使用 AI 语音对话的人群

---

## Goals and Success Metrics

### Business Objectives

**1-2 周内验证目标：**
- 成功部署到阿里云新加坡服务器
- 完成基本功能测试
- 确认技术方案可行性

**如果可行，下一步考虑：**
- 是否值得继续开发
- 需要什么额外功能
- 是否需要付费模式

### User Success Metrics

**验证阶段成功标准：**
- 能够从中国大陆正常访问
- 语音对话延迟 < 500ms
- 可以完成 5 分钟连续对话
- 无明显卡顿或中断

### Key Performance Indicators (KPIs)

**核心验证指标：**
1. **连接成功率**：能否建立 WebRTC 连接
2. **平均延迟**：< 500ms 为可接受
3. **稳定性**：5 分钟对话无中断
4. **成本**：OpenAI API 调用费用是否在预期范围内（< 1元/分钟对话）

---

## Strategic Alignment and Financial Impact

### Financial Impact

**验证阶段预算（1-2 周）：**
- 阿里云新加坡 ECS：最低配约 100-200 元/月
- OpenAI API 测试费用：50-100 元（个人测试使用）
- 域名（可选）：约 50 元/年
- **总计：200-350 元**

**如果继续开发的潜在成本：**
- 月运营成本：500-2000 元（服务器 + API 调用）
- 时间投入：业余时间开发和维护

### Company Objectives Alignment

**个人学习目标：**
- 实践 OpenAI Realtime API 新技术
- 了解跨境网络部署
- 验证一个简单的技术想法

### Strategic Initiatives

**Week 1：部署和基础测试**
1. 克隆开源项目
2. 部署到阿里云新加坡
3. 配置 OpenAI API Key
4. 本地测试功能正常

**Week 2：中国大陆访问测试**
1. 从国内不同网络环境测试
2. 测量延迟和稳定性
3. 记录问题和体验
4. 决定是否值得继续

---

## MVP Scope

### Core Features (Must Have)

**验证阶段（直接使用开源项目）：**
1. 基础语音对话功能（已有）
2. WebRTC 实时通信（已有）
3. 部署到可访问的服务器
4. 配置 OpenAI API

**完全不做：**
- 用户注册/登录
- 付费功能
- 数据统计
- 额外功能开发

### MVP Success Criteria

- 成功部署
- 能从中国访问
- 对话基本流畅
- 成本可控

---

## Post-MVP Vision

**如果验证成功，可能考虑：**
- 添加简单的用户系统
- 场景化对话模板
- 基础的使用时长统计
- 简单的付费墙

---

## Technical Considerations

### Platform Requirements

- Web 应用（已有）
- 阿里云新加坡 ECS
- HTTPS 支持
- 现代浏览器（Chrome/Edge/Safari）

### Technology Preferences

**完全使用开源项目的技术栈：**
- Next.js
- WebRTC
- OpenAI Realtime API
- Node.js

### Architecture Considerations

- 最简架构：单服务器部署
- 无数据库（验证阶段不需要）
- 直接转发 API 请求

---

## Constraints and Assumptions

### Constraints

- 个人项目，预算有限（< 500 元）
- 业余时间开发
- 仅验证技术可行性

### Key Assumptions

1. 阿里云新加坡到 OpenAI API 网络畅通
2. 国内到新加坡服务器延迟可接受
3. WebRTC 可以跨境正常工作
4. 开源项目代码质量可用

---

## Risks and Open Questions

### Key Risks

1. **网络延迟过高**：国内到新加坡可能延迟 > 500ms
2. **WebRTC 被阻断**：某些网络环境可能无法建立 WebRTC 连接
3. **成本超预期**：OpenAI API 调用费用可能比预期高
4. **开源项目有 bug**：可能需要调试和修复

### Open Questions

1. 国内不同运营商（移动/联通/电信）访问表现如何？
2. WebRTC 在国内是否需要 TURN 服务器？
3. 实际延迟能达到多少？
4. 5 分钟对话的 API 成本是多少？

### Areas Needing Further Research

- WebRTC 跨境最佳实践
- OpenAI Realtime API 定价计算
- 阿里云新加坡服务器性能
- 国内网络环境多样性测试

---

## Appendices

### A. Research Summary

无（验证阶段无需市场研究）

### B. Stakeholder Input

个人项目，无外部利益相关方

### C. References

**Initial Context (Step 1):**
- 开源项目基础：https://github.com/cameronking4/openai-realtime-api-nextjs.git
- 技术栈：OpenAI Realtime API + WebRTC + Next.js
- 核心问题：中国大陆用户无法直接访问 OpenAI API 和 ChatGPT 服务
- 解决策略：通过阿里云新加坡服务器作为中转，让国内用户间接访问 OpenAI 实时语音对话功能
- 目标用户：中国大陆的英语学习者
- 产品价值：无需用户自行配置代理即可使用实时 AI 语音对话进行英语学习

**Collaboration Mode (Step 2):** YOLO Mode - 快速生成完整草稿后迭代优化

---

_This Product Brief serves as the foundational input for Product Requirements Document (PRD) creation._

_Next Steps: Handoff to Product Manager for PRD development using the `workflow prd` command._
