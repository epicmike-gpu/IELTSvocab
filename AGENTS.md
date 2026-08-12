# Expo App + Express.js

## 目录结构规范（严格遵循）

当前仓库是一个 monorepo（基于 pnpm 的 workspace）

- Expo 代码在 client 目录，Express.js 代码在 server 目录
- 本模板默认无 Tab Bar，可按需改造

├── client/                     # React Native 前端代码
│   ├── app/                    # Expo Router 路由目录（仅路由配置）
│   │   ├── _layout.tsx         # 根布局文件（必需，务必阅读）
│   │   └── index.tsx           # 首页
│   ├── screens/                # 页面实现目录（与 app/ 路由对应）
│   │   └── demo/               # 示例页面
│   │       └── index.tsx
│   ├── components/             # 可复用组件
│   │   └── Screen.tsx          # 页面容器组件（必用）
│   ├── hooks/                  # 自定义 Hooks
│   ├── contexts/               # React Context 代码
│   ├── utils/                  # 工具函数
│   ├── assets/                 # 静态资源
|   └── package.json            # Expo 应用 package.json
├── server/                     # 服务端代码根目录 (Express.js)
|   ├── src/
│   │   └── index.ts            # 服务端入口文件
|   └── package.json            # 服务端 package.json
├── package.json
├── .cozeproj                   # 预置脚手架脚本（禁止修改）
└── .coze                       # 配置文件（禁止修改）

## 样式方案

基于 tailwindcss 进行样式开发（底层基于 Uniwind）

写法示例：

```tsx
<View className="flex-1 bg-white dark:bg-gray-900 p-4"></View>
```

```tsx
<Text
  className="text-lg font-bold text-gray-900 dark:text-white"
  selectionColorClassName="accent-blue-500"
>
  Hello World
</Text>
```

Uniwind 官方文档：https://docs.uniwind.dev/llms.txt

## 如何进行静态校验（TSC + ESLint）

```bash
# 对 client 和 server 目录同时进行校验
pnpm -w lint:all

# 对 client 目录进行校验
pnpm -w lint:client

# 对 server 目录进行校验
pnpm -w lint:server
```

## 如何修改主题模式（跟随系统、固定暗色、固定亮色）

默认为跟随系统，如果用户明确指定为“暗色”或“亮色”，需要修改 `client/components/ColorSchemeUpdater.tsx` 的 `DEFAULT_THEME` 变量为合适的值

## 如何定制主题 design tokens

当前项目的**设计系统**基于 tailwindcss 实现，核心入口文件为 `client/global.css`，如果需要定制主题，应该**阅读并修改 `client/global.css` 文件**

## 路由及 Tab Bar 实现规范

### 方案一：无 Tab Bar（Stack 导航）

适用于线性流程应用，采用简化的目录结构：

```
client/app/
├── _layout.tsx         # 根布局（Stack 导航配置）
├── index.tsx           # 应用入口
├── detail.tsx          # 详情页（通过 params 传递数据）
└── +not-found.tsx      # 404 页面
```

**根布局配置** `client/app/_layout.tsx`：

以下仅为代码片段供写法参考

```tsx
<Stack screenOptions={{ headerShown: false }}>
  <Stack.Screen name="index" />
  <Stack.Screen name="detail" />
</Stack>
```

**应用入口** `client/app/index.tsx`：
```tsx
export { default } from "@/screens/home";
```
> **禁止事项**：无 Tab Bar 场景下，不得创建 `(tabs)` 目录。

### 方案二：有 Tab Bar（Tabs 导航）

采用路由分组实现底部导航栏：
```
client/app/
├── _layout.tsx              # 根布局
├── (tabs)/
│   ├── _layout.tsx          # Tab 导航配置
│   ├── index.tsx            # 默认 Tab（必须存在）
│   ├── discover.tsx         # 发现页
│   └── profile.tsx          # 个人中心
├── detail.tsx               # Tab 外的独立页面（通过 params 传递数据）
└── +not-found.tsx
```
> **⚠️ [CRITICAL]**： `app/index.tsx` 优先级高于 `(tabs)/index.tsx`，会导致首页无 Tab Bar。**当有(tabs)/index.tsx时必须删除 `app/index.tsx`**。

**根布局配置** `client/app/_layout.tsx`：

以下仅为代码片段供写法参考

```tsx
<Stack screenOptions={{ headerShown: false }}>
  <Stack.Screen name="(tabs)" />
  <Stack.Screen name="detail" />
</Stack>
```

**应用入口** `client/app/(tabs)/index.tsx`：
```tsx
export { default } from "@/screens/home";
```

**Tab 布局配置** `client/app/(tabs)/_layout.tsx`：

