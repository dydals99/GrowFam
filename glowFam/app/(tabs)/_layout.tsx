import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Tabs } from 'expo-router';
import BottomNav from './comm/bottomNav';

export default function TabsLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkLoginStatus = async () => {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        console.log('No token found');
        setIsLoading(false); // 로딩 상태 업데이트
      } else {
        console.log('Token found, loading main screen');
        setIsLoading(false); // 로딩 완료
      }
    };

    if (isLoading) {
      checkLoginStatus();
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  const token = AsyncStorage.getItem('access_token');
  if (!token) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>로그인이 필요합니다.</Text>
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={({ route }) => {
        const hiddenTabs = ['users/login', 'users/regist'];
        return {
          headerShown: false,
          tabBarStyle: hiddenTabs.includes(route.name) ? { display: 'none' } : {},
        };
      }}
      tabBar={(props) => {
        const routeName = props.state?.routes[props.state.index]?.name ?? '';
        const hiddenTabs = ['users/login', 'users/regist'];
        return hiddenTabs.includes(routeName) ? null : <BottomNav {...props} />;
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="community/community" options={{ title: 'Community' }} />
      <Tabs.Screen name="schedule/schedule" options={{ title: 'Schedule' }} />
      <Tabs.Screen name="graph/graph" options={{ title: 'Graph' }} />
      <Tabs.Screen name="users/login" options={{ title: 'Login' }} />
      <Tabs.Screen name="users/regist" options={{ title: 'Register' }} />
    </Tabs>
  );
}
