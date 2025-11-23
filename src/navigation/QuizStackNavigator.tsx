import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import QuizHomeScreen from '../screens/QuizHomeScreen';
import QuizScreen from '../screens/QuizScreen';

export type QuizStackParamList = {
  QuizHome: undefined;
  QuizScreen: {
    subjectId: string;
    subjectName: string;
    questions: any[];
  };
};

const Stack = createStackNavigator<QuizStackParamList>();

const QuizStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="QuizHome" component={QuizHomeScreen} />
      <Stack.Screen name="QuizScreen" component={QuizScreen} />
    </Stack.Navigator>
  );
};

export default QuizStackNavigator;

