import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  TouchableOpacity,
  Modal,
  ScrollView, TextInput
} from "react-native";
import { Calendar } from "react-native-calendars";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../../../constants/config";
import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect } from "react";

interface ScheduleType {
  scheduleNo: number;
  scheduleContent: string;
  scheduleDate: string;
  totalCount: number;
  completedCount: number;
  lastCheckDate?: string;
}
interface ScheduleCheckLog {
  familyNo : number;
  scheduleCheckLog: string; 
}
let family_no = 0;

const fetchFamilyNo = async () => {
  try {
    const token = await AsyncStorage.getItem("access_token");
    if (!token) throw new Error("JWT 토큰이 없습니다.");

    const userNo = await AsyncStorage.getItem("user_no");
    if (!userNo) throw new Error("사용자 번호를 찾을 수 없습니다.");

    const familyResponse = await fetch(`${API_URL}/users/family/${userNo}`);
    if (!familyResponse.ok) throw new Error("가족 정보를 가져오는데 실패했습니다.");
    const familyData = await familyResponse.json();
    return familyData.family_no;
  } catch (error) {
    Alert.alert("오류", error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.");
    return null;
  }
};

// 유틸리티 함수
const parseSchedules = (data: any[]): ScheduleType[] => {
  return data.map((item: any) => ({
    scheduleNo: item.scheduleNo,
    scheduleContent: item.scheduleContent,
    scheduleDate: item.scheduleDate,
    totalCount: item.totalCount,
    completedCount: item.completedCount,
    lastCheckDate: item.lastCheckDate,
  }));
};

const logsSchedules = (data: any[]): { familyNo: number; scheduleCheckLog: Date }[] => {
  return data.map((item: any) => ({
    familyNo: item.family_no, // API 응답의 필드 이름과 일치시킴
    scheduleCheckLog: new Date(item.schedule_check_date_log), // 올바른 필드 사용
  }));
};

export default function ScheduleScreen() {
  const [monthGoal, setMonthGoal] = useState(""); // 이달의 목표
  const [markedDates, setMarkedDates] = useState({}); // 캘린더 표시 데이터
  const [registeredSchedules, setRegisteredSchedules] = useState<ScheduleType[]>([]); // 등록된 일정
  const [modalVisible, setModalVisible] = useState(false); // 모달 창 상태
  const [newScheduleContent, setNewScheduleContent] = useState(""); // 새 일정 내용
  const [selectedTime, setSelectedTime] = useState(new Date()); // 시간 선택

  const checkSchedule = async (scheduleNo: number): Promise<void> => {
    try {
      // 해당 일정 찾기
      const schedule = registeredSchedules.find((s) => s.scheduleNo === scheduleNo);
      if (!schedule) {
        Alert.alert("오류", "일정을 찾을 수 없습니다.");
        return;
      }

      // 이미 오늘 체크된 일정인지 확인
      const todayString = getTodayString();
      if (schedule.lastCheckDate === todayString) {
        Alert.alert("알림", "이미 오늘 체크된 일정입니다.");
        return;
      }

      // 체크 API 호출
      const response = await fetch(`${API_URL}/schedule/check/${scheduleNo}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ increment: 1 }),
      });
      if (!response.ok) throw new Error("체크 업데이트에 실패했습니다.");
      const data = await response.json();

      // 일정 리스트 업데이트
      setRegisteredSchedules((prev) =>
        prev.map((s) =>
          s.scheduleNo === scheduleNo
            ? { ...s, completedCount: data.schedule_check_count, lastCheckDate: todayString }
            : s
        )
      );

      // 체크 로그 다시 가져오기
      await fetchScheduleCheckLogs();

      Alert.alert("완료", "일정이 체크되었습니다.");
    } catch (error: any) {
      Alert.alert("오류", error.message);
    }
  };

  // 이달의 목표 가져오기
  const fetchFamilyGoal = async () => {
    try {
      const response = await fetch(`${API_URL}/schedule/family-goal/${family_no}`);
      if (!response.ok) throw new Error("가족 목표 조회에 실패했습니다.");
      const data = await response.json();
      setMonthGoal(data.month_golas_contents || "목표가 설정되어 있지 않습니다.");
    } catch (error: any) {
      Alert.alert("오류", error.message);
    }
  };

  // 일정 가져오기
  const fetchSchedules = async () => {
    try {
      const response = await fetch(`${API_URL}/schedule/${family_no}`);
      if (!response.ok) throw new Error("일정 조회에 실패했습니다.");
      const data = await response.json();

      const parsedSchedules = parseSchedules(data);

      setRegisteredSchedules(parsedSchedules);

      const marked = parsedSchedules.reduce<Record<string, { marked: boolean; dotColor: string }>>((acc, schedule) => {
        acc[schedule.scheduleDate] = { marked: true, dotColor: "green" };
        return acc;
      }, {});
      setMarkedDates(marked);
    } catch (error: any) {
      Alert.alert("오류", error.message);
    }
  };

  const fetchScheduleCheckLogs = async () => {
    try {
      const response = await fetch(`${API_URL}/schedule/check-logs/${family_no}`);
      if (!response.ok) throw new Error("체크 로그를 가져오는데 실패했습니다.");
      const data: ScheduleCheckLog[] = await response.json();

      const parsedLogs = logsSchedules(data);


      const marked = parsedLogs.reduce<Record<string, { customStyles: { container: any; text: any } }>>((acc, log) => {
      const dateString = `${log.scheduleCheckLog.getFullYear()}-${String
        (log.scheduleCheckLog.getMonth() + 1).padStart(2,"0")}-${String(log.scheduleCheckLog.getDate()).padStart(2, "0")}`;
      acc[dateString] = {
        customStyles: {
          container: {
            borderWidth: 1.5,
            borderColor: "#b7d6bb",
            borderRadius: 25, 
          },
          text: {},
        },
      };
      return acc;
      }, {});
      setMarkedDates((prev) => ({ ...prev, ...marked }));
    } catch (error: any) {
      Alert.alert("오류", error.message);
    }
  };

  // 오늘 날짜 가져오기
  const getTodayString = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
      today.getDate()
    ).padStart(2, "0")}`;
  };
  // 모달 열기/닫기
  const toggleModal = () => {
    setModalVisible(!modalVisible);
  };
   const getRemainingDaysInMonth = () => {
    const today = new Date();
    const totalDaysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    return totalDaysInMonth - today.getDate() + 1;
  };
  // 새 일정 등록
  const registerSchedule = async () => {
    const scheduleDate = getTodayString();
    const remainingDays = getRemainingDaysInMonth();
  
    if (!newScheduleContent.trim()) {
      Alert.alert("오류", "일정 내용을 입력해주세요.");
      return;
    }
  
    const payload = {
      family_no: family_no,
      schedule_cotents: newScheduleContent,
      schedule_date: scheduleDate,
      schedule_check_count: remainingDays,
    };
  
    try {
      const response = await fetch(`${API_URL}/schedule/write`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("일정 등록에 실패했습니다.");
      const data = await response.json();
  
      const newSchedule: ScheduleType = {
        scheduleNo: data.scheduleNo,
        scheduleContent: data.scheduleContent,
        scheduleDate: data.scheduleDate,
        totalCount: data.totalCount,
        completedCount: data.completedCount || 0,
      };
  
      setRegisteredSchedules((prev) => [...prev, newSchedule]);
  
      setMarkedDates((prev) => ({
        ...prev,
        [newSchedule.scheduleDate]: { marked: true, dotColor: "green" },
      }));
      await fetchSchedules();
      Alert.alert("완료", "일정이 등록되었습니다.");
      toggleModal();
      setNewScheduleContent("");
    } catch (error: any) {
      Alert.alert("오류", error.message);
    }
  };
  
  // 초기 데이터 로드
  useFocusEffect(
    useCallback(() => {
      const initializeData = async () => {
        const familyNo = await fetchFamilyNo();
        if (familyNo) {
          family_no = familyNo;
          await fetchFamilyGoal();
          await fetchSchedules();
          await fetchScheduleCheckLogs(); // 체크 로그 가져오기
        }
      };
      initializeData();
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* 이달의 목표 */}
        <View style={styles.goalSection}>
          <Text style={styles.goalLabel}>이달의 목표</Text>
          <Text style={styles.goalText}>{monthGoal}</Text>
        </View>

        {/* 일정 리스트 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>일정</Text>
            <TouchableOpacity onPress={toggleModal} style={styles.addButton}>
              <Text style={styles.addButtonText}>＋</Text>
            </TouchableOpacity>
          </View>
          
          {registeredSchedules.length > 0 ? (
          registeredSchedules.map((schedule) => {
            const isToday = schedule.scheduleDate === getTodayString();
            const month = new Date(schedule.scheduleDate).getMonth() + 1;
            const startDay = new Date(schedule.scheduleDate).getDate();
            const dateRange = `${month}월${String(startDay).padStart(2, "0")}일`;

          
            const isCheckedToday = schedule.lastCheckDate === getTodayString();

            return (
              <View key={schedule.scheduleNo} style={styles.scheduleItem}>
                <Text style={styles.scheduleContent}>
                  {schedule.scheduleContent}
                </Text>
                <Text style={styles.scheduleProgress}>
                  [{dateRange}] {schedule.completedCount}/{schedule.totalCount}
                </Text>
                {/* 체크 버튼 */}
                <TouchableOpacity
                  onPress={() => !isCheckedToday && checkSchedule(schedule.scheduleNo)}
                  style={[
                    styles.checkButton,
                    isCheckedToday && styles.checkButtonDisabled, // 이미 체크된 경우 스타일 변경
                  ]}
                  disabled={isCheckedToday} // 이미 체크된 경우 비활성화
                >
                  <Text style={styles.checkButtonText}>✓</Text>
                </TouchableOpacity>
              </View>
            );
          })
        ) : (
          <Text style={styles.noSchedulesText}>등록된 일정이 없습니다.</Text>
        )}
        </View>
        {/* 캘린더 */}
        <Calendar
          current={new Date().toISOString().split("T")[0]}
          markedDates={markedDates}
          markingType="custom" // 기본 점 표시로 변경
          theme={{
            selectedDayBackgroundColor: "#00adf5",
            todayTextColor: "#00adf5",
            arrowColor: "orange",
          }}
        />
      </ScrollView>
      
      {/* 모달 창 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={toggleModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>새 일정 등록</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="일정 내용을 입력하세요"
              value={newScheduleContent}
              onChangeText={setNewScheduleContent}
            />
            <Text style={styles.modalLabel}>시간 선택</Text>
            <DateTimePicker
              value={selectedTime}
              mode="time"
              display="default"
              onChange={(event, date) => {
                if (date) setSelectedTime(date);
              }}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={toggleModal}
              >
                <Text style={styles.modalButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.addConfirmButton]}
                onPress={registerSchedule}
              >
                <Text style={styles.modalButtonText}>등록</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 16,
  },
  goalSection: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  goalLabel: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  goalText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  addButton: {
    backgroundColor: "#b7d6bb",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addButtonText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
  },
  scheduleItem: {
    flexDirection: "row", // 가로 정렬
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  scheduleContent: {
    fontSize: 16,
    color: "#333",
    flex: 1, 
  },
  scheduleProgress: {
    fontSize: 14,
    color: "#666",
    marginRight: 10,
  },
  checkButton: {
    backgroundColor: "#b7d6bb",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  checkButtonDisabled: {
    backgroundColor: "#ccc",
  },
  checkButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },
  noSchedulesText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#ccc",
  },
  addConfirmButton: {
    backgroundColor: "#4CAF50",
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});