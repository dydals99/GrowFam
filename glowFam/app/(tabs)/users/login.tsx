import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { API_URL } from '../../../constants/config';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAutoLogin, setIsAutoLogin] = useState(false); // 자동 로그인 상태
  const router = useRouter();

  // 앱 실행 시 자동 로그인 처리
  useEffect(() => {
    (async () => {
      const autoLogin = await AsyncStorage.getItem('auto_login');
      if (autoLogin === 'true') {
        const token = await AsyncStorage.getItem('access_token');
        const userNo = await AsyncStorage.getItem('user_no');
        if (token && userNo) {
          console.log('자동 로그인 성공:', userNo);
          router.push('/'); // 홈 화면으로 이동
        }
      }
    })();
  }, []);

  const handleLogin = async () => {
    
    if (!email || !password) {
      Alert.alert('Error', '아이디 혹은 비밀번호가 틀렸습니다.');
      return;
  }

    try {
      const response = await fetch(`${API_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        Alert.alert('Error', errorData.detail || 'Login failed');
        return;
      }

      const data = await response.json();
      console.log('Login API Response:', data); // 응답 데이터 확인

      if (!data.user_no) {
        console.error('user_no is missing in the API response');
        Alert.alert('Error', '로그인 응답에 문제가 있습니다.');
        return;
      }

      await AsyncStorage.setItem('access_token', data.access_token); // JWT 토큰 저장
      await AsyncStorage.setItem('user_no', data.user_no.toString()); // user_no 저장

      if (isAutoLogin) {
        await AsyncStorage.setItem('auto_login', 'true'); // 자동 로그인 상태 저장
      } else {
        await AsyncStorage.removeItem('auto_login'); // 자동 로그인 상태 제거
      }

      Alert.alert('Success', 'Login successful!');
      router.push('/'); // 올바른 경로로 수정
    } catch (error) {
      console.log('Failed to log in:', error);
      Alert.alert('로그인 실패 했습니다.');
    }
  };

  return (
    <View style={styles.container}>
      {/* 프로필 이미지 */}
      <Image
        style={styles.profileImage}
      />

      {/* 제목 */}
      <Text style={styles.title}>GrowFam</Text>
      <Text style={styles.subtitle}>로그인 후 이용가능</Text>

      {/* 이메일 입력 */}
      <TextInput
        style={styles.input}
        placeholder="EMAIL"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor="#aaa"
      />

      {/* 비밀번호 입력 */}
      <TextInput
        style={styles.input}
        placeholder="PASSWORD"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor="#aaa"
      />

      {/* 자동 로그인 스위치 */}
      <View style={styles.checkboxContainer}>
        <Switch
          value={isAutoLogin}
          onValueChange={setIsAutoLogin}
        />
        <Text style={styles.checkboxLabel}>자동 로그인</Text>
      </View>

      {/* 로그인 버튼 */}
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>로그인</Text>
      </TouchableOpacity>

      {/* 회원가입, ID/PW 찾기기 */}
      <View style={styles.footerWrap}>
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>계정이 없으신가요? </Text>
          <TouchableOpacity onPress={() => router.push('./regist')}>
            <Text style={styles.footerLink}>회원가입</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>ID/PW를 잊으셨나요? </Text>
          <TouchableOpacity onPress={() => { router.push('./findUser')}}>
            <Text style={styles.findLink}>ID/PW 찾기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 30,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 25,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
    fontSize: 14,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#b7d6bb',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // 스타일에 아래 추가
  footerWrap: {
    width: '100%',
    marginTop: 20,
    alignItems: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  footerText: {
    fontSize: 14,
    color: '#888',
  },
  footerLink: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: 'bold',
  },
  findContainer: {
    flexDirection: 'row',
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  findLink: {
    fontSize: 14,
    color: '#007bff',
    fontWeight: 'bold',
},
});