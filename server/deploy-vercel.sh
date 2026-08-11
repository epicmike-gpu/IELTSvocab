#!/bin/bash
# Vercel 一键部署脚本

set -e

echo "=== IELTS Vocab Server - Vercel 部署 ==="

# 1. 构建
echo "1/4 构建项目..."
pnpm build

# 2. 检查 Vercel CLI
if ! command -v vercel &> /dev/null; then
  echo "2/4 安装 Vercel CLI..."
  npm i -g vercel
else
  echo "2/4 Vercel CLI 已安装"
fi

# 3. 登录
echo "3/4 登录 Vercel..."
vercel login

# 4. 部署
echo "4/4 部署到生产环境..."
vercel --prod

echo ""
echo "=== 部署完成 ==="
echo "请在 Vercel 控制台设置环境变量："
echo "  - SUPABASE_URL"
echo "  - SUPABASE_ANON_KEY"
echo "  - COZE_API_KEY (如果使用 Coze LLM)"
echo ""
echo "部署后记得更新 client/app.config.ts 中的 EXPO_PUBLIC_BACKEND_BASE_URL"