```tsx
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome6 } from '@expo/vector-icons';
import { useCSSVariable } from 'uniwind';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const [background, muted, accent, border] = useCSSVariable([
    '--color-background',
    '--color-muted',
    '--color-accent',
    '--color-border',
  ]) as string[];

  let tabBarStyle = {
    backgroundColor: background,
    borderTopWidth: 1,
    borderTopColor: border,
  };

  // 用于修复 Web 上高度异常的问题（这个 if 逻辑必须添加）
  if (Platform.OS === 'web') {
    tabBarStyle = {
      ...tabBarStyle,
      height: 'auto',
    }
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarActiveTintColor: accent,
        tabBarInactiveTintColor: muted,
      }}
    >
      {/* name 必须与文件名完全一致 */}
      <Tabs.Screen
        name="index"
        options={{
          title: '首页',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="house" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: '发现',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="compass" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '我的',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="user" size={20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

**Tab 页面文件** `client/app/(tabs)/index.tsx`：
```tsx
export { default } from "@/screens/home";
```

### 注意事项

在改动 `client/app/_layout.tsx` 前，必须先阅读该文件，再进行修改操作

以下是需要保留的重要逻辑

- 保留 global.css 引入（tailwindcss 生效的关键）
- 保留 Provider 的使用

## 依赖管理与模块导入规范

### 依赖安装
**禁止**使用 `npm` 或 `yarn`，按目录区分安装命令：

| 目录 | 安装命令 | 说明 |
|------|----------|------|
| `client/` | `npx expo install <package>` | Expo 会自动选择与 SDK 兼容的版本 |
| `server/` | `pnpm add <package>` | 使用 pnpm 管理后端依赖 |

```bash
# client 目录（Expo 项目）
cd client && npx expo install expo-camera expo-image-picker

# server 目录（Express 项目）
cd server && pnpm add axios cors
```

**网络问题处理**：`npx expo install` 可能因网络原因失败，失败时重试 2 次，仍失败则改用 `pnpm add` 安装

## Expo 开发规范

### 路径别名

Expo 配置了 `@/` 路径别名指向 `client/` 目录：

```tsx
// 正确
import { Screen } from '@/components/Screen';

// 避免相对路径
import { Screen } from '../../../components/Screen';
```

## 本地开发

`coze dev`：用来首次启动前后端服务，也可以用来重启前后端服务（该命令会先尝试杀掉占用端口的进程，再启动服务）

## 项目概述

雅思单词学习 App，类似探探的卡片式交互。用户通过左右滑动卡片来标记"认识"或"不认识"，不认识的单词自动加入复习本。

## 路由结构

采用 Tabs 导航（3 个 Tab）：
- `(tabs)/index.tsx` → `screens/learn/index.tsx` — 学习页（卡片滑动）
- `(tabs)/review.tsx` → `screens/review/index.tsx` — 复习本
- `(tabs)/stats.tsx` → `screens/stats/index.tsx` — 学习统计

## 后端 API

所有 API 在 `server/src/index.ts`，前缀 `/api/v1`：
- `GET /api/v1/health` — 健康检查
- `GET /api/v1/word-lists` — 词库列表
- `GET /api/v1/words/batch?listId=&offset=&limit=` — 获取单词批次
- `POST /api/v1/words/generate` — 按需生成音标例句（仅 Coze 环境可用，见下）
- `GET /api/v1/learning/progress` — 学习进度统计（Supabase learning_records 表）
- `POST /api/v1/learning/record` — 记录认识/不认识
- `GET /api/v1/learning/review?listId=` — 复习本
- `DELETE /api/v1/learning/reset?listId=` — 重置进度

## 生产部署（Vercel + Supabase）

- 后端托管在 Vercel：`https://ielt-svocab.vercel.app`，项目 Root Directory = **仓库根目录**（Vercel 只认根目录的 `vercel.json` 和 `api/`，`server/` 下的同名文件无效）
- 根 `api/index.ts` 是 serverless 入口（含错误捕获包装）；根 `vercel.json` 把 `/api/*` rewrite 到函数，`includeFiles` 打包 `server/data/**` 词库 JSON
- **Vercel 逐文件转译为 ESM 且不打包**：server 代码里相对导入必须带 `.js` 扩展名，否则线上 ERR_MODULE_NOT_FOUND
- 静态文件在 `public/`（隐私政策页，App Store 审核用）；Vercel 控制台 Build/Output/Install 三个 Override 必须保持关闭
- Supabase（用户自建项目）：环境变量 `COZE_SUPABASE_URL` / `COZE_SUPABASE_ANON_KEY` 配在 Vercel；`learning_records` 表无外键、未开 RLS（匿名固定用户 anonymous-user）
- 词库数据已全量静态化：7,956 词的音标/例句全部预生成在 `server/data/*.json`（脚本 `server/scripts/batch-enrich.ts`，用 coze-coding-dev-sdk 在 Coze 环境跑；该 SDK 在 Vercel 不可用）
- serverless 下 `fs.writeFile` 写入是临时的，不要在 Vercel 上依赖运行时改 JSON
- 客户端生产后端地址由 `client/eas.json` 的 production profile 注入（`EXPO_PUBLIC_BACKEND_BASE_URL`）

## Apple IAP（已接入真实内购）

- `client/contexts/PurchaseContext.tsx`：iOS 用 expo-iap（StoreKit 2），web 预览保留模拟购买；expo-iap 无 web 实现，**必须动态 import 且只在 Platform.OS === 'ios' 时调用**
- expo-iap 的 requestPurchase 是事件型 API：结果走 purchaseUpdatedListener / purchaseErrorListener，context 里用 pendingRef Map 桥接成 Promise
- 4 个非消耗型商品（¥6）：ielts_sequential / ielts_random / ielts_frequency / ielts_root，已在 App Store Connect 创建
- 购买态持久化在 AsyncStorage（STORAGE_KEY=purchased_materials）；恢复购买走 getAvailablePurchases
- **IAP 无法在 web 预览测试**，必须 EAS Build 出真机包 + 沙盒测试账号验证

## 设计风格

柔和卡片风（新拟态），主色 #6C63FF，辅色 #FF6584，背景 #F0F0F3。详见 `DESIGN.md`。
