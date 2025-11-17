import React, { useMemo } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import UIcons from '../components/icons/UIcons';
import { Colors } from '../constants/colors';
import HomeScreen from '../screens/HomeScreen';
import SubjectsScreen from '../screens/SubjectsScreen';
import CalendarScreen from '../screens/CalendarScreen';
import QuizHomeScreen from '../screens/QuizHomeScreen';
import MoreMenuScreen from '../screens/MoreMenuScreen';

const Tab = createBottomTabNavigator();

type TabNavigatorProps = {
  userRole?: 'STUDENT' | 'INTERN' | 'WORKER';
};

const TabNavigator: React.FC<TabNavigatorProps> = ({ userRole = 'STUDENT' }) => {
  const insets = useSafeAreaInsets();
  const isIntern = userRole === 'INTERN' || userRole === 'WORKER';

  const screenOptions = ({ route }: { route: any }) => ({
    tabBarIcon: ({ focused, color, size }: { focused: boolean; color: string; size: number }) => {
      let iconName: string;

      if (route.name === 'Today') {
        iconName = 'fi-rr-house-chimney';
      } else if (route.name === 'Subjects') {
        iconName = 'fi-rr-books';
      } else if (route.name === 'Calendar') {
        iconName = 'fi-rr-calendar-lines';
      } else if (route.name === 'Quizzes') {
        iconName = 'fi-rr-task-checklist';
      } else if (route.name === 'More') {
        iconName = 'fi-rr-more-horizontal';
      } else {
        iconName = 'fi-rr-house-chimney';
      }

      return <UIcons name={iconName} size={size} color={color} />;
    },
    tabBarActiveTintColor: Colors.roseRed,
    tabBarInactiveTintColor: Colors.coolGrey,
    tabBarStyle: {
      backgroundColor: Colors.white,
      borderTopWidth: 1,
      borderTopColor: Colors.fogGrey,
      height: 66 + Math.max(insets.bottom - 5, 0),
      paddingBottom: Math.max(insets.bottom, 5),
      paddingTop: 8,
    },
    tabBarLabelStyle: {
      fontSize: 12,
      fontWeight: '600' as const,
      marginTop: 4,
    },
    headerShown: false,
  });

  const subjectsOptions = useMemo(
    () => ({
      tabBarLabel: isIntern ? 'Rotations' : 'Subjects',
    }),
    [isIntern],
  );

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen name="Today" component={HomeScreen} />
      <Tab.Screen name="Subjects" component={SubjectsScreen} options={subjectsOptions} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Quizzes" component={QuizHomeScreen} />
      <Tab.Screen name="More" component={MoreMenuScreen} />
    </Tab.Navigator>
  );
};

export default TabNavigator;
