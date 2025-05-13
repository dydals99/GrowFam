    import React, { useEffect, useState } from 'react';
    import { View, Text, StyleSheet, Alert, Image, TouchableOpacity, ScrollView, Modal, TextInput, Button } from 'react-native';
    import AsyncStorage from '@react-native-async-storage/async-storage';
    import { useRouter } from 'expo-router';
    import * as ImagePicker from 'expo-image-picker';
    import { Ionicons } from '@expo/vector-icons';
    import { API_URL } from '../../../constants/config';

    const PROFILE_PLACEHOLDER = require('../../../assets/images/다운로드.jpg');

    const fieldLabels: { [key: string]: string } = {
    username: '실명',
    nickname: '닉네임',
    password: '패스워드',
    email: '이메일',
    };

    type ListItemProps = {
    label: string;
    value?: string;
    onPress: () => void;
    children?: React.ReactNode;
    };
    const ListItem = ({ label, value, onPress, children }: ListItemProps) => (
    <TouchableOpacity style={styles.listItem} onPress={onPress}>
      <View style={styles.listItemText}>
        <Text style={styles.listItemLabel}>{label}</Text>
        {value != null && <Text style={styles.listItemValue}>{value}</Text>}
      </View>
      {children || (
        <Ionicons name="chevron-forward" size={20} color="#999" />
      )}
    </TouchableOpacity>
    );

    const UserProfile = () => {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [usernickname, setUsernickname] = useState('');
    const [profileImage, setProfileImage] = useState<string | null>(null);

    // 모달 상태 관리
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [modalType, setModalType] = useState<'basic' | 'email' | 'password' | null>(null); // 모달 타입
    const [currentField, setCurrentField] = useState(''); // 현재 수정 중인 필드
    const [currentValue, setCurrentValue] = useState(''); // 현재 필드의 값
    const [verificationCode, setVerificationCode] = useState('');
    const [isPasswordValid, setIsPasswordValid] = useState<boolean | null>(null);

    useEffect(() => {
      (async () => {
        const userNo = await AsyncStorage.getItem('user_no'); // AsyncStorage에서 user_no 가져오기
        if (!userNo) {
          console.log("user_no가 없습니다. 로그인 화면으로 이동합니다.");
          router.replace('./login');
          return;
        }

        try {
          const res = await fetch(`${API_URL}/users/user-info/${userNo}`);
          if (!res.ok) {
            console.error("사용자 정보를 가져오는데 실패했습니다.");
            return;
          }

          const data = await res.json();
          setUsername(data.username);
          setUsernickname(data.nickname);
          setEmail(data.email);
          setProfileImage(`${API_URL}/${data.profileImage}`); // 프로필 이미지 경로 수정
        } catch (e) {
          console.error("사용자 정보를 가져오는 중 오류 발생:", e);
        }
      })();
    }, []);

    const sendEmailVerification = async () => {
      try {
        const response = await fetch(`${API_URL}/users/send-email-verification`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: currentValue }),
        });

        if (!response.ok) {
          Alert.alert('Error', '인증 코드 전송에 실패했습니다.');
          return;
        }

        Alert.alert('Success', '인증 코드가 전송되었습니다.');
      } catch (error) {
        console.error('인증 코드 전송 중 오류 발생:', error);
        Alert.alert('Error', '인증 코드 전송 중 오류가 발생했습니다.');
      }
      };

    const handleVerifyEmailCode = async () => {
      try {
        const response = await fetch(`${API_URL}/users/verify-email-code`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: currentValue, code: verificationCode }),
        });

        if (!response.ok) {
          Alert.alert('Error', '인증 코드 확인에 실패했습니다.');
          return;
        }

        Alert.alert('Success', '인증 코드가 확인되었습니다.');
      } catch (error) {
        console.error('인증 코드 확인 중 오류 발생:', error);
        Alert.alert('Error', '인증 코드 확인 중 오류가 발생했습니다.');
      }
    };

    const handleEmailSave = async () => {
      try {
        const userNo = await AsyncStorage.getItem('user_no');
        if (!userNo) {
          Alert.alert('Error', '사용자 정보를 찾을 수 없습니다.');
          return;
        }

        const response = await fetch(`${API_URL}/users/update-user-info`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_no: userNo, field: 'email', value: currentValue }),
        });

        if (!response.ok) {
          Alert.alert('Error', '이메일 수정에 실패했습니다.');
          return;
        }

        Alert.alert('Success', '이메일이 성공적으로 수정되었습니다.');
        setEmail(currentValue);
        setIsModalVisible(false);
      } catch (error) {
        console.error('이메일 수정 중 오류 발생:', error);
        Alert.alert('Error', '이메일 수정 중 오류가 발생했습니다.');
      }
    };

    const validatePassword = (password: string) => {

    const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,15}$/;
      return regex.test(password);
    };

    const handlePasswordChange = (password: string) => {
      setCurrentValue(password);
      setIsPasswordValid(validatePassword(password));
    };

    const checkNicknameAvailability = async () => {
      try {
        const response = await fetch(`${API_URL}/users/check-nickname`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nickname: currentValue }),
        });

        if (!response.ok) {
          Alert.alert('Error', '닉네임 중복 확인에 실패했습니다.');
          return;
        }

        const data = await response.json();
        if (data.isValid) {
          Alert.alert('Success', '사용 가능한 닉네임입니다.');
        } else {
          Alert.alert('Error', '이미 사용 중인 닉네임입니다.');
        }
      } catch (error) {
        console.error('닉네임 중복 확인 중 오류 발생:', error);
        Alert.alert('Error', '닉네임 중복 확인 중 오류가 발생했습니다.');
      }
    };
    const handlePasswordSave = async () => {
      if (!validatePassword(currentValue)) {
        Alert.alert('Error', '비밀번호는 특수문자, 영문, 숫자 조합 8~15자리여야 합니다.');
        return;
      }

      try {
        const userNo = await AsyncStorage.getItem('user_no');
        if (!userNo) {
          Alert.alert('Error', '사용자 정보를 찾을 수 없습니다.');
          return;
        }

        const response = await fetch(`${API_URL}/users/update-user-info`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_no: userNo, field: 'password', value: currentValue }),
        });

        if (!response.ok) {
          Alert.alert('Error', '비밀번호 수정에 실패했습니다.');
          return;
        }

        Alert.alert('Success', '비밀번호가 성공적으로 수정되었습니다.');
        setIsModalVisible(false);
      } catch (error) {
        console.error('비밀번호 수정 중 오류 발생:', error);
        Alert.alert('Error', '비밀번호 수정 중 오류가 발생했습니다.');
      }
    };
    const pickImage = async () => {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
      });
    
      if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        setProfileImage(imageUri);

        try {
          const token = await AsyncStorage.getItem("access_token");
          if (!token) {
            Alert.alert("Error", "You need to log in to update your profile image.");
            return;
          }

          const formData = new FormData();
          formData.append("file", {
            uri: imageUri,
            name: "profile.jpg",
            type: "image/jpeg",
          } as any);

          const response = await fetch(`${API_URL}/users/update-profile-image`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
            body: formData,
          });

          if (!response.ok) {
            console.error("Failed to upload profile image.");
            Alert.alert("Error", "Failed to update profile image.");
            return;
          }

          const data = await response.json();
          Alert.alert("Success", "Profile image updated successfully.");
          setProfileImage(data.profileImage);
        } catch (error) {
          console.error("Error uploading profile image:", error);
          Alert.alert("Error", "An error occurred while updating your profile image.");
        }
      }
    };

    const onLogout = async () => {
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('user_no'); // user_no도 삭제
      Alert.alert('로그아웃', '정상적으로 로그아웃되었습니다.');
      router.replace('./login');
    };

    const openModal = (type: 'basic' | 'email' | 'password', field: string, value: string) => {
      setModalType(type);
      setCurrentField(field);
      setCurrentValue(value);
      setIsModalVisible(true);
    };

    const handleSave = async () => {
      try {
        const userNo = await AsyncStorage.getItem('user_no');
        if (!userNo) {
          Alert.alert('Error', '사용자 정보를 찾을 수 없습니다.');
          return;
        }

        const response = await fetch(`${API_URL}/users/update-user-info`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_no: userNo, field: currentField, value: currentValue }),
        });

        if (!response.ok) {
          Alert.alert('Error', '수정에 실패했습니다.');
          return;
        }

        Alert.alert('Success', `${fieldLabels[currentField]}이(가) 성공적으로 수정되었습니다.`);
        setIsModalVisible(false);

        // 수정된 값 반영
        if (currentField === 'username') setUsername(currentValue);
        if (currentField === 'nickname') setUsernickname(currentValue);
        if (currentField === 'email') setEmail(currentValue);
        if (currentField === 'password') setPassword(currentValue)
      } catch (error) {
        console.error('수정 중 오류 발생:', error);
        Alert.alert('Error', '수정 중 오류가 발생했습니다.');
      }
    };
    return (
      <ScrollView style={styles.container}>
        {/* 프로필 영역 */}
        <View style={styles.profileTop}>
          <TouchableOpacity onPress={pickImage}>
            <Image
              source={profileImage ? { uri: profileImage } : PROFILE_PLACEHOLDER}
              style={styles.profileImage}
            />
          </TouchableOpacity>
          <Text style={styles.nameText}>{usernickname || 'Loading...'}</Text>
        </View>

        {/* 내프로필 섹션 */}
        <View style={styles.card}>
          <ListItem
            label="실명"
            value={username}
            onPress={() => openModal('basic', 'username', username)}
          />
          <ListItem
            label="닉네임"
            value={usernickname}
            onPress={() => openModal('basic', 'nickname', usernickname)}
          />
          <ListItem
            label="이메일"
            value={email}
            onPress={() => openModal('email', 'email', email)}
          />
          <ListItem
            label="비밀번호"
            value="비밀번호 수정"
            onPress={() => openModal('password', 'password', '')}
          />
            
          <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
            <Text style={styles.logoutText}>로그아웃</Text>
          </TouchableOpacity>
        </View>
        {/* 모달 */}
        <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {modalType === 'basic' && currentField === 'nickname' && (
              <>
                <Text style={styles.modalTitle}>닉네임 수정</Text>
                <TextInput
                  style={styles.modalInput}
                  value={currentValue}
                  onChangeText={setCurrentValue}
                  placeholder="새 닉네임 입력"
                />
                <Button title="중복 확인" onPress={checkNicknameAvailability} />
                <View style={styles.modalButtons}>
                  <Button title="취소" onPress={() => setIsModalVisible(false)} />
                  <Button title="저장" onPress={handleSave} />
                </View>
              </>
            )}

            {modalType === 'basic' && currentField !== 'nickname' && (
              <>
                <Text style={styles.modalTitle}>{fieldLabels[currentField]} 수정</Text>
                <TextInput
                  style={styles.modalInput}
                  value={currentValue}
                  onChangeText={setCurrentValue}
                />
                <View style={styles.modalButtons}>
                  <Button title="취소" onPress={() => setIsModalVisible(false)} />
                  <Button title="저장" onPress={handleSave} />
                </View>
              </>
            )}

            {modalType === 'email' && (
              <>
                <Text style={styles.modalTitle}>이메일 수정</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="새 이메일 입력"
                  value={currentValue}
                  onChangeText={setCurrentValue}
                />
                <Button title="인증 코드 전송" onPress={sendEmailVerification} />
                <TextInput
                  style={styles.modalInput}
                  placeholder="인증 코드 입력"
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                />
                <Button title="인증 코드 확인" onPress={handleVerifyEmailCode} />
                <View style={styles.modalButtons}>
                  <Button title="취소" onPress={() => setIsModalVisible(false)} />
                  <Button title="저장" onPress={handleEmailSave} />
                </View>
              </>
            )}

            {modalType === 'password' && (
              <>
                <Text style={styles.modalTitle}>비밀번호 수정</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[
                      styles.modalInput,
                      isPasswordValid === false && styles.invalidInput, // 유효하지 않을 때 스타일
                      isPasswordValid === true && styles.validInput,   // 유효할 때 스타일
                    ]}
                    placeholder="새 비밀번호 입력"
                    value={currentValue}
                    onChangeText={handlePasswordChange}
                    secureTextEntry
                  />
                  {isPasswordValid !== null && (
                    <Ionicons
                      name={isPasswordValid ? 'checkmark-circle' : 'close-circle'}
                      size={20}
                      color={isPasswordValid ? 'green' : 'red'}
                      style={styles.icon}
                    />
                  )}
                </View>
                <Text style={styles.passwordHint}>
                  * 특수문자, 영문, 숫자 조합 8~15자리
                </Text>
                <View style={styles.modalButtons}>
                  <Button title="취소" onPress={() => setIsModalVisible(false)} />
                  <Button title="저장" onPress={handlePasswordSave} />
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
      </ScrollView>
    );
    };

    const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f2f2f2' },
    profileTop: {
      backgroundColor: '#fff',
      alignItems: 'center',
      paddingVertical: 30,
      marginBottom: 10,
      paddingTop : 100
    },
    profileImage: { width: 80, height: 80, borderRadius: 40, marginBottom: 10 },
    nameText: { fontSize: 18, fontWeight: 'bold' },
    emailText: { fontSize: 14, color: '#666', marginTop: 4 },

    card: {
      backgroundColor: '#fff',
    },
    listItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomColor: '#eee',
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    listItemText: { flexDirection: 'column'},
    listItemLabel: { fontSize: 15, color: '#333' },
    listItemValue: { fontSize: 14, color: '#666', marginTop: 2 },
    modifyText: { fontSize: 14, color: '#03C75A' },

    logoutBtn: {
      marginTop: 20,
      backgroundColor: '#fff',
      paddingVertical: 14,
      alignItems: 'center',
    },
    logoutText: { fontSize: 16, color: '#FF3B30' },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      width: '80%',
      backgroundColor: '#fff',
      padding: 20,
      borderRadius: 10,
      alignItems: 'center',
    },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
    modalInput: {
      width: '100%',
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 5,
      padding: 10,
      marginBottom: 20,
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
    },
    passwordHint:{
      color: '#ccc',
      fontSize : 12
    },
    inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    },
    invalidInput: {
      borderColor: 'red',
    },
    validInput: {
      borderColor: 'green',
    },
    icon: {
      marginLeft: 10,
    },
  });

  export default UserProfile;
