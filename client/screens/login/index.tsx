import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { FontAwesome6 } from '@expo/vector-icons';

export default function LoginScreen() {
  const { login, sendCode } = useAuth();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const codeInputRef = useRef<TextInput>(null);

  const isValidPhone = /^1[3-9]\d{9}$/.test(phone);

  const handleSendCode = async () => {
    if (!isValidPhone) {
      Alert.alert('提示', '请输入正确的手机号');
      return;
    }

    setIsSending(true);
    const success = await sendCode(phone);
    setIsSending(false);

    if (success) {
      Alert.alert('提示', '验证码已发送（测试模式：请查看服务器日志获取验证码）');
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      codeInputRef.current?.focus();
    } else {
      Alert.alert('错误', '发送验证码失败，请稍后重试');
    }
  };

  const handleLogin = async () => {
    if (!isValidPhone) {
      Alert.alert('提示', '请输入正确的手机号');
      return;
    }

    if (!code || code.length !== 6) {
      Alert.alert('提示', '请输入6位验证码');
      return;
    }

    setIsLoggingIn(true);
    const success = await login(phone, code);
    setIsLoggingIn(false);

    if (!success) {
      Alert.alert('错误', '登录失败，请检查手机号和验证码');
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-6">
          {/* Logo and Title */}
          <View className="items-center mb-12">
            <View className="w-20 h-20 bg-primary/10 rounded-3xl items-center justify-center mb-4">
              <FontAwesome6 name="book-open" size={36} color="#6C63FF" />
            </View>
            <Text className="text-2xl font-bold text-foreground">闪词100分</Text>
            <Text className="text-sm text-muted mt-2">登录后同步学习进度</Text>
          </View>

          {/* Phone Input */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-2">手机号</Text>
            <View className="flex-row items-center bg-surface rounded-2xl px-4 py-3 border border-border">
              <FontAwesome6 name="mobile-screen" size={18} color="#9CA3AF" />
              <TextInput
                className="flex-1 ml-3 text-base text-foreground"
                placeholder="请输入手机号"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                maxLength={11}
                value={phone}
                onChangeText={setPhone}
              />
            </View>
          </View>

          {/* Code Input */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-foreground mb-2">验证码</Text>
            <View className="flex-row items-center bg-surface rounded-2xl px-4 py-3 border border-border">
              <FontAwesome6 name="shield-halved" size={18} color="#9CA3AF" />
              <TextInput
                ref={codeInputRef}
                className="flex-1 ml-3 text-base text-foreground"
                placeholder="请输入验证码"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                maxLength={6}
                value={code}
                onChangeText={setCode}
              />
              <TouchableOpacity
                onPress={handleSendCode}
                disabled={isSending || countdown > 0 || !isValidPhone}
                className={`ml-2 px-3 py-1.5 rounded-lg ${
                  isSending || countdown > 0 || !isValidPhone
                    ? 'bg-gray-200'
                    : 'bg-primary/10'
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    isSending || countdown > 0 || !isValidPhone
                      ? 'text-gray-400'
                      : 'text-primary'
                  }`}
                >
                  {isSending ? '发送中...' : countdown > 0 ? `${countdown}s` : '获取验证码'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={isLoggingIn || !isValidPhone || !code}
            className={`py-4 rounded-2xl items-center ${
              isLoggingIn || !isValidPhone || !code ? 'bg-gray-300' : 'bg-primary'
            }`}
          >
            <Text className="text-white text-base font-semibold">
              {isLoggingIn ? '登录中...' : '登录'}
            </Text>
          </TouchableOpacity>

          {/* Hint */}
          <View className="mt-6 p-4 bg-accent/50 rounded-2xl">
            <Text className="text-xs text-muted text-center">
              测试模式：验证码请查看服务器日志
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
