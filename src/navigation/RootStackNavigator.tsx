import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import TabNavigator from './TabNavigator';
import StudySessionScreen from '../screens/StudySessionScreen';
import NoteDetailScreen from '../screens/NoteDetailScreen';
import AddEditNoteScreen from '../screens/AddEditNoteScreen';

export type RootStackParamList = {
  MainTabs: undefined;
  StudySession: undefined;
  NoteDetail: {
    note: {
      id: string;
      title: string;
      content: string;
      createdAt?: any;
    };
    subjectColor?: string;
    elapsedSeconds: number;
    isSessionActive: boolean;
  };
  AddEditNote: {
    subjectId: string;
    subjectColor?: string;
    sessionId?: string;
    elapsedSeconds: number;
    isSessionActive: boolean;
    noteId?: string;
    noteTitle?: string;
    noteContent?: string;
  };
};

const Stack = createStackNavigator<RootStackParamList>();

type RootStackNavigatorProps = {
  userRole?: 'STUDENT' | 'INTERN' | 'WORKER';
};

const RootStackNavigator: React.FC<RootStackNavigatorProps> = ({ userRole = 'STUDENT' }) => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MainTabs">
        {(props) => <TabNavigator {...props} userRole={userRole} />}
      </Stack.Screen>
      <Stack.Screen
        name="StudySession"
        component={StudySessionScreen}
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="NoteDetail"
        component={NoteDetailScreen}
        options={{
          headerShown: false,
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="AddEditNote"
        component={AddEditNoteScreen}
        options={{
          headerShown: false,
          gestureEnabled: true,
        }}
      />
    </Stack.Navigator>
  );
};

export default RootStackNavigator;

