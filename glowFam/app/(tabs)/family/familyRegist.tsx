import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import DropDownPicker from 'react-native-dropdown-picker';
import { useRouter } from 'expo-router';

export default function FamilyInfoScreen() {
  const [familyName, setFamilyName] = useState('');
  const [familyGoal, setFamilyGoal] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [gender, setGender] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([
    { label: '남자', value: 'M' },
    { label: '여자', value: 'F' },
  ]);
  const [isTooltipVisible, setTooltipVisible] = useState(false);
  const router = useRouter();

  const toggleTooltip = () => {
    setTooltipVisible(!isTooltipVisible);
  };

  const handleComplete = async () => {
    if (!familyName || !familyGoal || !birthDate || !gender || !height || !weight) {
      Alert.alert('Error', '모든 필드를 입력해주세요.');
      return;
    }

    try {
      const response = await fetch('http://your-api-url/family/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          family: { family_nickname: familyName, user_no: 1 }, // user_no는 회원가입 시 저장된 값
          goal: { month_golas_contents: familyGoal },
          kid: {
            kid_height: height,
            kid_weight: weight,
            kid_gender: gender,
            kid_birthday: birthDate,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('데이터 저장 실패');
      }

      Alert.alert('Success', '가족 정보와 자녀 정보가 저장되었습니다.');
      router.replace('../users/login'); // 로그인 화면으로 이동
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>가족 및 자녀 정보 입력</Text>

      {/* 가족 별명 입력 */}
      <TextInput
        style={styles.input}
        placeholder="우리 가족의 별명을 지어주세요!"
        value={familyName}
        onChangeText={setFamilyName}
        placeholderTextColor="#aaa"
      />

      {/* 이달의 목표 입력 */}
      <View style={styles.inputWithTooltip}>
        <TextInput
          style={[styles.input, styles.inputWithIcon]}
          placeholder="이달의 목표를 입력하세요."
          value={familyGoal}
          onChangeText={setFamilyGoal}
          placeholderTextColor="#aaa"
        />
        <TouchableOpacity style={styles.tooltipIconInside} onPress={toggleTooltip}>
          <Text style={styles.tooltipIconText}>?</Text>
        </TouchableOpacity>
      </View>

      {/* 툴팁 텍스트 */}
      {isTooltipVisible && (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipText}>
            이달의 목표 예시 : 1kg 감량하기, 3kg 증량하기 등 뚜렷하게 바꾸고자 하는 목표!
          </Text>
        </View>
      )}

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

      {/* 완료 버튼 */}
      <TouchableOpacity style={styles.button} onPress={handleComplete}>
        <Text style={styles.buttonText}>완료</Text>
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
    backgroundColor: '#FFEFF1',
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
    backgroundColor: '#fff',
  },
  inputWithTooltip: {
    width: '100%',
    position: 'relative',
  },
  inputWithIcon: {
    paddingRight: 40, // 아이콘 공간 확보
  },
  tooltipIconInside: {
    position: 'absolute',
    right: 15,
    top: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tooltipIconText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tooltip: {
    marginTop: 5,
    backgroundColor: '#000',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tooltipText: {
    color: '#fff',
    fontSize: 14,
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