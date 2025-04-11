import { Tabs } from 'expo-router';
import BottomNav from './comm/bottomNav';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <BottomNav {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="community/community" options={{ title: 'Community' }} />
      {/* <Tabs.Screen name="community/communityDetail" options={{ title: 'CommunityDetail',tabBarStyle: { display: 'none' }}} /> */}
      <Tabs.Screen name="schedule/schedule" options={{ title: 'Schedule' }} />
      <Tabs.Screen name="graph/graph" options={{ title: 'Graph' }} />
    </Tabs>
  );
}
