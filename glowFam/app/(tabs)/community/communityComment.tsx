import React, { useState } from 'react';
import { Modal, View, Text, FlatList, TouchableOpacity, StyleSheet, Dimensions,
  TextInput, KeyboardAvoidingView, Platform,} from 'react-native';

type Comment = {
  id: number;
  text: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  comments: Comment[];
};

const CommunityCommentModal = ({ visible, onClose, comments }: Props) => {
  const [commentList, setCommentList] = useState(comments);
  const [newComment, setNewComment] = useState('');

  const handleAddComment = () => {
    if (newComment.trim() === '') return;

    const newId = commentList.length + 1;
    const newCommentObj = { id: newId, text: newComment };

    setCommentList([...commentList, newCommentObj]);
    setNewComment('');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.title}>댓글 목록</Text>
          <FlatList
            data={commentList}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.commentItem}>
                <Text style={styles.commentText}>{item.text}</Text>
              </View>
            )}
            contentContainerStyle={{ paddingBottom: 80 }}
          />

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={newComment}
              onChangeText={setNewComment}
              placeholder="댓글을 입력하세요..."
              multiline
            />
            <TouchableOpacity style={styles.sendButton} onPress={handleAddComment}>
              <Text style={styles.sendButtonText}>등록</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>닫기</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: Dimensions.get('window').height * 0.75,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  commentItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  commentText: {
    fontSize: 14,
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 10,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: 16,
    alignItems: 'center',
    padding: 12,
  },
  closeButtonText: {
    fontWeight: 'bold',
    color: '#555',
  },
});

export default CommunityCommentModal;
