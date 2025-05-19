import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { API_URL } from '../../../constants/config';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const [userName, setUserName] = useState('');
  const [userNickname, setUserNickname] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [isNicknameValid, setIsNicknameValid] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isPhoneValid, setIsPhoneValid] = useState(false);

  const router = useRouter();

  const handleRegister = async () => {
    if (!isNicknameValid) {
      Alert.alert('Error', '닉네임 중복 확인이 필요합니다.');
      return;
    }
    if (!isPhoneValid) {
      Alert.alert('Error', '전화번호 중복 확인이 필요합니다.');
      return;
    }
    if (!isEmailVerified) {
      Alert.alert('Error', '이메일 인증이 필요합니다.');
      return;
    }
    // familyRegist로 회원가입 정보 전달
    router.replace({
      pathname: '/family/familyRegist',
      params: {
        user_name: userName,
        user_nickname: userNickname,
        user_email: userEmail,
        user_password: userPassword,
        user_phone: userPhone,
      }
    });
  };

  const checkPhone = async () => {
    if (!userPhone) {
      Alert.alert('전화번호를 입력하세요.');
      return;
    }
    // 전화번호 11자리, 010으로 시작하는지 체크
    if (!/^010\d{8}$/.test(userPhone)) {
      Alert.alert('전화번호는 010으로 시작하는 11자리 숫자여야 합니다.');
      return;
    }
    try {
      const response = await fetch(`${API_URL}/users/check-phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: userPhone }),
      });
      const data = await response.json();
      if (data.isValid) {
        setIsPhoneValid(true);
        Alert.alert('사용 가능한 전화번호입니다.');
      } else {
        setIsPhoneValid(false);
        Alert.alert('이미 사용 중인 전화번호입니다.');
      }
    } catch (error) {
      Alert.alert('전화번호 확인 중 오류가 발생했습니다.');
    }
  };

  const checkNickname = async () => {
    if (!userNickname) {
      Alert.alert('닉네임을 입력하세요.');
      return;
    }
    if (userNickname.length < 2) {
      Alert.alert('닉네임은 두 글자 이상이어야 합니다.');
      return;
    }
    // 동일 문자 반복(예: ㅇㅇㅇ, ㅅㅅㅅ 등) 방지
    if (/^([ㄱ-ㅎ가-힣a-zA-Z0-9])\1+$/.test(userNickname)) {
      Alert.alert('동일한 문자를 반복한 닉네임은 사용할 수 없습니다.');
      return;
    }
    try {
      const response = await fetch(`${API_URL}/users/check-nickname`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: userNickname }),
      });

      const data = await response.json();
      if (data.isValid) {
        setIsNicknameValid(true);
        Alert.alert('사용 가능한 닉네임입니다.');
      } else {
        setIsNicknameValid(false);
        Alert.alert('이미 사용 중인 닉네임입니다.');
      }
    } catch (error) {
      console.error('Nickname check error:', error);
      Alert.alert('닉네임 확인 중 오류가 발생했습니다.');
    }
  };

  const sendEmailVerification = async () => {
    // 1. 이메일 중복 체크
    try {
      const checkRes = await fetch(`${API_URL}/users/check-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      });
      const checkData = await checkRes.json();
      if (!checkData.isValid) {
        Alert.alert('이미 사용 중인 이메일입니다.');
        return;
      }
    } catch (error) {
      Alert.alert('이메일 중복 확인 중 오류가 발생했습니다.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/users/send-email-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      });

      const data = await response.json();
      if (data.success) {
        Alert.alert('인증 이메일이 전송되었습니다.');
      } else {
        Alert.alert('이메일 전송 실패.');
      }
    } catch (error) {
      console.log('Email verification error:', error);
      Alert.alert('이메일 전송 중 오류가 발생했습니다.');
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
        Alert.alert('이메일 인증 성공!');
      } else {
        Alert.alert('인증 코드가 올바르지 않습니다.');
      }
    } catch (error) {
      console.log('Email code verification error:', error);
      Alert.alert('이메일 인증 중 오류가 발생했습니다.');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
        activeOpacity={0.7}>
        <Ionicons name="arrow-back" size={28} color="#333" />
      </TouchableOpacity>
      <Text style={styles.title}>회원 가입</Text>
      <Text style={styles.subtitle}>Welcome, GrowFam</Text>

      <View style={styles.inputWithButton}>
        <TextInput
          style={[styles.input, styles.inputFlex]}
          placeholder="이름"
          value={userName}
          onChangeText={setUserName}
          placeholderTextColor="#aaa"
        />
      </View>
      <View style={styles.inputWithButton}>
        <TextInput
          style={[styles.input, styles.inputFlex]}
          placeholder="닉네임"
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
          placeholder='전화번호 "-" 빼고 입력해주세요.'
          value={userPhone}
          onChangeText={text => {
            setUserPhone(text);
            setIsPhoneValid(false); // 값이 바뀌면 다시 중복확인 필요
          }}
          keyboardType="phone-pad"
          placeholderTextColor="#aaa"
          editable={!isPhoneValid}
        />
        <TouchableOpacity
          style={[styles.inlineButton, isPhoneValid && styles.disabledButton]}
          onPress={checkPhone}
          disabled={isPhoneValid}
        >
          <Text style={styles.inlineButtonText}>중복 확인</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.inputWithButton}>
        <TextInput
          style={[styles.input, styles.inputFlex]}
          placeholder="이메일"
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
          placeholder="이메일 인증코드"
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
          placeholder="비밀번호"
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
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
    padding: 8,
},
});