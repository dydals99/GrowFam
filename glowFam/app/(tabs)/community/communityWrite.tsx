import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { API_URL } from '../../../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';

export default function CommunityWrite() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [userNo, setUserNo] = useState<number | null>(null);
  const [images, setImages] = useState<string[]>([]); // 여러 장

  useEffect(() => {
    const fetchUserNo = async () => {
      try {
        const userNo = await AsyncStorage.getItem("user_no");
        if (!userNo) {
          Alert.alert("로그인이 필요합니다.");
          router.replace("/users/login");
          return;
        }
        setUserNo(Number(userNo));
      } catch (error) {
        Alert.alert("사용자 정보를 가져오는 중 오류가 발생했습니다.");
      }
    };
    fetchUserNo();
  }, []);

  // 이미지 선택 함수 (여러 번 추가)
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImages(prev => [...prev, result.assets[0].uri]);
    }
  };

  // 이미지 삭제
  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!title || !content) {
      Alert.alert('Error', '제목과 내용을 입력해주세요.');
      return;
    }
    if (!userNo) {
      Alert.alert('Error', '로그인이 필요합니다.');
      return;
    }

    const formData = new FormData();
    formData.append('community_title', title);
    formData.append('community_content', content);
    formData.append('user_no', String(userNo));
    images.forEach((img, idx) => {
      formData.append('files', {
        uri: img,
        name: `community_${idx}.jpg`,
        type: 'image/jpeg',
      } as any);
    });

    try {
      const res = await fetch(`${API_URL}/communities/write`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });
      if (!res.ok) {
        Alert.alert('글 등록에 실패했습니다.');
        return;
      }
      const data = await res.json();
      Alert.alert('글이 등록되었습니다.');
      setTitle('');
      setContent('');
      setImages([]);
      router.replace({
        pathname: '/community/communityDetail',
        params: { post: JSON.stringify(data) },
      });
    } catch (error) {
      Alert.alert('네트워크 오류가 발생했습니다.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 상단 바 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('./community')}>
          <Text style={styles.headerIcon}>✕</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={styles.headerSubmit} onPress={handleSubmit}>
          <Text style={styles.headerSubmitText}>등록</Text>
        </TouchableOpacity>
      </View>

      {/* 제목 입력 */}
      <View style={styles.titleBox}>
        <TextInput
          style={styles.titleInput}
          placeholder="제목"
          placeholderTextColor="#bbb"
          value={title}
          onChangeText={setTitle}
        />
      </View>

      {/* 툴바 (이미지 첨부) */}
      <View style={styles.toolbar}>
        <TouchableOpacity onPress={pickImage}>
          <MaterialCommunityIcons name="image-plus" size={28} color="#888" />
        </TouchableOpacity>
        <ScrollView horizontal style={{ marginLeft: 10 }}>
          {images.map((img, idx) => (
            <View key={idx} style={{ position: 'relative', marginRight: 10 }}>
              <Image source={{ uri: img }} style={{ width: 40, height: 40, borderRadius: 6 }} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => removeImage(idx)}
              >
                <Text style={styles.removeImageText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* 내용 입력 */}
      <View style={styles.contentDivider} />
      <TextInput
        style={styles.contentInput}
        placeholder="내용을 입력하세요."
        placeholderTextColor="#bbb"
        value={content}
        onChangeText={setContent}
        multiline
      />
      <View style={styles.contentDivider} />
    </SafeAreaView>
  );
}

// styles는 기존과 동일하게 사용

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 16,
    paddingHorizontal: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerIcon: {
    fontSize: 24,
    color: '#222',
    marginRight: 12,
    width: 32,
    textAlign: 'center',
  },
  headerSubmit: {
    backgroundColor: '#b7d6bb',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSubmitText: {
    fontSize: 16,
    color: '#fff',
  },
  titleInput: {
    fontSize: 16,
    color: '#222',
    fontWeight: 'normal',
    paddingVertical: 0,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },
  titleBox: {
    backgroundColor: '#f6f7f9',
    borderRadius: 8,
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    marginBottom: 4,
    paddingLeft:10
  },
  toolbarIcon: {
    fontSize: 22,
    marginHorizontal: 6,
    color: '#888',
  },
  contentInput: {
    flex: 1,
    fontSize: 16,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    textAlignVertical: 'top',
    color: '#222',
  },
  contentDivider: {
    height: 1,
    backgroundColor: '#eee',
    marginHorizontal: 12,
    marginBottom: 0,
    marginTop: 4,
  },
  removeImageButton: {
    position: 'absolute',
    top: 20,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  removeImageText: {
    color: '#888',
    fontSize: 14,
    fontWeight: 'bold',
  },
});