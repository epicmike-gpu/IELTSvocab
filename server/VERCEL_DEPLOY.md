# Vercel 部署指南

## 快速部署

```bash
cd /workspace/projects/server
chmod +x deploy-vercel.sh
./deploy-vercel.sh
```

或手动步骤：

### 1. 安装 Vercel CLI
```bash
npm i -g vercel
```

### 2. 登录 Vercel
```bash
cd /workspace/projects/server
vercel login
```

### 3. 构建并部署
```bash
pnpm build
vercel --prod
```

### 4. 设置环境变量
在 Vercel 控制台 → Settings → Environment Variables 添加：
- `SUPABASE_URL` - Supabase 项目 URL
- `SUPABASE_ANON_KEY` - Supabase 匿名密钥
- `COZE_API_KEY` - Coze LLM API 密钥（如果使用）

## ⚠️ 重要限制

**Vercel Serverless 的文件系统是临时的**，这意味着：
- ✅ 读取 `data/*.json` 文件正常（打包进部署）
-  写入 `data/*.json` 文件会丢失（冷启动后重置）

**影响：**
- `POST /api/v1/words/generate` 生成的音标/例句**无法持久保存**
- 每次冷启动后，未保存到数据库的生成数据会丢失

**解决方案（按推荐排序）：**

### 方案 A：迁移到 Supabase（推荐）
将单词数据迁移到 Supabase 数据库，彻底解决持久化问题。

### 方案 B：接受限制
- 生成数据仅保存在内存中
- 用户每次学习时重新生成（有缓存机制，不会重复生成）
- 适合低频使用场景

### 方案 C：使用 Vercel KV
- 额外付费（$1.5/月起）
- 适合需要持久化的键值数据

## 当前建议

**先用方案 B 部署上线**，验证 App 功能正常。后续根据用户量再决定是否迁移到 Supabase。

## 部署后：更新客户端 API 地址

部署成功后，Vercel 会给你一个域名（如 `https://ielts-vocab-server.vercel.app`）。

### 方法 1：更新 app.config.ts
```typescript
// client/app.config.ts
export default {
  // ...
  extra: {
    EXPO_PUBLIC_BACKEND_BASE_URL: 'https://your-app.vercel.app',
  },
};
```

### 方法 2：使用 Expo EAS 环境变量
```bash
cd /workspace/projects/client
eas secret:create --scope project --name EXPO_PUBLIC_BACKEND_BASE_URL --value https://your-app.vercel.app
```

然后重新构建 App：
```bash
eas build --platform ios
```

## 测试部署

```bash
# 测试健康检查
curl https://your-app.vercel.app/api/v1/health

# 测试词表 API
curl https://your-app.vercel.app/api/v1/words/batch?listId=core&offset=0&limit=5
```
