import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

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
      <TextInput
        style={styles.searchBar}
        placeholder="궁금하신 점을 입력해주세요" 
        value={searchText}
        onChangeText={setSearchText}
        onFocus={() => setSearchFocused(true)}
        onBlur={() => setSearchFocused(false)}
      />
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
  searchBar: {
    backgroundColor: '#b7d6bb',
    marginHorizontal: 16,
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 40,
    fontSize: 14,
  },
 
});
