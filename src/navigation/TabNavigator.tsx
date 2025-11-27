import React, { useMemo } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import UIcons from '../components/icons/UIcons';
import { useTheme } from '../hooks/useTheme';
import HomeScreen from '../screens/main/HomeScreen';
import SubjectsStackNavigator from './SubjectsStackNavigator';
import CalendarScreen from '../screens/main/CalendarScreen';
import QuizStackNavigator from './QuizStackNavigator';
import MoreMenuScreen from '../screens/main/MoreMenuScreen';

const Tab = createBottomTabNavigator();

type TabNavigatorProps = {
  userRole?: 'STUDENT' | 'INTERN' | 'WORKER';
};

const TabNavigator: React.FC<TabNavigatorProps> = ({ userRole = 'STUDENT' }) => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
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
    tabBarActiveTintColor: theme.colors.primary,
    tabBarInactiveTintColor: theme.colors.textSecondary,
    tabBarStyle: {
      backgroundColor: theme.colors.card,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
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
      <Tab.Screen name="Subjects" component={SubjectsStackNavigator} options={subjectsOptions} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Quizzes" component={QuizStackNavigator} />
      <Tab.Screen name="More" component={MoreMenuScreen} />
    </Tab.Navigator>
  );
};

export default TabNavigator;
