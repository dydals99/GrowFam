import React, { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

const AuthMiddleware = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        router.replace('./(tabs)/users/login');
      }
    };

    checkAuth();
  }, [router]);

  return <>{children}</>;
};

export default AuthMiddleware;