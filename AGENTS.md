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

**闪电劈卡交互**（`client/screens/learn/index.tsx`）：右滑"认识"触发劈卡动画。每第 10 张卡（`(globalIdx+1) % 10 === 0`）触发 **epic 大雷变体**：`thunder.wav`（1.6s 合成雷声：crack+低频滚动轰鸣）替代 `lightning.wav`、闪电 240 宽加粗带分叉（普通 150 宽 4 path / epic 6 path）、闪光双拍（0.9→0.35→0.75→0）、震屏幅度 ×2、两半飞散更远更慢（普通 430ms/±130，epic 640ms/±210，commit timer 660/920ms）。**渐隐机制：容器整体渐隐（containerOp）替代两半各自渐隐**——两半飞散消失后不会露出空白卡壳（批次末尾卡下面没有 under 卡，此前会露出空卡容器 300ms+）；新卡复用组件时 useEffect[word.id] 必须 reset containerOp=1。epic 分支由 `WordCard` 的 `epic` prop 控制（动画参数/声音/LightningBolt 共用）。音效单例模式：模块级变量 + `preloadXxxSound()`（mount 预加载）+ `playXxx()`（replayAsync），含 flip/thunder/achievement。

**完成页奖杯充能**（allDone 分支）：SVG 圆环（AnimatedCircle + useAnimatedProps 驱动 strokeDashoffset，周长 2π×40≈251.3）1.5s 从 0 充满，充满回调播放 `achievement.wav`（1.35s 上行琶音 C-E-G-C fanfare）+ 奖杯 spring 弹跳 + 光晕圈扩散（glowOp）。firedRef 防重复触发，allDone=false 时重置。

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

- **国内访问必须走自定义域名 `https://www.ieltsmobile.top`**：`*.vercel.app` 在国内被 SNI 阻断 + DNS 污染（Vercel 任播 IP 本身可达），App 直连 vercel.app 会永久转圈；域名已绑到同一 Vercel 项目，A 记录指向 76.76.21.21，无需备案
- 后端托管在 Vercel：`https://ielt-svocab.vercel.app`（仅海外可达，审核员用），项目 Root Directory = **仓库根目录**（Vercel 只认根目录的 `vercel.json` 和 `api/`，`server/` 下的同名文件无效）
- 根 `api/index.ts` 是 serverless 入口（含错误捕获包装）；根 `vercel.json` 把 `/api/*` rewrite 到函数，`includeFiles` 打包 `server/data/**` 词库 JSON
- **Vercel 逐文件转译为 ESM 且不打包**：server 代码里相对导入必须带 `.js` 扩展名，否则线上 ERR_MODULE_NOT_FOUND
- 静态文件在 `public/`（隐私政策页，App Store 审核用）；Vercel 控制台 Build/Output/Install 三个 Override 必须保持关闭
- Supabase（用户自建项目）：环境变量 `COZE_SUPABASE_URL` / `COZE_SUPABASE_ANON_KEY` 配在 Vercel；`learning_records` 表无外键、未开 RLS
- **学习数据按设备隔离**：客户端 `client/utils/deviceId.ts` 在安装时生成 UUID 存 AsyncStorage，所有学习相关请求（words/batch、learning/record|progress|review|reset）带 `x-device-id` header；服务端用它作 user_id（无 header 时回退 anonymous-user）。每台设备/每次安装 = 独立记录集，互不同步。改服务端后必须 push 触发 Vercel 部署才生效
- 词库数据已全量静态化：7,956 词的音标/例句全部预生成在 `server/data/*.json`（脚本 `server/scripts/batch-enrich.ts`，用 coze-coding-dev-sdk 在 Coze 环境跑；该 SDK 在 Vercel 不可用）
- serverless 下 `fs.writeFile` 写入是临时的，不要在 Vercel 上依赖运行时改 JSON
- 客户端生产后端地址由 `client/eas.json` 的 production profile 注入（`EXPO_PUBLIC_BACKEND_BASE_URL`）

