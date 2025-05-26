import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Tabs } from 'expo-router';
import BottomNav from './comm/bottomNav';

export default function TabsLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkLoginStatus = async () => {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        console.log('토큰없음, 로그인화면 이동');
        setIsAuthenticated(false);
      } else {
        console.log('토큰 확인, 메인화면 이동');
        setIsAuthenticated(true);
      }
      setIsLoading(false); // 로딩 상태 업데이트
    };

    checkLoginStatus();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!isAuthenticated) {
    // 로그인되지 않은 경우 로그인 화면으로 이동
    return (
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' }, // 로그인 화면에서는 하단 탭 숨김
        }}
      >
        <Tabs.Screen name="users/login" options={{ title: 'Login' }} />
        <Tabs.Screen name="users/regist" options={{ title: 'Register' }} />
      </Tabs>
    );
  }

  return (
    <Tabs
      screenOptions={({ route }) => {
        // 숨길 탭 이름 배열에 'measure/camera' 추가
        const hiddenTabs = ['users/login', 'users/regist', 'measure/camera','family/familyRegist'];
        return {
          headerShown: false,
          //tabBarStyle: hiddenTabs.includes(route.name) ? { display: 'none' } : {},
        };
      }}
      tabBar={(props) => {
        const routeName = props.state?.routes[props.state.index]?.name ?? '';
        const hiddenTabs = ['users/login', 'users/regist', 'measure/camera','family/familyRegist'];
        return hiddenTabs.includes(routeName) ? null : <BottomNav {...props} />;
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="community/community" options={{ title: 'Community' }} />
      <Tabs.Screen name="schedule/schedule" options={{ title: 'Schedule' }} />
      <Tabs.Screen name="graph/graph" options={{ title: 'Graph' }} />
      <Tabs.Screen name="measure/camera" options={{ title: 'Camera' }} />
    </Tabs>
  );
}