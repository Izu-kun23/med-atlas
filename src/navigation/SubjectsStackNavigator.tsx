import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import SubjectsScreen from '../screens/subjects/SubjectsScreen';
import SubjectDetailsScreen from '../screens/subjects/SubjectDetailsScreen';
import AddNoteScreen from '../screens/notes/AddNoteScreen';
import AddSubjectScreen from '../screens/subjects/AddSubjectScreen';
import AddFolderScreen from '../screens/subjects/AddFolderScreen';

export type SubjectsStackParamList = {
  SubjectsList: undefined;
  SubjectDetails: {
    subjectId: string;
    subjectName: string;
    subjectColor: string;
    subjectBgColor: string;
  };
  AddNote: {
    subjectId: string;
    subjectName: string;
    subjectColor: string;
    subjectBgColor: string;
    noteId?: string; // Optional: if provided, we're editing an existing note
    noteTitle?: string;
    noteContent?: string;
  };
  AddSubject: {
    subjectId?: string; // Optional: if provided, we're editing an existing subject
    subjectName?: string;
    subjectColor?: string;
    subjectBgColor?: string;
    subjectIcon?: string;
    subjectExamDate?: string;
    subjectCoverPhotoUrl?: string;
  } | undefined;
  AddFolder: {
    subjectId: string;
    subjectName: string;
    subjectColor: string;
    subjectBgColor: string;
    folderId?: string; // Optional: if provided, we're editing an existing folder
    folderName?: string;
  };
};

const Stack = createStackNavigator<SubjectsStackParamList>();

const SubjectsStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="SubjectsList" component={SubjectsScreen} />
      <Stack.Screen name="SubjectDetails" component={SubjectDetailsScreen} />
      <Stack.Screen name="AddNote" component={AddNoteScreen} />
      <Stack.Screen
        name="AddSubject"
        component={AddSubjectScreen}
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="AddFolder"
        component={AddFolderScreen}
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default SubjectsStackNavigator;