## Apple IAP（已接入真实内购）

- `client/contexts/PurchaseContext.tsx`：iOS 用 expo-iap（StoreKit 2），web 预览保留模拟购买；expo-iap 无 web 实现，**必须动态 import 且只在 Platform.OS === 'ios' 时调用**
- expo-iap 的 requestPurchase 是事件型 API：结果走 purchaseUpdatedListener / purchaseErrorListener，context 里用 pendingRef Map 桥接成 Promise
- 4 个非消耗型商品（¥6）已在 ASC 创建且状态 READY_TO_SUBMIT。**ASC 真实商品 ID 与词库 id 不同**：顺序版=`com.mikelu.ieltsvocab.sequential`、乱序版=`com.mikelu.ieltsvocab.random`、词频版=`ielts_frequency`、词根版=`ielts_root`；PurchaseContext 的 `MaterialInfo.productId` 字段负责映射，词库 id 保持不变
- ASC API 注意：`/v1/apps/{id}/inAppPurchases` 返回的 UUID 是旧版 ID，与 v2 接口不通用；v2 数字 ID 走 `/v1/apps/{id}/inAppPurchasesV2` 获取
- 购买态持久化在 AsyncStorage（STORAGE_KEY=purchased_materials）；恢复购买走 getAvailablePurchases
- **IAP 无法在 web 预览测试**，必须 EAS Build 出真机包 + 沙盒测试账号验证
- **中文 IAP（2026-09 新增）**：词库 id=`chinese_core`（`server/data/chinese_core.json`，生成脚本 `server/scripts/generate-chinese.ts`，跑批用 `MAX_WORDS=2500 npx tsx scripts/generate-chinese.ts`，支持断点续跑/每 50 词 checkpoint）；productId=`com.mikelu.ieltsvocab.chinese`，名称「中文 2500 词（汉英版）」，¥6 非消耗型。字段映射零改卡片 UI：word=汉字 / phonetic=拼音 / meaning=英文释义 / example=中文例句 / exampleCn=英文翻译。**生成管线两大坑**：① coze-coding-dev-sdk 的 LLMClient 调用是 `client.invoke([{role,content},...], {model, temperature})` 位置参数（不是 chat.completions）；② 模型对超高频词倾向把 example 写成英文并丢 exampleEn，脚本内含 CJK 校验+带纠错反馈的重试，skip 率≈2%，重跑脚本即自动补齐。命名避开 HSK 商标（汉办注册，同 IELTS 道理）
- **ASC API 只开放 IAP 的列表/详情**（GET /v1/apps/{id}/inAppPurchases(V2)），创建/定价/本地化子路径全部 404——新建 IAP 必须手工在 ASC 网页操作

## EAS 构建与上架

