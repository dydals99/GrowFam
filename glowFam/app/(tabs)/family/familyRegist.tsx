import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import DropDownPicker from 'react-native-dropdown-picker';
import { API_URL } from '../../../constants/config';

export default function FamilyInfoScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  // 회원가입 정보 받기
  const user_name = params.user_name as string;
  const user_nickname = params.user_nickname as string;
  const user_email = params.user_email as string;
  const user_password = params.user_password as string;
  const user_phone = params.user_phone as string;

  type Kid = {
    kidName: string;
    birthDate: string;
    gender: string;
    height: string;
    weight: string;
  };

  // 이전에 추가된 자녀들
  const [kids, setKids] = useState<Kid[]>([]);
  // 현재 입력 중인 자녀
  const [currentKid, setCurrentKid] = useState<Kid>({
    kidName: '',
    birthDate: '',
    gender: '',
    height: '',
    weight: '',
  });
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([
    { label: '남자', value: 'M' },
    { label: '여자', value: 'W' },
  ]);

  // 현재 입력 중인 자녀 정보 유효성 검사
  const isCurrentKidValid = (kid: Kid) =>
    kid.kidName && kid.birthDate && kid.gender && kid.height && kid.weight;

  // 자녀 추가
  const handleAddKid = () => {
    if (!isCurrentKidValid(currentKid)) {
      Alert.alert('Error', '현재 자녀 정보를 모두 입력해주세요.');
      return;
    }
    setKids([...kids, currentKid]);
    setCurrentKid({ kidName: '', birthDate: '', gender: '', height: '', weight: '' });
    setOpen(false);
  };

  // 완료
  const handleComplete = async () => {
    // 마지막 입력폼이 비어있지 않으면 추가
    let allKids = [...kids];
    if (isCurrentKidValid(currentKid)) {
      allKids = [...kids, currentKid];
    } else if (
      currentKid.kidName ||
      currentKid.birthDate ||
      currentKid.gender ||
      currentKid.height ||
      currentKid.weight
    ) {
      Alert.alert('Error', '현재 입력 중인 자녀 정보를 모두 입력하거나 비워주세요.');
      return;
    }
    if (allKids.length === 0) {
      Alert.alert('Error', '최소 1명의 자녀 정보를 입력해주세요.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/users/register-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_name,
          user_nickname,
          user_email,
          user_password,
          user_phone,
          kids: allKids.map(kid => ({
            kid_name: kid.kidName,
            kid_birthday: kid.birthDate,
            kid_gender: kid.gender,
            kid_height: kid.height,
            kid_weight: kid.weight,
          })),
        }),
      });

      if (!response.ok) throw new Error('회원가입 실패');
      Alert.alert('Success', '회원가입이 완료되었습니다.');
      router.replace('../users/login');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>자녀 정보 입력</Text>

      {/* 이전에 추가된 자녀 카드 */}
      {kids.map((kid, idx) => (
        <View key={idx} style={styles.kidCard}>
          <Text style={styles.kidCardText}>
            이름: {kid.kidName} / 생년월일: {kid.birthDate} / 성별: {kid.gender === 'M' ? '남자' : '여자'} / 키: {kid.height}cm / 몸무게: {kid.weight}kg
          </Text>
        </View>
      ))}

      {/* 현재 입력 중인 자녀 폼 */}
      <View style={{ width: '100%' }}>
        <TextInput
          style={styles.input}
          placeholder="이름을 입력하세요"
          value={currentKid.kidName}
          onChangeText={v => setCurrentKid({ ...currentKid, kidName: v })}
          placeholderTextColor="#aaa"
        />
        {/* 생년월일 선택 */}
        <TouchableOpacity style={styles.input} onPress={() => setDatePickerVisibility(true)}>
          <Text style={currentKid.birthDate ? styles.inputText : styles.placeholderText}>
            {currentKid.birthDate || '생년월일을 선택하세요.'}
          </Text>
        </TouchableOpacity>
        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={(date) => {
            const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1)
              .toString()
              .padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
            setCurrentKid({ ...currentKid, birthDate: formattedDate });
            setDatePickerVisibility(false);
          }}
          onCancel={() => setDatePickerVisibility(false)}
          locale="ko"
        />
        {/* 성별 선택 */}
        <DropDownPicker
          open={open}
          value={currentKid.gender || null}
          items={items}
          setOpen={setOpen}
          setValue={(callbackOrValue) => {
            const value =
              typeof callbackOrValue === "function"
                ? callbackOrValue(currentKid.gender)
                : callbackOrValue;
            setCurrentKid({ ...currentKid, gender: value });
          }}
          setItems={setItems}
          placeholder="성별을 선택하세요."
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownContainer}
          zIndex={1000}
          zIndexInverse={1000}
          listMode="SCROLLVIEW"
        />
        {/* 키 입력 */}
        <TextInput
          style={styles.input}
          placeholder="키를 입력하세요 (cm)"
          value={currentKid.height}
          onChangeText={v => setCurrentKid({ ...currentKid, height: v })}
          keyboardType="numeric"
          placeholderTextColor="#aaa"
        />
        {/* 몸무게 입력 */}
        <TextInput
          style={styles.input}
          placeholder="몸무게를 입력하세요 (kg)"
          value={currentKid.weight}
          onChangeText={v => setCurrentKid({ ...currentKid, weight: v })}
          keyboardType="numeric"
          placeholderTextColor="#aaa"
        />
      </View>

      {/* 추가하기 버튼 */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: isCurrentKidValid(currentKid) ? '#F28B8C' : '#ccc' }]}
        onPress={handleAddKid}
        disabled={!isCurrentKidValid(currentKid)}
      >
        <Text style={styles.buttonText}>자녀 추가하기</Text>
      </TouchableOpacity>
      {/* 완료 버튼 */}
      <TouchableOpacity style={styles.button} onPress={handleComplete}>
        <Text style={styles.buttonText}>완료</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFEFF1',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    paddingTop:40
  },
  kidCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  kidCardText: {
    fontSize: 15,
    color: '#333',
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 25,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#fff',
    justifyContent: 'center', 
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
    backgroundColor: '#F28B8C',
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
});