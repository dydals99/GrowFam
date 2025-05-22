import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView, KeyboardAvoidingView, Platform, Image, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { API_URL } from '../../../constants/config';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';

const CommunityComentEdit = () => {
  const router = useRouter();
  const { coment_no, coment_content, user_nickname, user_no, community_no, images: imagesParam } = useLocalSearchParams<{
    coment_no: string;
    coment_content: string;
    user_nickname: string;
    user_no: string;
    community_no: string;
    images?: string;
  }>();

  const [updatedComent, setUpdatedComent] = useState(coment_content || '');

  // 기존 이미지(객체 배열)
  const [originImages, setOriginImages] = useState<any[]>(
    imagesParam ? JSON.parse(imagesParam as string) : []
  );
  // 새로 첨부한 이미지
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    if (coment_content) {
      setUpdatedComent(coment_content);
    }
  }, [coment_content]);

  // 이미지 선택 함수
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

  // 기존 이미지 삭제
  const removeOriginImage = (idx: number) => {
    setOriginImages(prev => prev.filter((_, i) => i !== idx));
  };

  // 새 이미지 삭제
  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateComent = async () => {
    if (!updatedComent.trim()) {
      Alert.alert('오류', '댓글 내용을 입력하세요.');
      return;
    }

    const formData = new FormData();
    formData.append('coment_content', updatedComent);

    // 기존 이미지 유지 목록
    formData.append(
      'keep_origin_images',
      JSON.stringify(originImages.map((img: any) => img.coment_image_no))
    );
    // 새 이미지 첨부
    images.forEach((img, idx) => {
      formData.append('files', {
        uri: img,
        name: `coment_${idx}.jpg`,
        type: 'image/jpeg',
      } as any);
    });

    try {
      const res = await fetch(`${API_URL}/coments/${coment_no}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (res.ok) {
        const updatedData = await res.json();
        Alert.alert('성공', '댓글이 수정되었습니다.', [
          {
            text: '확인',
            onPress: () =>
              router.push({
                pathname: '/community/communityComent',
                params: {
                  communityNo: updatedData.community_no,
                  userNo: updatedData.user_no,
                },
              }),
          },
        ]);
      } else {
        Alert.alert('오류', '댓글 수정에 실패했습니다.');
      }
    } catch (error) {
      Alert.alert('오류', '네트워크 오류가 발생했습니다.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* 상단 헤더 */}
        <View style={[styles.header, { justifyContent: 'space-between', alignItems: 'center' }]}>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: '/community/communityComent',
                params: { communityNo: community_no, userNo: user_no },
              })
            }
          >
            <Text style={[styles.headerIcon]}>{"✕"}</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle]}>댓글 수정</Text>
          <TouchableOpacity
            onPress={handleUpdateComent}
            disabled={!updatedComent.trim()}
          >
            <Text style={styles.headerSubmit }>
              등록
            </Text>
          </TouchableOpacity>
        </View>

        {/* 작성자 정보 */}
        <Text style={styles.label}>작성자: {user_nickname}</Text>

        {/* 이미지 첨부/삭제/미리보기 */}
        <View style={styles.toolbar}>
          <TouchableOpacity onPress={pickImage}>
            <MaterialCommunityIcons name="image-plus" size={28} color="#888" />
          </TouchableOpacity>
          <ScrollView horizontal style={{ marginLeft: 10, height: 60 }}>
            {/* 기존 이미지 미리보기 */}
            {originImages.map((img: any, idx: number) => (
              <View key={`origin-${img.coment_image_no}`} style={{ position: 'relative', marginRight: 8 }}>
                <Image
                  source={{ uri: API_URL + img.coment_image_path }}
                  style={{ width: 40, height: 40, borderRadius: 6, backgroundColor: '#eee', top:10 }}
                />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeOriginImage(idx)}
                >
                  <Text style={styles.removeImageText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            {/* 새로 첨부한 이미지 미리보기 */}
            {images.map((img, idx) => (
              <View key={`new-${idx}`} style={{ position: 'relative', marginRight: 8 }}>
                <Image
                  source={{ uri: img }}
                  style={{ width: 40, height: 40, borderRadius: 6, backgroundColor: '#eee' }}
                />
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

        {/* 댓글 입력 영역 */}
        <View style={styles.commentInputWrap}>
          <TextInput
            style={styles.commentRealInput}
            value={updatedComent}
            onChangeText={setUpdatedComent}
            placeholder="댓글 내용을 입력하세요..."
            placeholderTextColor="#bbb"
            multiline
            maxLength={1000}
          />
          <View style={styles.commentInputBottomRow}>
            <View style={{ flex: 1 }} />
            <Text style={styles.commentLength}>{updatedComent.length}/1000</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 0,
    height: 48,
    backgroundColor: '#fff', 
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  headerIcon: {
    fontSize: 24,
    color: '#000',
    padding: 4,
  },
  headerSubmit: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#b7d6bb',
    padding: 4,
  },
  label: {
    paddingTop:20,
    fontSize: 14,
    marginBottom: 8,
    marginLeft: 16,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginBottom: 4,
    paddingLeft: 2,
  },
  removeImageButton: {
    position: 'absolute',
    top: 3,
    right: -8,
    backgroundColor: '#ccc',
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
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  commentInputWrap: {
    backgroundColor: '#f6f7f9',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 12,
    margin: 12,
    marginBottom: 0,
  },
  commentRealInput: {
    backgroundColor: 'transparent',
    fontSize: 16,
    color: '#222',
    minHeight: 28,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  commentInputBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  commentLength: {
    color: '#bbb',
    fontSize: 13,
    marginRight: 8,
  },
  
});

export default CommunityComentEdit;