import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Feather } from '@expo/vector-icons';
import SvgIcon from '../../components/SvgIcon';
import { Fonts } from '../../constants/fonts';
import { Colors } from '../../constants/colors';
import { db, auth } from '../../lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  getDoc,
  orderBy,
  limit,
} from 'firebase/firestore';
import { RootStackParamList } from '../../navigation/RootStackNavigator';

type MessagesNavigationProp = StackNavigationProp<RootStackParamList, 'Messages'>;

type FriendRequest = {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: any;
  fromUserName?: string;
  fromUserEmail?: string;
};

type Friend = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  addedAt: any;
  lastMessage?: string;
  lastMessageTime?: any;
  unreadCount?: number;
};

const MessagesScreen: React.FC = () => {
  const navigation = useNavigation<MessagesNavigationProp>();
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'connect'>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [schoolUsers, setSchoolUsers] = useState<any[]>([]);
  const [currentUserSchool, setCurrentUserSchool] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingSchoolUsers, setIsLoadingSchoolUsers] = useState(false);

  const currentUserId = auth.currentUser?.uid;

  useEffect(() => {
    if (currentUserId) {
      fetchCurrentUserSchool();
      fetchFriends();
      fetchFriendRequests();
    }
  }, [currentUserId]);

  useEffect(() => {
    if (activeTab === 'connect' && currentUserSchool) {
      fetchSchoolUsers();
    }
  }, [activeTab, currentUserSchool]);

  const fetchCurrentUserSchool = async () => {
    if (!currentUserId) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', currentUserId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        // Check for university field - prioritize onboardingResponses.studentDetails.university
        // This is where it's stored based on the Firebase document structure
        const university = 
          userData.onboardingResponses?.studentDetails?.university ||
          userData.university || 
          userData.school || 
          userData.studentDetails?.university || 
          '';
        // Store the original university name (with original casing)
        setCurrentUserSchool(university);
        console.log('Current user university:', university);
      } else {
        console.log('User document does not exist');
      }
    } catch (error) {
      console.error('Error fetching user school:', error);
    }
  };

  // Helper function to normalize university names for fuzzy matching
  // Handles case differences, typos, and spacing variations
  const normalizeUniversity = (university: string): string => {
    if (!university) return '';
    
    // Convert to lowercase and trim
    let normalized = university.trim().toLowerCase();
    
    // Fix common typos
    normalized = normalized.replace(/univeristy/gi, 'university');
    normalized = normalized.replace(/univerity/gi, 'university');
    normalized = normalized.replace(/universtiy/gi, 'university');
    normalized = normalized.replace(/univesity/gi, 'university');
    
    // Remove extra spaces
    normalized = normalized.replace(/\s+/g, ' ');
    
    return normalized.trim();
  };

  // Helper function to check if two universities match (fuzzy matching)
  const universitiesMatch = (uni1: string, uni2: string): boolean => {
    if (!uni1 || !uni2) return false;
    
    const normalized1 = normalizeUniversity(uni1);
    const normalized2 = normalizeUniversity(uni2);
    
    // Exact match after normalization
    if (normalized1 === normalized2) return true;
    
    // Check if one contains the other (for partial matches)
    // This handles cases like "Nile University" vs "Nile University of Technology"
    if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
      // Only match if the shorter one is at least 5 characters (to avoid false matches)
      const shorter = normalized1.length < normalized2.length ? normalized1 : normalized2;
      if (shorter.length >= 5) {
        return true;
      }
    }
    
    return false;
  };

  const fetchSchoolUsers = async () => {
    if (!currentUserId || !currentUserSchool) {
      console.log('Cannot fetch school users:', { currentUserId, currentUserSchool });
      return;
    }

    try {
      setIsLoadingSchoolUsers(true);
      console.log('Fetching users from university:', currentUserSchool);
      
      // Normalize the current user's university for fuzzy matching
      const normalizedCurrentUniversity = normalizeUniversity(currentUserSchool);
      console.log('Normalized current university:', normalizedCurrentUniversity);
      
      // Since university is stored in onboardingResponses.studentDetails.university (nested),
      // Firestore can't query it directly. We need to fetch users and filter in memory.
      // Also, Firestore queries are case-sensitive, so we need to do fuzzy matching in memory
      let allUsers: any[] = [];
      const processedIds = new Set<string>();
      
      // Fetch all users and filter by nested university field with fuzzy matching
      // This is necessary because:
      // 1. Firestore can't query nested fields directly
      // 2. Firestore queries are case-sensitive, but we want case-insensitive matching
      // 3. We want to handle typos and variations
      const allUsersQuery = query(collection(db, 'users'), limit(200));
      const allUsersSnapshot = await getDocs(allUsersQuery);
      
      allUsersSnapshot.docs.forEach((doc) => {
        const userData = doc.data();
        // Check all possible locations for university - prioritize onboardingResponses path
        const userUniversity = 
          userData.onboardingResponses?.studentDetails?.university ||
          userData.university || 
          userData.school || 
          userData.studentDetails?.university || 
          '';
        
        // Use fuzzy matching to handle typos and case differences
        if (
          doc.id !== currentUserId &&
          !processedIds.has(doc.id) &&
          universitiesMatch(userUniversity, currentUserSchool) &&
          userUniversity !== ''
        ) {
          allUsers.push({ id: doc.id, ...userData });
          processedIds.add(doc.id);
          console.log(`Matched user: ${userData.fullName || userData.email} - University: "${userUniversity}" matches "${currentUserSchool}"`);
        }
      });
      
      console.log(`Total users found from ${currentUserSchool} (fuzzy matching): ${allUsers.length}`);
      setSchoolUsers(allUsers);
    } catch (error) {
      console.error('Error fetching school users:', error);
      setSchoolUsers([]);
    } finally {
      setIsLoadingSchoolUsers(false);
    }
  };

  const fetchFriends = async () => {
    if (!currentUserId) return;

    try {
      setIsLoading(true);
      // Get friends where current user is either user1 or user2
      const friendsQuery1 = query(
        collection(db, 'friends'),
        where('user1Id', '==', currentUserId),
        where('status', '==', 'accepted')
      );
      const friendsQuery2 = query(
        collection(db, 'friends'),
        where('user2Id', '==', currentUserId),
        where('status', '==', 'accepted')
      );

      const [snapshot1, snapshot2] = await Promise.all([
        getDocs(friendsQuery1),
        getDocs(friendsQuery2),
      ]);

      const friendsList: Friend[] = [];

      // Process friends where current user is user1
      for (const friendDoc of snapshot1.docs) {
        const friendData = friendDoc.data();
        const friendUserId = friendData.user2Id;
        const userDoc = await getDoc(doc(db, 'users', friendUserId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          // Get last message
          const messagesQuery = query(
            collection(db, 'messages'),
            where('chatId', '==', friendDoc.id),
            orderBy('createdAt', 'desc'),
            limit(1)
          );
          const messagesSnapshot = await getDocs(messagesQuery);
          let lastMessage = '';
          let lastMessageTime = null;
          if (!messagesSnapshot.empty) {
            const lastMsg = messagesSnapshot.docs[0].data();
            lastMessage = lastMsg.text || '';
            lastMessageTime = lastMsg.createdAt;
          }

          friendsList.push({
            id: friendDoc.id,
            userId: friendUserId,
            userName: userData.name || userData.email || 'Unknown',
            userEmail: userData.email || '',
            addedAt: friendData.createdAt,
            lastMessage,
            lastMessageTime,
          });
        }
      }

      // Process friends where current user is user2
      for (const friendDoc of snapshot2.docs) {
        const friendData = friendDoc.data();
        const friendUserId = friendData.user1Id;
        const userDoc = await getDoc(doc(db, 'users', friendUserId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          // Get last message
          const messagesQuery = query(
            collection(db, 'messages'),
            where('chatId', '==', friendDoc.id),
            orderBy('createdAt', 'desc'),
            limit(1)
          );
          const messagesSnapshot = await getDocs(messagesQuery);
          let lastMessage = '';
          let lastMessageTime = null;
          if (!messagesSnapshot.empty) {
            const lastMsg = messagesSnapshot.docs[0].data();
            lastMessage = lastMsg.text || '';
            lastMessageTime = lastMsg.createdAt;
          }

          friendsList.push({
            id: friendDoc.id,
            userId: friendUserId,
            userName: userData.name || userData.email || 'Unknown',
            userEmail: userData.email || '',
            addedAt: friendData.createdAt,
            lastMessage,
            lastMessageTime,
          });
        }
      }

      setFriends(friendsList);
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFriendRequests = async () => {
    if (!currentUserId) return;

    try {
      const incomingQuery = query(
        collection(db, 'friendRequests'),
        where('toUserId', '==', currentUserId),
        where('status', '==', 'pending')
      );
      const outgoingQuery = query(
        collection(db, 'friendRequests'),
        where('fromUserId', '==', currentUserId),
        where('status', '==', 'pending')
      );

      const [incomingSnapshot, outgoingSnapshot] = await Promise.all([
        getDocs(incomingQuery),
        getDocs(outgoingQuery),
      ]);

      const requests: FriendRequest[] = [];

      // Process incoming requests
      for (const reqDoc of incomingSnapshot.docs) {
        const reqData = reqDoc.data();
        const fromUserDoc = await getDoc(doc(db, 'users', reqData.fromUserId));
        if (fromUserDoc.exists()) {
          const fromUserData = fromUserDoc.data();
          requests.push({
            id: reqDoc.id,
            ...reqData,
            fromUserName: fromUserData.name || fromUserData.email || 'Unknown',
            fromUserEmail: fromUserData.email || '',
          } as FriendRequest);
        }
      }

      // Process outgoing requests
      for (const reqDoc of outgoingSnapshot.docs) {
        const reqData = reqDoc.data();
        const toUserDoc = await getDoc(doc(db, 'users', reqData.toUserId));
        if (toUserDoc.exists()) {
          const toUserData = toUserDoc.data();
          requests.push({
            id: reqDoc.id,
            ...reqData,
            fromUserName: toUserData.name || toUserData.email || 'Unknown',
            fromUserEmail: toUserData.email || '',
          } as FriendRequest);
        }
      }

      setFriendRequests(requests);
    } catch (error) {
      console.error('Error fetching friend requests:', error);
    }
  };

  const searchUsers = async (searchText: string) => {
    if (!searchText.trim() || !currentUserId) return;

    try {
      setIsSearching(true);
      const usersQuery = query(
        collection(db, 'users'),
        where('email', '>=', searchText),
        where('email', '<=', searchText + '\uf8ff'),
        limit(10)
      );
      const snapshot = await getDocs(usersQuery);
      const results = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((user) => user.id !== currentUserId);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const sendFriendRequest = async (toUserId: string) => {
    if (!currentUserId) return;

    try {
      // Check if request already exists
      const existingRequestQuery = query(
        collection(db, 'friendRequests'),
        where('fromUserId', '==', currentUserId),
        where('toUserId', '==', toUserId),
        where('status', '==', 'pending')
      );
      const existingSnapshot = await getDocs(existingRequestQuery);
      if (!existingSnapshot.empty) {
        return; // Request already sent
      }

      await addDoc(collection(db, 'friendRequests'), {
        fromUserId: currentUserId,
        toUserId,
        status: 'pending',
        createdAt: new Date(),
      });

      fetchFriendRequests();
      // Refresh display to update UI
      if (activeTab === 'connect') {
        if (currentUserSchool) {
          fetchSchoolUsers();
        }
        // If searching, refresh search results
        if (searchQuery.trim()) {
          searchUsers(searchQuery);
        }
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  const acceptFriendRequest = async (requestId: string, fromUserId: string) => {
    if (!currentUserId) return;

    try {
      // Update request status
      await updateDoc(doc(db, 'friendRequests', requestId), {
        status: 'accepted',
      });

      // Create friend relationship
      await addDoc(collection(db, 'friends'), {
        user1Id: currentUserId,
        user2Id: fromUserId,
        status: 'accepted',
        createdAt: new Date(),
      });

      fetchFriendRequests();
      fetchFriends();
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const rejectFriendRequest = async (requestId: string) => {
    try {
      await updateDoc(doc(db, 'friendRequests', requestId), {
        status: 'rejected',
      });
      fetchFriendRequests();
    } catch (error) {
      console.error('Error rejecting friend request:', error);
    }
  };

  const renderFriends = () => {
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.roseRed} />
        </View>
      );
    }

    if (friends.length === 0) {
      return (
        <View style={styles.emptyState}>
          <SvgIcon name="users-alt" size={48} color={Colors.coolGrey} />
          <Text style={styles.emptyStateTitle}>No friends yet</Text>
          <Text style={styles.emptyStateText}>
            Connect with friends to start chatting
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={friends}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.friendItem}
            onPress={() => {
              (navigation as any).navigate('Chat', {
                friendId: item.userId,
                friendName: item.userName,
                chatId: item.id,
              });
            }}
          >
            <View style={styles.friendAvatar}>
              <Text style={styles.friendAvatarText}>
                {item.userName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.friendInfo}>
              <Text style={styles.friendName}>{item.userName}</Text>
              {item.lastMessage && (
                <Text style={styles.friendLastMessage} numberOfLines={1}>
                  {item.lastMessage}
                </Text>
              )}
            </View>
            <Feather name="chevron-right" size={20} color={Colors.coolGrey} />
          </TouchableOpacity>
        )}
      />
    );
  };

  const renderRequests = () => {
    const incomingRequests = friendRequests.filter(
      (req) => req.toUserId === currentUserId
    );
    const outgoingRequests = friendRequests.filter(
      (req) => req.fromUserId === currentUserId
    );

    return (
      <ScrollView>
        {incomingRequests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Incoming Requests</Text>
            {incomingRequests.map((request) => (
              <View key={request.id} style={styles.requestItem}>
                <View style={styles.requestInfo}>
                  <View style={styles.friendAvatar}>
                    <Text style={styles.friendAvatarText}>
                      {request.fromUserName?.charAt(0).toUpperCase() || 'U'}
                    </Text>
                  </View>
                  <View style={styles.friendInfo}>
                    <Text style={styles.friendName}>
                      {request.fromUserName || 'Unknown'}
                    </Text>
                    <Text style={styles.friendEmail}>{request.fromUserEmail}</Text>
                  </View>
                </View>
                <View style={styles.requestActions}>
                  <TouchableOpacity
                    style={[styles.requestButton, styles.acceptButton]}
                    onPress={() => acceptFriendRequest(request.id, request.fromUserId)}
                  >
                    <Text style={styles.acceptButtonText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.requestButton, styles.rejectButton]}
                    onPress={() => rejectFriendRequest(request.id)}
                  >
                    <Text style={styles.rejectButtonText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {outgoingRequests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Outgoing Requests</Text>
            {outgoingRequests.map((request) => (
              <View key={request.id} style={styles.requestItem}>
                <View style={styles.requestInfo}>
                  <View style={styles.friendAvatar}>
                    <Text style={styles.friendAvatarText}>
                      {request.fromUserName?.charAt(0).toUpperCase() || 'U'}
                    </Text>
                  </View>
                  <View style={styles.friendInfo}>
                    <Text style={styles.friendName}>
                      {request.fromUserName || 'Unknown'}
                    </Text>
                    <Text style={styles.friendEmail}>{request.fromUserEmail}</Text>
                  </View>
                </View>
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingText}>Pending</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {incomingRequests.length === 0 && outgoingRequests.length === 0 && (
          <View style={styles.emptyState}>
            <Feather name="user-plus" size={48} color={Colors.coolGrey} />
            <Text style={styles.emptyStateTitle}>No friend requests</Text>
            <Text style={styles.emptyStateText}>
              Search for friends to send requests
            </Text>
          </View>
        )}
      </ScrollView>
    );
  };

  const renderUserItem = (item: any) => {
    const isAlreadyFriend = friends.some((f) => f.userId === item.id);
    const hasPendingRequest = friendRequests.some(
      (req) =>
        (req.fromUserId === currentUserId && req.toUserId === item.id) ||
        (req.toUserId === currentUserId && req.fromUserId === item.id)
    );

    return (
      <View style={styles.searchResultItem}>
        <View style={styles.friendAvatar}>
          <Text style={styles.friendAvatarText}>
            {(item.name || item.email || 'U').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>
            {item.name || item.email || 'Unknown'}
          </Text>
          <Text style={styles.friendEmail}>{item.email}</Text>
        </View>
        {isAlreadyFriend ? (
          <View style={styles.friendBadge}>
            <Text style={styles.friendBadgeText}>Friend</Text>
          </View>
        ) : hasPendingRequest ? (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingText}>Pending</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => sendFriendRequest(item.id)}
          >
            <Text style={styles.connectButtonText}>Connect</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderConnect = () => {
    const displayUsers = searchQuery.trim() ? searchResults : schoolUsers;
    const isLoadingUsers = searchQuery.trim() ? isSearching : isLoadingSchoolUsers;

    return (
      <View style={styles.connectContainer}>
        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color={Colors.coolGrey} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by email..."
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              if (text.trim()) {
                searchUsers(text);
              } else {
                setSearchResults([]);
              }
            }}
            placeholderTextColor={Colors.coolGrey}
          />
          {isLoadingUsers && (
            <ActivityIndicator size="small" color={Colors.roseRed} />
          )}
        </View>

        {isLoadingUsers && displayUsers.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors.roseRed} />
          </View>
        ) : displayUsers.length > 0 ? (
          <>
            {!searchQuery.trim() && currentUserSchool && (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  People from {currentUserSchool}
                </Text>
              </View>
            )}
            {searchQuery.trim() && (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Search Results</Text>
              </View>
            )}
            <FlatList
              data={displayUsers}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => renderUserItem(item)}
            />
          </>
        ) : searchQuery.trim() ? (
          <View style={styles.emptyState}>
            <Feather name="search" size={48} color={Colors.coolGrey} />
            <Text style={styles.emptyStateTitle}>No users found</Text>
            <Text style={styles.emptyStateText}>
              Try searching with a different email
            </Text>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <SvgIcon name="users-alt" size={48} color={Colors.coolGrey} />
            <Text style={styles.emptyStateTitle}>
              {currentUserSchool ? 'No classmates found' : 'Find Friends'}
            </Text>
            <Text style={styles.emptyStateText}>
              {currentUserSchool
                ? 'No other users from your school yet'
                : 'Search by email to connect with friends'}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color={Colors.darkSlate} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => setActiveTab('friends')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'friends' && styles.activeTabText,
            ]}
          >
            Friends
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
          onPress={() => setActiveTab('requests')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'requests' && styles.activeTabText,
            ]}
          >
            Requests
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'connect' && styles.activeTab]}
          onPress={() => setActiveTab('connect')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'connect' && styles.activeTabText,
            ]}
          >
            Connect
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {activeTab === 'friends' && renderFriends()}
        {activeTab === 'requests' && renderRequests()}
        {activeTab === 'connect' && renderConnect()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.fogGrey,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.darkSlate,
    fontFamily: Fonts.bold,
  },
  placeholder: {
    width: 32,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.fogGrey,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Colors.roseRed,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.coolGrey,
    fontFamily: Fonts.semiBold,
  },
  activeTabText: {
    color: Colors.roseRed,
    fontFamily: Fonts.bold,
  },
  content: {
    flex: 1,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.fogGrey,
  },
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.roseRed,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  friendAvatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.white,
    fontFamily: Fonts.bold,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.darkSlate,
    fontFamily: Fonts.bold,
    marginBottom: 4,
  },
  friendEmail: {
    fontSize: 12,
    color: Colors.coolGrey,
    fontFamily: Fonts.regular,
  },
  friendLastMessage: {
    fontSize: 14,
    color: Colors.coolGrey,
    fontFamily: Fonts.regular,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.fogGrey,
  },
  requestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  requestButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  acceptButton: {
    backgroundColor: Colors.successGreen,
  },
  acceptButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Fonts.bold,
  },
  rejectButton: {
    backgroundColor: Colors.fogGrey,
  },
  rejectButtonText: {
    color: Colors.darkSlate,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Fonts.bold,
  },
  pendingBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: Colors.fogGrey,
  },
  pendingText: {
    color: Colors.coolGrey,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
  connectContainer: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.fogGrey,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    margin: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.darkSlate,
    fontFamily: Fonts.regular,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.fogGrey,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.roseRed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Fonts.bold,
  },
  friendBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: Colors.successGreen + '20',
  },
  friendBadgeText: {
    color: Colors.successGreen,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
  section: {
    marginTop: 16,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.coolGrey,
    fontFamily: Fonts.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.darkSlate,
    fontFamily: Fonts.bold,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.coolGrey,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MessagesScreen;

