import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, Image, TouchableOpacity, ScrollView} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../../../constants/config';

const PROFILE_PLACEHOLDER = require('../../../assets/images/다운로드.jpg');

type SectionHeaderProps = {
  title: string;
};
const SectionHeader = ({ title }: SectionHeaderProps) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </View>
);

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
  const [username, setUsername] = useState('');
  const [usernickname, setUsernickname] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);


  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) return;

      try {
        const res = await fetch(`${API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setUsername(data.username);
        setUsernickname(data.nickname);
        setEmail(data.email);
        setProfileImage(`${API_URL}/${data.profileImage}`); // 프로필 이미지 경로 수정
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

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
    Alert.alert('로그아웃', '정상적으로 로그아웃되었습니다.');
    router.replace('./login');
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
        <Text style={styles.emailText}>{email || 'Loading...'}</Text>
      </View>

      {/* 내프로필 섹션 */}
      <View style={styles.card}>
        <SectionHeader title="내프로필" />
        <ListItem
          label={username}
          value=""
          onPress={() => Alert.alert('실명 수정')}
        >
          <Text style={styles.modifyText}>실명수정</Text>
        </ListItem>
        <ListItem
          label={email}
          value=""
          onPress={() => Alert.alert('이메일 수정')}
        >
          <Text style={styles.modifyText}>수정</Text>
        </ListItem>

      </View>

      {/* 보안설정 섹션 */}
      <View style={styles.card}>
        <SectionHeader title="아이정보" />
        <ListItem
          value=""
          label={email}
          onPress={() => Alert.alert('이메일 수정')}
        >
          <Text style={styles.modifyText}>수정</Text>
        </ListItem>
        
      </View>

      {/* 로그아웃 버튼 */}
      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
        <Text style={styles.logoutText}>로그아웃</Text>
      </TouchableOpacity>
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
  },
  profileImage: { width: 80, height: 80, borderRadius: 40, marginBottom: 10 },
  nameText: { fontSize: 18, fontWeight: 'bold' },
  emailText: { fontSize: 14, color: '#666', marginTop: 4 },

  card: {
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomColor: '#ddd',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionHeaderText: { fontSize: 16, fontWeight: 'bold', color: '#333' },

  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomColor: '#eee',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  listItemText: { flexDirection: 'column' },
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
});

export default UserProfile;
