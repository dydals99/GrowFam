import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { API_URL } from '../../../constants/config';

export default function RegisterScreen() {
  const [userName, setUserName] = useState('');
  const [userNickname, setUserNickname] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [isNicknameValid, setIsNicknameValid] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    if (!isNicknameValid) {
      Alert.alert('Error', '닉네임 중복 확인이 필요합니다.');
      return;
    }
    if (!isEmailVerified) {
      Alert.alert('Error', '이메일 인증이 필요합니다.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_name: userName,
          user_nickname: userNickname,
          user_email: userEmail,
          user_password: userPassword,
          verification_code: verificationCode,
        }),
      });

      const data = await response.json();
      if (data.success) {
        Alert.alert('회원가입 성공, 세부 정보 입력 페이지로 이동합니다.');
        router.replace('../family/familyRegist');
      } else {
        Alert.alert('Error', data.message || '회원가입 실패.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', '회원가입 중 오류가 발생했습니다.');
    }
  };

  const checkNickname = async () => {
    try {
      const response = await fetch(`${API_URL}/users/check-nickname`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: userNickname }),
      });

      const data = await response.json();
      if (data.isValid) {
        setIsNicknameValid(true);
        Alert.alert('Success', '사용 가능한 닉네임입니다.');
      } else {
        setIsNicknameValid(false);
        Alert.alert('Error', '이미 사용 중인 닉네임입니다.');
      }
    } catch (error) {
      console.error('Nickname check error:', error);
      Alert.alert('Error', '닉네임 확인 중 오류가 발생했습니다.');
    }
  };

  const sendEmailVerification = async () => {
    try {
      const response = await fetch(`${API_URL}/users/send-email-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      });

      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', '인증 이메일이 전송되었습니다.');
      } else {
        Alert.alert('Error', '이메일 전송 실패.');
      }
    } catch (error) {
      console.error('Email verification error:', error);
      Alert.alert('Error', '이메일 전송 중 오류가 발생했습니다.');
    }
  };

  const verifyEmailCode = async () => {
    try {
      const response = await fetch(`${API_URL}/users/verify-email-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, code: verificationCode }),
      });

      const data = await response.json();
      if (data.success) {
        setIsEmailVerified(true);
        Alert.alert('Success', '이메일 인증 성공!');
      } else {
        Alert.alert('Error', '인증 코드가 올바르지 않습니다.');
      }
    } catch (error) {
      console.error('Email code verification error:', error);
      Alert.alert('Error', '이메일 인증 중 오류가 발생했습니다.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>회원 가입</Text>
      <Text style={styles.subtitle}>Welcome, GlowFam</Text>

      <View style={styles.inputWithButton}>
        <TextInput
          style={[styles.input, styles.inputFlex]}
          placeholder="Name"
          value={userName}
          onChangeText={setUserName}
          placeholderTextColor="#aaa"
        />
      </View>

      <View style={styles.inputWithButton}>
        <TextInput
          style={[styles.input, styles.inputFlex]}
          placeholder="Nickname"
          value={userNickname}
          onChangeText={setUserNickname}
          editable={!isNicknameValid}
          placeholderTextColor="#aaa"
        />
        <TouchableOpacity
          style={[styles.inlineButton, isNicknameValid && styles.disabledButton]}
          onPress={checkNickname}
          disabled={isNicknameValid}
        >
          <Text style={styles.inlineButtonText}>중복 확인</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputWithButton}>
        <TextInput
          style={[styles.input, styles.inputFlex]}
          placeholder="Email"
          value={userEmail}
          onChangeText={setUserEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#aaa"
        />
        <TouchableOpacity style={styles.inlineButton} onPress={sendEmailVerification}>
          <Text style={styles.inlineButtonText}>코드 전송</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputWithButton}>
        <TextInput
          style={[styles.input, styles.inputFlex]}
          placeholder="Verification Code"
          value={verificationCode}
          onChangeText={setVerificationCode}
          keyboardType="numeric"
          editable={!isEmailVerified}
          placeholderTextColor="#aaa"
        />
        <TouchableOpacity
          style={[styles.inlineButton, isEmailVerified && styles.disabledButton]}
          onPress={verifyEmailCode}
          disabled={isEmailVerified}
        >
          <Text style={styles.inlineButtonText}>코드 확인</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputWithButton}>
        <TextInput
          style={[styles.input, styles.inputFlex]}
          placeholder="Password"
          value={userPassword}
          onChangeText={setUserPassword}
          secureTextEntry
          placeholderTextColor="#aaa"
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>가입하기</Text>
      </TouchableOpacity>
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
  title: {
    fontSize: 28,
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
    height: 50,
    borderColor: '#ccc',
    borderRadius: 25,
    paddingHorizontal: 15,
    backgroundColor: '#f9f9f9',
    fontSize: 14,
    color: '#000',
  },
  inputWithButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 25,
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 15,
  },
  inputFlex: {
    flex: 1,
  },
  inlineButton: {
    marginLeft: 10,
    backgroundColor: '#28a745',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 25,
  },
  inlineButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#28a745',
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
  disabledButton: {
    backgroundColor: '#ccc',
  },
});