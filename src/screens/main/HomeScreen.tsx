import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/RootStackNavigator';
import { Fonts } from '../../constants/fonts';
import { useTheme } from '../../hooks/useTheme';
import { db, auth } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getResponsivePadding } from '../../utils/responsive';
import { Platform } from 'react-native';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { theme } = useTheme();
  const [userName, setUserName] = useState('User');

  React.useEffect(() => {
    fetchUserName();
  }, []);

  const fetchUserName = async () => {
    const user = auth.currentUser;
    if (!user) {
      setUserName('User');
      return;
    }

    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        const fullName = data.fullName || user.displayName || user.email?.split('@')[0] || 'User';
        setUserName(fullName);
      } else {
        const name = user.displayName || user.email?.split('@')[0] || 'User';
        setUserName(name);
      }
    } catch (error: any) {
      console.error('Error fetching user name:', error);
      const user = auth.currentUser;
      const name = user?.displayName || user?.email?.split('@')[0] || 'User';
      setUserName(name);
    }
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView 
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]} 
      edges={Platform.OS === 'android' ? ['top', 'bottom'] : ['top']}
    >
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        nestedScrollEnabled={true}
      >
        {/* Header with Profile */}
        <View style={styles.headerSection}>
          <View style={styles.headerTop}>
            <View style={styles.headerContent}>
              <View style={[styles.profileAvatar, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.profileAvatarText}>{userName.charAt(0)}</Text>
              </View>
              <View style={styles.headerText}>
                <Text style={[styles.greeting, { color: theme.colors.text }]}>Hi! {userName} 👋</Text>
                <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>Let's explore your notes</Text>
              </View>
            </View>
            <View style={styles.headerIcons}>
              <TouchableOpacity activeOpacity={0.7} style={styles.headerIcon}>
                <Feather name="search" size={24} color={theme.colors.text} />
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7} style={styles.headerIcon}>
                <Feather name="more-vertical" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Goal Card */}
        <View style={styles.goalCardSection}>
          <View style={[styles.goalCard, { borderColor: theme.colors.border }]}>
            <View style={styles.goalCardHeader}>
              <Text style={[styles.goalCardTitle, { color: theme.colors.text }]}>Goal Card</Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Feather name="map-pin" size={18} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.goalCardContent, { color: theme.colors.text }]}>
              The goal is to enhance personal organization and productivity. This overarching objective aims to bring structure and efficiency into daily life...
            </Text>
            <View style={styles.goalCardFooter}>
              <View style={styles.goalCardPill}>
                <Feather name="clock" size={14} color={theme.colors.textSecondary} />
                <Text style={[styles.goalCardPillText, { color: theme.colors.textSecondary }]}>12 Sept 2023</Text>
              </View>
              <TouchableOpacity style={styles.goalCardPill} activeOpacity={0.7}>
                <Feather name="archive" size={14} color={theme.colors.textSecondary} />
                <Text style={[styles.goalCardPillText, { color: theme.colors.textSecondary }]}>Archive</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    ...(Platform.OS === 'android' && {
      paddingTop: 0,
    }),
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'android' ? 24 : 32,
  },
  headerSection: {
    paddingHorizontal: getResponsivePadding(20),
    paddingTop: Platform.OS === 'android' ? 16 : 12,
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerIcon: {
    padding: 4,
  },
  profileAvatar: {
    width: 50,
    height: 50,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: Fonts.bold,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: Fonts.regular,
  },
  goalCardSection: {
    paddingHorizontal: getResponsivePadding(20),
    marginBottom: 20,
  },
  goalCard: {
    backgroundColor: '#F5F5E6',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  goalCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalCardTitle: {
    fontSize: 24,
    fontWeight: '800',
    fontFamily: Fonts.bold,
  },
  goalCardContent: {
    fontSize: 15,
    fontFamily: Fonts.regular,
    lineHeight: 22,
    marginBottom: 16,
  },
  goalCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalCardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 20,
  },
  goalCardPillText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
  },
});

export default HomeScreen;