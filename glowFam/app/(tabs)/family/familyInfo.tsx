import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import DropDownPicker from 'react-native-dropdown-picker';
import { useRouter } from 'expo-router';
import { API_URL } from '../../../constants/config';


export default function FamilyInfoScreen() {
  const [birthDate, setBirthDate] = useState('');
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const router = useRouter();
  const [gender, setGender] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([
    { label: '남자', value: 'M' },
    { label: '여자', value: 'F' },
  ]);

  const handleNext = async () => {
    if (!birthDate || !gender || !height || !weight) {
      Alert.alert('Error', '모든 필드를 입력해주세요.');
      return;
    }

    try {
      // 자녀 정보 저장 
      const response = await fetch(`${API_URL}/family/kid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          family_no: 1, // family_no는 이전 단계에서 저장된 값
          kid_height: height,
          kid_weight: weight,
          kid_gender: gender,
          kid_birthday: birthDate,
        }),
      });

      if (!response.ok) {
        throw new Error('자녀 정보 저장 실패');
      }

      Alert.alert('Success', '자녀 정보가 저장되었습니다.');
      router.replace('../users/login'); // 로그인 화면으로 이동
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>자녀 정보 입력 페이지</Text>

      {/* 생년월일 선택 */}
      <TouchableOpacity style={styles.input} onPress={() => setDatePickerVisibility(true)}>
        <Text style={birthDate ? styles.inputText : styles.placeholderText}>
          {birthDate || '생년월일을 선택하세요.'}
        </Text>
      </TouchableOpacity>
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={(date) => {
          const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1)
            .toString()
            .padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
          setBirthDate(formattedDate);
          setDatePickerVisibility(false);
        }}
        onCancel={() => setDatePickerVisibility(false)}
        locale="ko"
      />

      {/* 성별 선택 */}
      <DropDownPicker
        open={open}
        value={gender}
        items={items}
        setOpen={setOpen}
        setValue={setGender}
        setItems={setItems}
        placeholder="성별을 선택하세요."
        style={styles.dropdown}
        dropDownContainerStyle={styles.dropdownContainer}
      />

      {/* 키 입력 */}
      <TextInput
        style={styles.input}
        placeholder="키를 입력하세요 (cm)"
        value={height}
        onChangeText={setHeight}
        keyboardType="numeric"
        placeholderTextColor="#aaa"
      />

      {/* 몸무게 입력 */}
      <TextInput
        style={styles.input}
        placeholder="몸무게를 입력하세요 (kg)"
        value={weight}
        onChangeText={setWeight}
        keyboardType="numeric"
        placeholderTextColor="#aaa"
      />

      {/* 다음 버튼 */}
      <TouchableOpacity
        style={[styles.button, (!birthDate || !gender || !height || !weight) && styles.disabledButton]}
        onPress={handleNext}
        disabled={!birthDate || !gender || !height || !weight}
      >
        <Text style={styles.buttonText}>다음</Text>
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
    backgroundColor: '#FFEFF1', // 연한 분홍색 배경
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 25,
    paddingHorizontal: 15,
    marginBottom: 15,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  inputText: {
    fontSize: 14,
    color: '#000',
  },
  placeholderText: {
    fontSize: 14,
    color: '#aaa',
  },
  dropdown: {
    width: '100%',
    height: 50,
    borderColor: '#ccc',
    borderRadius: 25,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    marginBottom: 15,
  },
  dropdownContainer: {
    borderColor: '#ccc',
    borderRadius: 25,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#F28B8C', // 연한 빨간색 버튼
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#F5C6C7', // 비활성화된 버튼 색상
  },
});