- `client/app.config.ts` 的 `name` 必须保持纯 ASCII（`ieltsvocab`）：EAS 签名配置按 name 生成 Xcode target 名，CJK 字符被剥离后两边规则不一致，会报 "Could not find target 'xxx' in project.pbxproj"；设备显示名走 `ios.infoPlist.CFBundleDisplayName`（现为"闪词100分"，因商标合规改名）
- **EAS 会话不跨会话保留**（/root 在沙箱会话间重置）：构建需 `EXPO_TOKEN` 或让用户在本机跑 `eas build`；eas-cli 用 `npx eas-cli`（全局没装）
- 沙箱里跑 eas build/submit 必须清空 `COZE_PROJECT_ID`/`COZE_PROJECT_NAME`/`EXPO_PUBLIC_COZE_*` 环境变量，否则 slug 被解析成 `app<COZE_PROJECT_ID>` 与 EAS 项目不匹配
- 签名资产在 `client/credentials/`（gitignored）：dist.p12 密码在 `.p12-password`；p12 必须含 WWDR G3 中级证书且用 `openssl pkcs12 -export -legacy` 导出（macOS security 不认 OpenSSL 3 默认算法）
- **2026-09-04 签名凭证已轮换**：旧分发证书（serial 09D45802...）被 Apple 吊销导致构建失败；新证书 serial 17F5D2D59EA3871BA6DA546A7B94C863（ASC API id A2SC7Z2J6Z，有效期至 2027-09-04），新 profile GKB6MGN7V5（"ieltsvocab AppStore 2026-09"，有效期至 2027-09-04）。轮换方式：openssl 生成 CSR → ASC API POST /v1/certificates 签发 → attributes.profileContent 直接含 profile 内容（/v1/profiles/{id}/profileContent 端点在本 API 版本 404，勿用）→ pkcs12 -legacy 打包
- EAS 构建认证：EXPO_TOKEN 由用户在对话中提供，按次临时注入命令行，不落盘。ASC API JWT 必须带 `'aud':'appstoreconnect-v1'` 声明，否则 401
- ASC API 私钥 `client/AuthKey_QG9DS2MQDM.p8`（gitignored）；ASC App ID 6799824519；EAS projectId 9c888b19-d938-4d6a-bce9-37e98f9888ee
- App 无登录系统：App Store / TestFlight 表单里的 "Sign-in required" 一律不勾

## OTA 热更新工作流（2026-09 接入 expo-updates）

