import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, SafeAreaView, TextInput, StyleSheet, Alert, Platform, KeyboardAvoidingView, ScrollView, Image, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { API_URL } from '../../../constants/config';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';

const CommunityComent = () => {
  const router = useRouter();
  const { communityNo, userNo } = useLocalSearchParams<{ communityNo: string; userNo: string }>();
  const [coments, setComents] = useState([]);
  const [newComent, setNewComent] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState<number | null>(null);
  const [comentCounts, setComentCounts] = useState<number | undefined>(undefined);
  const [images, setImages] = useState<string[]>([]);

  // 댓글 목록 가져오기
  const fetchComents = async () => {
    try {
      const res = await fetch(`${API_URL}/coments/list?community_no=${communityNo}`);
      if (res.ok) {
        const data = await res.json();
        setComents(data);
      } else {
        console.error('댓글 목록 로드 실패:', res.status);
        Alert.alert('오류', '댓글 목록을 불러오는 데 실패했습니다.');
      }
    } catch (error) {
      console.error('댓글 목록 요청 에러:', error);
      Alert.alert('오류', '네트워크 오류가 발생했습니다.');
    }
  };

  // 페이지 로드 시 댓글 목록 업데이트
  useEffect(() => {
    fetchComents();
  }, [communityNo]);

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

  // 이미지 삭제 함수
  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAddComent = async () => {
    if (!newComent.trim()) {
      Alert.alert('오류', '댓글 내용을 입력하세요.');
      return;
    }

    const formData = new FormData();
    formData.append('coment_content', newComent);
    formData.append('community_no', communityNo);
    formData.append('user_no', userNo);
    images.forEach((img, idx) => {
      formData.append('files', {
        uri: img,
        name: `coment_${idx}.jpg`,
        type: 'image/jpeg',
      } as any);
    });

    try {
      const res = await fetch(`${API_URL}/coments/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (res.ok) {
        // 댓글 등록 후 최신 댓글 수 받아오기 (상태로 저장)
        const countRes = await fetch(`${API_URL}/coments/counts?community_no=${communityNo}`);
        let newCount = 0;
        if (countRes.ok) {
          const countData = await countRes.json();
          newCount = countData?.counts?.[communityNo] ?? 0;
        }
        setComentCounts(newCount); // 상태로 저장
        setNewComent('');
        setImages([]);
        fetchComents(); // 목록만 새로고침
        // 더 이상 router.push로 이동하지 않음!
      } else {
        Alert.alert('오류', '댓글 등록에 실패했습니다.');
      }
    } catch (error) {
      Alert.alert('오류', '네트워크 오류가 발생했습니다.');
    }
  };
  const handleEdit = (item: any) => {
    router.push({
      pathname: '/community/communityComentEdit',
      params: {
        coment_no: item.coment_no,
        coment_content: item.coment_content,
        user_nickname: item.user_nickname,
        user_no: item.user_no,
        community_no: communityNo,
        images: JSON.stringify(item.images || []),
      },
    });
    setShowMoreMenu(null);
  };

  const handleDelete = async (item: any) => {
    setShowMoreMenu(null);
    try {
      const res = await fetch(`${API_URL}/coments/${item.coment_no}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        Alert.alert('성공', '댓글이 삭제되었습니다.');
        fetchComents();
      } else {
        Alert.alert('오류', '댓글 삭제에 실패했습니다.');
      }
    } catch (error) {
      Alert.alert('오류', '네트워크 오류가 발생했습니다.');
    }
  };

  // 화면 포커스 변경 시 점세개 메뉴 닫기
  useEffect(() => {
    setShowMoreMenu(null);
  }, [communityNo]);

  // 바깥 터치 시 점세개 메뉴 닫기
  const handleOutsidePress = useCallback(() => {
    setShowMoreMenu(null);
    Keyboard.dismiss();
  }, []);

  const renderItem = ({ item }: { item: any }) => (
    <TouchableWithoutFeedback onPress={handleOutsidePress}>
      <View style={styles.comentContainer}>
        {/* 우측 상단 점 세개 버튼 */}
        {item.user_no === Number(userNo) && (
          <View style={{ position: 'absolute', top: 10, right: 10, zIndex: 10 }}>
            <TouchableOpacity
              onPress={() => setShowMoreMenu(showMoreMenu === item.coment_no ? null : item.coment_no)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.moreButtonText}>⋮</Text>
            </TouchableOpacity>
            {showMoreMenu === item.coment_no && (
              <TouchableWithoutFeedback onPress={handleOutsidePress}>
                <View style={styles.moreMenu}>
                  <TouchableOpacity style={styles.menuItem} onPress={() => handleEdit(item)}>
                    <Text style={styles.menuItemText}>수정하기</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.menuItem} onPress={() => handleDelete(item)}>
                    <Text style={styles.menuItemText}>삭제하기</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            )}
          </View>
        )}
        <Text style={styles.comentTitle}>{item.coment_content}</Text>
        <Text style={styles.comentAuthor}>작성자: {item.user_nickname}</Text>
        <Text style={styles.comentDate}>등록일자: {new Date(item.coment_regist_at).toLocaleString()}</Text>
        {/* 댓글 이미지 미리보기 */}
        {item.images && item.images.length > 0 && (
          <ScrollView horizontal style={{ marginTop: 8 }}>
            {item.images.map((img: { coment_image_no: React.Key | null | undefined; coment_image_path: string; }) => (
              <Image
                key={img.coment_image_no}
                source={{ uri: API_URL + img.coment_image_path }}
                style={{ width: 60, height: 60, borderRadius: 8, marginRight: 8, backgroundColor: '#eee' }}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
        )}
      </View>
    </TouchableWithoutFeedback>
  );

  return (
    <TouchableWithoutFeedback onPress={handleOutsidePress}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: '/community/communityDetail',
                params: { communityNo, comentCounts: comentCounts, userNo },
              })
            }
          >
            <Text style={styles.headerIcon}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>댓글</Text>
          <View style={{ width: 32 }} />
        </View>
          
          {/* 댓글 입력 영역 */}
          <View style={styles.commentInputWrap}>
            <View style={styles.commentInputInner}>
              <View style={{ flex: 1 }}>
                {inputFocused ? (
                <View>
                  {/* 텍스트 입력창: 한 줄 위 */}
                  <TextInput
                    style={[styles.commentRealInput, { minHeight: 36, maxHeight: 80, marginBottom: 6 }]}
                    value={newComent}
                    onChangeText={setNewComent}
                    placeholder="댓글을 남겨보세요."
                    placeholderTextColor="#bbb"
                    autoFocus
                    multiline
                    maxLength={1000}
                  />
                  {/* 한 줄 아래: 좌측(이미지추가, 이미지미리보기) / 우측(글자수, 취소, 등록) */}
                  <View style={[styles.commentInputBottomRow, { justifyContent: 'space-between' }]}>
                    {/* 좌측: 이미지 추가 버튼 + 이미지 미리보기 */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}>
                      <TouchableOpacity onPress={pickImage} style={styles.imageIconButton}>
                        <MaterialCommunityIcons name="image-plus" size={28} color="#888" />
                      </TouchableOpacity>
                      <ScrollView horizontal style={{ marginLeft: 4, height: 60 }}>
                      {images.map((img, idx) => (
                        <View key={idx} style={styles.imagePreviewBox}>
                          <Image source={{ uri: img }} style={styles.imagePreview} />
                          <TouchableOpacity
                            style={styles.removeImageButton}
                            onPress={() => removeImage(idx)}
                          >
                            <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>✕</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </ScrollView>
                    </View>
                    {/* 우측: 글자수, 취소, 등록 */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 0 }}>
                      <Text style={styles.commentLength}>{newComent.length}/1000</Text>
                      <TouchableOpacity
                        style={styles.commentCancelBtn}
                        onPress={() => {
                          setInputFocused(false);
                          setNewComent('');
                          setImages([]);
                        }}
                      >
                        <Text style={styles.commentCancelText}>취소</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.commentSubmitBtn,
                          !newComent.trim() && styles.commentSubmitBtnDisabled,
                        ]}
                        onPress={() => {
                          if (newComent.trim()) {
                            setInputFocused(false);
                            handleAddComent();
                          }
                        }}
                        disabled={!newComent.trim()}
                      >
                        <Text
                          style={[
                            styles.commentSubmitText,
                            !newComent.trim() && styles.commentSubmitTextDisabled,
                          ]}
                        >
                          등록
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.commentFakeInput}
                  onPress={() => setInputFocused(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.commentFakeInputText}>댓글을 남겨보세요.</Text>
                </TouchableOpacity>
              )}
              </View>
            </View>
          </View>

          {/* 댓글 목록 */}
          <FlatList
            data={coments}
            keyExtractor={(item) => item.coment_no.toString()}
            renderItem={renderItem}
            onRefresh={fetchComents}
            refreshing={false}
            contentContainerStyle={{ flexGrow: 1 }}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <MaterialCommunityIcons name="dots-horizontal-circle-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>등록된 댓글이 없습니다.</Text>
              </View>
            }
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
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
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    flex: 1,
    textAlign: 'center',
  },
  headerIcon: {
    fontSize: 24,
    color: '#222',
    width: 32,
    textAlign: 'center',
  },
  commentInputWrap: {
    backgroundColor: '#f6f7f9',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 12,
    margin: 12,
    marginBottom: 0,
  },
  commentInputInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  commentFakeInput: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    minHeight: 28,
    justifyContent: 'center',
  },
  commentFakeInputText: {
    color: '#bbb',
    fontSize: 16,
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
  commentCancelBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#f3f3f3',
    marginRight: 6,
  },
  commentCancelText: {
    color: '#888',
    fontSize: 15,
  },
  commentSubmitBtn: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#b7d6bb',
  },
  commentSubmitBtnDisabled: {
    backgroundColor: '#e0e0e0',
  },
  commentSubmitText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  commentSubmitTextDisabled: {
    color: '#fff',
  },
  comentContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  comentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  comentAuthor: {
    fontSize: 14,
    marginBottom: 4,
  },
  comentDate: {
    fontSize: 12,
    color: '#555',
    marginBottom: 8,
  },
  emptyBox: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: '#bbb',
    fontSize: 16,
    marginTop: 8,
  },
  imageIconButton: {
    marginRight: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreButtonText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#888",
    padding: 4,
  },
  moreMenu: {
    position: "absolute",
    top: 28,
    right: 0,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    zIndex: 100,
    minWidth: 90,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItem: {
    padding: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: "#222",
  },
  imagePreviewBox: {
  position: 'relative',
  marginRight: 6,
},
imagePreview: {
  width: 40,
  height: 40,
  borderRadius: 6,
  top: 10,
},
removeImageButton: {
  position: 'absolute',
  top: 3,
  right: -8,
  backgroundColor: '#ddd',
  borderRadius: 10,
  borderWidth: 1,
  borderColor: '#ddd',
  width: 18,
  height: 18,
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 10,
},
});

export default CommunityComent;