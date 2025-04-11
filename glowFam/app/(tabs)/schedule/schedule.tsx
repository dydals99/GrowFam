// schedule.tsx
import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, SafeAreaView, Alert, ScrollView,} from "react-native";
import { API_URL } from "../../../constants/config";

interface ScheduleType {
  scheduleNo: number;
  scheduleContent: string;
  scheduleDate: string;
  totalCount: number;
  completedCount: number;
  lastCheckDate?: string; 
}

const famliy_no = 34;

export default function ScheduleScreen() {
  const [monthGoal, setMonthGoal] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [scheduleContent, setScheduleContent] = useState("");
  const [registeredSchedules, setRegisteredSchedules] = useState<ScheduleType[]>([]);

  const getTodayString = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
      today.getDate()
    ).padStart(2, "0")}`;
  };

  const getRemainingDaysInMonth = () => {
    const today = new Date();
    const totalDaysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    return totalDaysInMonth - today.getDate() + 1;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${String(date.getMonth() + 1).padStart(2, "0")}월${String(date.getDate()).padStart(2, "0")}일`;
  };

  const getMonthLastDay = (dateString: string) => {
    const date = new Date(dateString);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    return String(lastDay).padStart(2, "0");
  };

  const toggleModal = () => {
    setModalVisible(!modalVisible);
  };

  // 가족 목표(이달의 목표)를 가져오는 함수
  const fetchFamilyGoal = async () => {
    try {
      const response = await fetch(`${API_URL}/schedule/family-goal/${famliy_no}`);
      if (!response.ok) throw new Error("가족 목표 조회에 실패했습니다.");
      const data = await response.json();
      setMonthGoal(data.month_golas_contents);
    } catch (error: any) {
      Alert.alert("오류", error.message);
    }
  };

  // 등록된 일정을 가져오는 함수
  const fetchSchedules = async () => {
    try {
      const response = await fetch(`${API_URL}/schedule/${famliy_no}`);
      if (!response.ok) throw new Error("일정 조회에 실패했습니다.");
      const data = await response.json();

      const parsedSchedules: ScheduleType[] = data.map((item: any) => ({
        scheduleNo: item.scheduleNo,
        scheduleContent: item.scheduleContent,
        scheduleDate: item.scheduleDate,
        totalCount: item.totalCount,
        completedCount: item.completedCount,
        lastCheckDate: item.lastCheckDate, // lastCheckDate 추가
      }));

      setRegisteredSchedules(parsedSchedules);
    } catch (error: any) {
      Alert.alert("오류", error.message);
    }
  };

  const fetchScheduleWithCheck = async (scheduleNo: number) => {
    try {
      const response = await fetch(`${API_URL}/schedule/check-status/${scheduleNo}`);
      if (!response.ok) throw new Error("체크 상태 조회에 실패했습니다.");
      const data = await response.json();

      setRegisteredSchedules((prev) =>
        prev.map((item) => {
          if (item.scheduleNo === scheduleNo) {
            return { ...item, completedCount: data.completedCount };
          }
          return item;
        })
      );
    } catch (error: any) {
      Alert.alert("오류", error.message);
    }
  };

  useEffect(() => {
    fetchFamilyGoal();
    fetchSchedules();
  }, []);

  const registerSchedule = async () => {
    const scheduleDate = getTodayString();
    const remainingDays = getRemainingDaysInMonth();

    const payload = {
      famliy_no: famliy_no,
      schedule_cotents: scheduleContent,
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
        totalCount: data.scheduleTotalCount,
        completedCount: 0,
      };

      // 상태 업데이트: 새로 등록된 데이터를 추가
      setRegisteredSchedules((prev) => [...prev, newSchedule]);

      Alert.alert("완료", "일정이 등록되었습니다.");
      setModalVisible(false);
      setScheduleContent("");
    } catch (error: any) {
      Alert.alert("오류", error.message);
    }
  };

  // 체크 수를 백엔드에 업데이트하는 함수
  const updateScheduleCheck = async (scheduleNo: number): Promise<number | null> => {
    try {
      const response = await fetch(`${API_URL}/schedule/check/${scheduleNo}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ increment: 1 }), // increment 값을 1로 고정
      });
      if (!response.ok) throw new Error("체크 업데이트에 실패했습니다.");
      const data = await response.json();
      // data: { schedule_no: number, schedule_check_count: newCount }
      return data.schedule_check_count;
    } catch (error: any) {
      Alert.alert("오류", error.message);
      return null;
    }
  };

  const handleCheckPress = async (scheduleNo: number) => {
    const target = registeredSchedules.find((item) => item.scheduleNo === scheduleNo);
    if (!target) return;

    if (target.completedCount >= target.totalCount) {
      Alert.alert("완료", "이미 모두 체크되었습니다.");
      return;
    }

    if (target.lastCheckDate === new Date().toISOString().split("T")[0]) {
      Alert.alert("오류", "오늘은 이미 체크했습니다.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/schedule/check/${scheduleNo}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ increment: 1 }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.detail === "오늘은 이미 체크했습니다.") {
          Alert.alert("오류", "오늘은 이미 체크했습니다.");
          return;
        }
        throw new Error("체크 상태 업데이트에 실패했습니다.");
      }

      const data = await response.json();
      setRegisteredSchedules((prev) =>
        prev.map((item) => {
          if (item.scheduleNo === scheduleNo) {
            return { ...item, completedCount: data.schedule_check_count, lastCheckDate: new Date().toISOString().split("T")[0] };
          }
          return item;
        })
      );
      Alert.alert("체크 완료", "체크가 되었습니다.");
    } catch (error: any) {
      Alert.alert("오류", error.message);
    }
  };

  const renderCheckButton = (schedule: ScheduleType) => {
    const isDisabled = schedule.lastCheckDate === new Date().toISOString().split("T")[0];

    return (
      <TouchableOpacity
        style={[
          styles.checkButton,
          isDisabled && { backgroundColor: "#ccc" },
        ]}
        onPress={() => handleCheckPress(schedule.scheduleNo)}
        disabled={isDisabled}
      >
        <Text style={styles.checkButtonText}>체크</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.screenTitle}>일정 관리</Text>

      {/* 이달의 목표 섹션: 백엔드에서 가져온 값을 표시 */}
      <View style={styles.goalSection}>
        <Text style={styles.goalLabel}>이달의 목표</Text>
        <Text style={styles.goalText}>
          {monthGoal || "목표가 설정되어 있지 않습니다."}
        </Text>
      </View>

      <TouchableOpacity style={styles.addButton} onPress={toggleModal}>
        <Text style={styles.addButtonText}>＋</Text>
      </TouchableOpacity>

      <ScrollView style={styles.registeredList}>
        {registeredSchedules.map((schedule) => {
          const month = new Date(schedule.scheduleDate).getMonth() + 1;
          const startDay = new Date(schedule.scheduleDate).getDate();
          const dateRange = `${month}월${String(startDay).padStart(2, "0")}일 ~ ${month}월${getMonthLastDay(
            schedule.scheduleDate
          )}일`;

          return (
            <View key={schedule.scheduleNo} style={styles.registeredContainer}>
              <Text style={styles.registeredText}>
                등록된 일정: {schedule.scheduleContent}
              </Text>
              <Text style={styles.registeredText}>
                시작일: {dateRange} / 미션 현황: {schedule.completedCount}/{schedule.totalCount}
              </Text>
              {renderCheckButton(schedule)}
            </View>
          );
        })}
      </ScrollView>

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
              placeholder="예) 식단하기, 운동하기"
              value={scheduleContent}
              onChangeText={setScheduleContent}
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
                <Text style={styles.modalButtonText}>추가</Text>
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
    backgroundColor: "#b7d6bb",
    padding: 16,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
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
  },
  goalText: {
    fontSize: 16,
    color: "#333",
  },
  addButton: {
    position: "absolute",
    right: 20,
    bottom: 40,
    backgroundColor: "#FF6961",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  addButtonText: {
    fontSize: 36,
    color: "#fff",
    lineHeight: 36,
  },
  registeredList: {
    marginBottom: 100,
  },
  registeredContainer: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  registeredText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 4,
  },
  checkButton: {
    alignSelf: "flex-end",
    backgroundColor: "#4CAF50",
    borderRadius: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  checkButtonText: {
    color: "#fff",
    fontWeight: "bold",
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
    backgroundColor: "#FF6961",
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
