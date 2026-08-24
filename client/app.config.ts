import { ExpoConfig, ConfigContext } from 'expo/config';

// name 必须保持纯 ASCII（EAS 签名配置按 name 生成 Xcode target 名，CJK 会导致 target 不匹配）
// 设备上的显示名通过 ios.infoPlist.CFBundleDisplayName 单独指定
const appName = process.env.COZE_PROJECT_NAME || process.env.EXPO_PUBLIC_COZE_PROJECT_NAME || 'ieltsvocab';
const projectId = process.env.COZE_PROJECT_ID || process.env.EXPO_PUBLIC_COZE_PROJECT_ID;
const slugAppName = projectId ? `app${projectId}` : 'ielts-vocabulary';

export default ({ config }: ConfigContext): ExpoConfig => {
  return {
    ...config,
    "name": appName,
    "slug": slugAppName,
    "version": "1.0.1",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "myapp",
    "userInterfaceStyle": "automatic",
    "owner": "mikelu332",
    "extra": {
      "eas": {
        "projectId": "9c888b19-d938-4d6a-bce9-37e98f9888ee"
      }
    },
    "newArchEnabled": true,
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.mikelu.ieltsvocab",
      "buildNumber": "1.0.0",
      "infoPlist": {
        "CFBundleDisplayName": "雅思词汇100分",
        "ITSAppUsesNonExemptEncryption": false
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": `com.anonymous.x${projectId || '0'}`
    },
    "web": {
      "bundler": "metro",
      "output": "single",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      process.env.EXPO_PUBLIC_BACKEND_BASE_URL ? [
        "expo-router",
        {
          "origin": process.env.EXPO_PUBLIC_BACKEND_BASE_URL
        }
      ] : 'expo-router',
      "expo-iap",
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#ffffff"
        }
      ],
      [
        "expo-image-picker",
        {
          "photosPermission": `允许雅思单词App访问您的相册，以便您上传或保存图片。`,
          "cameraPermission": `允许雅思单词App使用您的相机，以便您直接拍摄照片上传。`,
          "microphonePermission": `允许雅思单词App访问您的麦克风，以便您拍摄带有声音的视频。`
        }
      ],
      [
        "expo-location",
        {
          "locationWhenInUsePermission": `雅思单词App需要访问您的位置以提供周边服务及导航功能。`
        }
      ],
      [
        "expo-camera",
        {
          "cameraPermission": `雅思单词App需要访问相机以拍摄照片和视频。`,
          "microphonePermission": `雅思单词App需要访问麦克风以录制视频声音。`,
          "recordAudioAndroid": true
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
