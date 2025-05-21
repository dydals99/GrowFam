import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

type CommunityHeaderProps = {
  searchText: string;
  setSearchText: (text: string) => void;
  searchFocused: boolean;
  setSearchFocused: (focused: boolean) => void;
};

export default function CommunityHeader({
  searchText,
  setSearchText,
  setSearchFocused,
}: CommunityHeaderProps) {
  return (
    <View style={styles.headerContainer}>
      <Text style={styles.header}>커뮤니티</Text>
      <View style={styles.searchBarWrapper}>
        <MaterialIcons name="search" size={22} color="#aaa" style={{ marginLeft: 10 }} />
        <TextInput
          style={styles.searchBar}
          placeholder="궁금하신 점을 입력해주세요"
          placeholderTextColor="#aaa"
          value={searchText}
          onChangeText={setSearchText}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    marginBottom: 12,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 12,
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 20,
    borderColor: '#ccc',
    borderWidth: 2,
    height: 40,
    // 그림자 효과
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3, // Android
  },
  searchBar: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 10,
    fontSize: 14,
    height: 40,
  },
});