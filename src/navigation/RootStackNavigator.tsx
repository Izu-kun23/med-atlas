import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import TabNavigator from './TabNavigator';
import StudySessionScreen from '../screens/study/StudySessionScreen';
import NoteDetailScreen from '../screens/notes/NoteDetailScreen';
import AddEditNoteScreen from '../screens/notes/AddEditNoteScreen';
import MessagesScreen from '../screens/messages/MessagesScreen';
import ChatScreen from '../screens/messages/ChatScreen';

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
  Messages: undefined;
  Chat: {
    friendId: string;
    friendName: string;
    chatId: string;
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
      <Stack.Screen
        name="Messages"
        component={MessagesScreen}
        options={{
          headerShown: false,
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          headerShown: false,
          gestureEnabled: true,
        }}
      />
    </Stack.Navigator>
  );
};

export default RootStackNavigator;

