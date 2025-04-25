import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { API_URL } from '../../../constants/config';

export default function RegisterScreen() {
  const [userName, setUserName] = useState('');
  const [userNickname, setUserNickname] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [isNicknameValid, setIsNicknameValid] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const router = useRouter();

  const validatePassword = (password: string) => {
    const regex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    return regex.test(password);
  };

  const handlePasswordChange = (password: string) => {
    setUserPassword(password);
    setIsPasswordValid(validatePassword(password));
  };
  //`${API_URL}/gallery/latest-photo` /users/check-nickname
  const checkNickname = async () => {
    try {
      console.log('Checking nickname:', userNickname); // 디버깅 로그 추가
      const response = await fetch(`${API_URL}/users/check-nickname`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: userNickname }),
      });

      if (!response.ok) {
        console.error('API 요청 실패:', response.status, response.statusText);
        Alert.alert('Error', '앱을 재실행 후 다시 해보세요.');
        return;
      }

      const data = await response.json();
      console.log('API 응답 데이터:', data);

      if (data.isValid) {
        setIsNicknameValid(true);
        Alert.alert('사용할 수 있는 닉네임 입니다.');
        // 닉네임 중복 확인 버튼 비활성화
        setIsNicknameValid(true);
      } else {
        setIsNicknameValid(false);
        Alert.alert('사용할 수 없는 닉네임 입니다.\n 다시 입력하세요.');
      }
    } catch (error) {
      console.error('API 요청 중 오류 발생:', error);
      Alert.alert('Error', '앱을 재실행 후 다시 해보세요.');
    }
  };

  const sendEmailVerification = async () => {
    try {
      const response = await fetch(`${API_URL}/users/send-email-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      });
  
      if (!response.ok) {
        Alert.alert('Error', 'Failed to send verification email.');
        return;
      }
  
      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', 'Verification email sent. Please check your inbox.');
      }
    } catch (error) {
      console.error('Error sending email verification:', error);
      Alert.alert('Error', 'An error occurred while sending the verification email.');
    }
  };
  
  const verifyEmailCode = async () => {
    try {
      const response = await fetch(`${API_URL}/users/verify-email-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, code: verificationCode }),
      });
  
      if (!response.ok) {
        Alert.alert('Error', 'Email verification failed.');
        return;
      }
  
      const data = await response.json();
      if (data.success) {
        setIsEmailVerified(true);
        Alert.alert('Success', 'Email verified successfully.');
      }
    } catch (error) {
      console.error('Error verifying email:', error);
      Alert.alert('Error', 'An error occurred while verifying the email.');
    }
  };

  const handleRegister = async () => {
    if (!isNicknameValid) {
      Alert.alert('Error', 'Please validate your nickname.');
      return;
    }
    if (!isEmailVerified) {
      Alert.alert('Error', 'Please verify your email.');
      return;
    }
    if (!isPasswordValid) {
      Alert.alert('Error', 'Password must be at least 8 characters long and include letters, numbers, and special characters.');
      return;
    }

    // API 호출로 회원가입 요청
    const response = await fetch(`${API_URL}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_name: userName,
        user_nickname: userNickname,
        user_email: userEmail,
        user_password: userPassword,
        verification_code: verificationCode, // 인증 코드 추가
      }),
    });
    const data = await response.json();
    if (data.success) {
      Alert.alert('Success', 'Registration successful!');
      router.replace('./login');
    } else {
      Alert.alert('Error', data.message || 'Registration failed.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>회원가입</Text>

      <TextInput
        style={styles.input}
        placeholder="이름"
        value={userName}
        onChangeText={setUserName}
      />

      <TextInput
        style={[styles.input, isNicknameValid && styles.disabledInput]}
        placeholder="닉네임"
        value={userNickname}
        onChangeText={setUserNickname}
        editable={!isNicknameValid} // 닉네임이 유효하면 비활성화
      />
      <TouchableOpacity style={styles.button} onPress={checkNickname}>
        <Text style={styles.buttonText}>닉네임 중복 확인</Text>
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="이메일"
        value={userEmail}
        onChangeText={setUserEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TouchableOpacity style={styles.button} onPress={sendEmailVerification}>
        <Text style={styles.buttonText}>이메일 인증</Text>
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="인증번호"
        value={verificationCode}
        onChangeText={setVerificationCode}
        keyboardType="numeric"
        editable={!isEmailVerified} // 이메일 인증 완료 시 비활성화
      />
      <TouchableOpacity
        style={[styles.button, isEmailVerified && styles.disabledButton]}
        onPress={verifyEmailCode}
        disabled={isEmailVerified} // 이메일 인증 완료 시 버튼 비활성화
      >
        <Text style={styles.buttonText}>인증번호 확인</Text>
      </TouchableOpacity>

      <TextInput
        style={[
          styles.input,
          isPasswordValid ? styles.validInput : styles.invalidInput,
        ]}
        placeholder="비밀번호"
        value={userPassword}
        onChangeText={handlePasswordChange}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>회원가입</Text>
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  validInput: {
    borderColor: 'green',
  },
  invalidInput: {
    borderColor: 'red',
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#007BFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledInput: {
    backgroundColor: '#f0f0f0',
    borderColor: '#ccc',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
});