- **用户高频迭代 UI/词表排序的正式渠道是 OTA，不是每次 EAS 构建**：JS 层改动（组件、样式、逻辑、文案）→ 提交后 `env -u COZE_* EXPO_TOKEN=... npx eas-cli update --branch production -m "msg"` 秒级推送，用户 TestFlight 杀 App 重开即见真机效果
- 基础设施：expo-updates 插件 + `"runtimeVersion": { "policy": "appVersion" }`（app.config.ts）+ production profile `"channel": "production"`（eas.json）+ `updates.url`（app.config.ts，必填）；1.0.17(17) 是第一个真正具备 OTA 的包
- **⚠️ 1.0.15 及之前无 OTA 模块，1.0.16(16) 的 Expo.plist 里 EXUpdatesEnabled=False（构建时缺 updates.url 导致插件显式禁用），都是哑包，永远收不到 update，勿再向其推 update**
- **OTA 排障标准路径**：① 查 update 是否在服务器（`eas update:list --branch production --platform ios`）；② 查 channel→branch 映射（`eas channel:list --json` 看 branchMapping，`data` 数组为空 = 死路）；③ 解包 IPA 查 `Payload/<app>.app/Expo.plist`（注意：是 .app 根目录的 Expo.plist，不是 Info.plist 也不是 Supporting/ 路径；SDK 54 expo-updates v29 用 Expo.plist 的 EXUpdatesEnabled/EXUpdatesURL/EXUpdatesRequestHeaders(expo-channel-name)/EXUpdatesRuntimeVersion），可用 HTTP Range 只下载 zip 中央目录+目标条目（IPA 几十 MB，直接下载会超时）；④ expo config --type prebuild 本地比对
- **⚠️ EAS 构建自动创建的 channel 不自动建映射（2026-09-12 实锤的 OTA 永不生效根因）**：channel `production` 的 branchMapping 是 `{"data":[],"version":0}`——设备请求永远 404。修复：`npx eas-cli channel:edit production --branch production --non-interactive`（幂等，重跑无害）。**每次新 channel 或首次 OTA 推送前必须验证映射非空**
- **manifest 端点验证（模拟设备请求）**：真实请求 URL = **`https://u.expo.dev/{projectId}`（updateUrl 根路径，无 /manifests、无 /projects/ 前缀）**；必需头（抄自 expo-updates v29 源码 FileDownloader.swift/kotlin）：`expo-platform: ios`、`expo-runtime-version: 1.0.2`、`expo-protocol-version: 1`、`expo-api-version: 1`、`expo-updates-environment: BARE`、`expo-json-error: true`、`eas-client-id: <uuid>`、`Accept: multipart/mixed,application/expo+json,application/json` + plist 里的 `expo-channel-name: production`。返回 200 + multipart manifest（含 launchAsset url）即通道打通；`/update/{updateId}` permalink 可单验 update 资产可达性
- 1.0.17(17) 内置启动自动应用更新逻辑（app/_layout.tsx：checkForUpdateAsync → fetchUpdateAsync → reloadAsync），**用户杀一次 App 即生效**，无需杀两次
- **需要重新 EAS 构建的场景**：原生依赖增删、图标/启动图、app.config 权限/插件变更、runtimeVersion 变化（即 version bump 也会切断旧 OTA 兼容）；构建后 buildNumber 手动 +1（已移除 autoIncrement——它与 app.config.ts 动态配置不兼容报错）
- **⚠️ OTA 打包丢 EXPO_PUBLIC_ 环境变量（2026-09-13 实锤，症状=词表全部消失）**：Metro 缓存 key 不含 `EXPO_PUBLIC_*` env——沙箱里 dev 编译过（无该变量）后，eas update 本地跑 export 会命中脏缓存，bundle 里 `process.env.EXPO_PUBLIC_BACKEND_BASE_URL` 被内联成 `''`，真机 fetch 相对路径必败 → lists 空 → stats 页词表卡片全不渲染。推送前必须 `rm -rf /tmp/metro-cache /tmp/metro-file-map-*` 且命令行显式 `EXPO_PUBLIC_BACKEND_BASE_URL=... npx eas-cli update ...`。代码兜底：BASE_URL 统一收口在 `client/utils/backend.ts`（`env || (__DEV__ ? '' : 'https://www.ieltsmobile.top')`），即使 env 再丢，生产包也永远指向生产 API。**验证 bundle 是否含域名**：下载 export 的 .hbc 后 `python3 -c "print(open(f,'rb').read().count(b'ieltsmobile'))"`（grep/strings 对 Hermes 字节码不可靠）
- eas update 前确认本地未提交的 JS 改动就是要发的；发错可用 `eas update:republish --branch production` 回滚到上一组
- 沙箱无全局 eas-cli：一律 `npx eas-cli`，且必须 `env -u COZE_PROJECT_ID -u COZE_PROJECT_NAME -u EXPO_PUBLIC_COZE_PROJECT_ID -u EXPO_PUBLIC_COZE_PROJECT_NAME EXPO_TOKEN=...` 前缀

## 商标合规（2026-09 审核 4.1(a) 整改）

- **IELTS/雅思 是 British Council/IDP/Cambridge 注册商标，个人无法获得授权**：App Store 元数据与 App 内可见文案一律不得出现"雅思/IELTS"，否则 4.1(a) Copycats 拒审
- 品牌已改名：**闪词100分**（CFBundleDisplayName、登录页标题）；ASC 商店名称需同步在 App Information 改，bundle ID `com.mikelu.ieltsvocab` 不可改也不构成元数据
- 词库名统一"完整 8000 词（顺序版/乱序版/词频排序版/词根归类版）"：server/data/*.json（线上来源）、PurchaseContext MATERIALS、ASC IAP Display Name 三处必须保持一致（审核员靠名称匹配 IAP 与 App 内入口）
- 隐私政策 public/index.md 已同步设备隔离架构（匿名 Device ID 存服务端），不要再写"数据仅存本地"
- 中国大陆上架需 NPPA 网络出版服务许可证（个人无法办理），已选路线：**移除中国大陆销售范围**，销售范围在 ASC"价格与销售范围"的 Availability 区块配置

## 设计风格

柔和卡片风（新拟态），主色 #6C63FF，辅色 #FF6584，背景 #F0F0F3。详见 `DESIGN.md`。
