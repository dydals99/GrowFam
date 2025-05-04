import React, { useState, useCallback, useEffect } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CommunityHeader from './communityHeader';
import { API_URL } from '../../../constants/config';

interface Post {
  community_no: number;
  community_title: string;
  community_content: string;
  user_no: number;
  user_nickname: string;
  community_regist_at: string;
  like_count : number;
}

export default function Community() {

  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [searchText, setSearchText] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [currentTab, setCurrentTab] = useState<'all' | 'popular'>('all');
  const [comentCounts, setComentCounts] = useState<{ [key: number]: number }>({});

  // 화면이 포커스될 때마다 fetch
  useFocusEffect(
    useCallback(() => {
      if (currentTab === 'all') {
        fetchAllPosts();
      } else {
        fetchPopularPosts();
      }
    }, [currentTab])
  );

  // 전체 글 목록 가져오기
  const fetchAllPosts = async () => {
    try {
      const res = await fetch(`${API_URL}/communities/`);
      if (!res.ok) {
        const text = await res.text();
        console.error('목록 조회 실패', res.status, text);
        Alert.alert('오류', '글 목록을 불러오지 못했습니다.');
        return;
      }
      const data: Post[] = await res.json();
        setPosts(data);
    } catch (e) {
      console.error('네트워크 에러', e);
      Alert.alert('오류', '네트워크 에러가 발생했습니다.');
    }
  };

  // 인기 글 목록 가져오기 (좋아요 수 내림차순)
  const fetchPopularPosts = async () => {
    try {
      const res = await fetch(`${API_URL}/communities/popular`);
      if (!res.ok) {
        const text = await res.text();
        console.error('인기 글 조회 실패', res.status, text);
        Alert.alert('오류', '인기 글 목록을 불러오지 못했습니다.');
        return;
      }
      const data: Post[] = await res.json();
      setPosts(data);
    } catch (e) {
      console.error('네트워크 에러', e);
      Alert.alert('오류', '네트워크 에러가 발생했습니다.');
    }
  };

  const fetchComentCounts = async () => {
    try {
      const res = await fetch(`${API_URL}/coments/counts`);
      if (!res.ok) {
        throw new Error('Failed to fetch coment counts');
      }
      const data = await res.json();
      setComentCounts(data.counts);
    } catch (error) {
      console.error('Error fetching coment counts:', error);    }
  };

  useEffect(() => {
    fetchComentCounts();
  }, []);

  // 탭 버튼 누르면 상태 변경
  const handleTabPress = (tab: 'all' | 'popular') => {
    setCurrentTab(tab);
  };

  const renderPost = ({ item }: { item: Post }) => (
    <TouchableOpacity
      style={styles.postContainer}
      onPress={() => {
        router.push({
          pathname: '/community/communityDetail',
          params: { post: JSON.stringify(item) },
        });
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.postTitle}>{item.community_title}</Text>
        <Text style={styles.postAuthor}>작성자 : {item.user_nickname || "알 수 없음"}</Text>
      </View>
      <View style={styles.summaryBox}>
        <Text style={styles.summaryText}>
          ❤️ {item.like_count}   |   💬 {comentCounts[item.community_no] || 0}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 (검색창 등) */}
      <CommunityHeader
        searchText={searchText}
        setSearchText={setSearchText}
        searchFocused={searchFocused}
        setSearchFocused={setSearchFocused}
      />

      {/* 카테고리 탭 버튼 (전체 / 인기) */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          onPress={() => handleTabPress('all')}
          style={[
            styles.tabButton,
            currentTab === 'all' && styles.activeTabButton
          ]}
        >
          <Text
            style={[
              styles.tabButtonText,
              currentTab === 'all' && styles.activeTabButtonText
            ]}
          >
            전체
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleTabPress('popular')}
          style={[
            styles.tabButton,
            currentTab === 'popular' && styles.activeTabButton
          ]}
        >
          <Text
            style={[
              styles.tabButtonText,
              currentTab === 'popular' && styles.activeTabButtonText
            ]}
          >
            인기
          </Text>
        </TouchableOpacity>
      </View>

      {/* 게시글 목록 */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.community_no.toString()}
        renderItem={renderPost}
        contentContainerStyle={styles.listContent}
      />

      {/* 글 작성 버튼 (Floating Action Button) */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          router.push({
            pathname: '/community/communityWrite',
            params: {},
          });
        }}
      >
        <Ionicons name="add-circle" size={56} color="#4CAF50" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  tabButton: {
    backgroundColor: '#C8E6FA',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginHorizontal: 8,
  },
  tabButtonText: {
    fontSize: 16,
    color: '#333',
  },
  activeTabButton: {
    backgroundColor: '#9AD6FD',
  },
  activeTabButtonText: {
    color: '#000',
    fontWeight: 'bold',
  },
  listContent: { 
    paddingHorizontal: 16, 
    paddingTop: 12, 
    paddingBottom: 80 
  },
  postContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  postTitle: { 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  postAuthor: { 
    fontSize: 12, 
    color: '#666', 
    marginTop: 4 
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
  summaryBox: {
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
});
