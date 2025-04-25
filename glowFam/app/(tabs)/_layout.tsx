import { Tabs } from 'expo-router';
import BottomNav from './comm/bottomNav';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => {
        const hiddenTabs = ['users/login', 'users/regist'];
        return {
          headerShown: false,
          tabBarStyle: hiddenTabs.includes(route.name) ? { display: 'none' } : {},
        };
      }}
      tabBar={(props) => {
        const routeName = props.state?.routes[props.state.index]?.name ?? '';
        const hiddenTabs = ['users/login', 'users/regist'];
        return hiddenTabs.includes(routeName) ? null : <BottomNav {...props} />;
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="community/community" options={{ title: 'Community' }} />
      <Tabs.Screen name="schedule/schedule" options={{ title: 'Schedule' }} />
      <Tabs.Screen name="graph/graph" options={{ title: 'Graph' }} />
      <Tabs.Screen name="users/login" options={{ title: 'Login' }} />
      <Tabs.Screen name="users/regist" options={{ title: 'Register' }} />
    </Tabs>
  );
}
