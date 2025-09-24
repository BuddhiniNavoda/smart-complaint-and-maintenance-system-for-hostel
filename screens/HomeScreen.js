import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { ThemeContext } from '../context/ThemeContext';
import { ref, onValue, off, get, update } from 'firebase/database';
import { database } from '../firebase/config';
import useAlert from '../hooks/useAlert';

export default function HomeScreen({ navigation, route }) {
  const { userType } = route.params;
  const [activeTab, setActiveTab] = useState('Submitted');
  const [complaints, setComplaints] = useState([]);
  const [votedComplaints, setVotedComplaints] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { isDarkMode } = useContext(ThemeContext);
  const isFocused = useIsFocused();
  const [userData, setUserData] = useState(null);
  const { showAlert, AlertComponent } = useAlert();

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUserData = await AsyncStorage.getItem('userData');
        if (storedUserData) {
          const parsedData = JSON.parse(storedUserData);
          setUserData(parsedData);

        } else if (route.params?.userData) {
          setUserData(route.params.userData);
        }
      } catch (error) {
        showAlert("Error", "Failed to load user data", [], 'error');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [route.params]);

  useEffect(() => {
    const loadComplaints = async () => {
      if (!isFocused) return;

      setLoading(true);
      try {
        const complaintsRef = ref(database, 'complaints');

        onValue(complaintsRef, (snapshot) => {
          const complaintsData = snapshot.val();
          const complaintsArray = [];

          if (complaintsData) {
            Object.keys(complaintsData).forEach(key => {
              complaintsArray.push({
                id: key,
                ...complaintsData[key]
              });
            });
          }

          complaintsArray.sort((a, b) => {
            const dateA = new Date(a.createdAt || a.date || 0);
            const dateB = new Date(b.createdAt || b.date || 0);
            return dateB - dateA;
          });

          setComplaints(complaintsArray);
          setLoading(false);
          setRefreshing(false);
        }, (error) => {
          console.error('Error loading complaints:', error);
          setLoading(false);
          setRefreshing(false);
          loadComplaintsFromLocal();
        });

      } catch (error) {
        console.error('Error setting up listener:', error);
        setLoading(false);
        setRefreshing(false);
        loadComplaintsFromLocal();
      }
    };

    const loadComplaintsFromLocal = async () => {
      try {
        const localComplaints = await AsyncStorage.getItem('complaints');
        if (localComplaints) {
          const parsedComplaints = JSON.parse(localComplaints);
          setComplaints(parsedComplaints);
        }
      } catch (error) {
        console.error('Error loading local complaints:', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

    loadComplaints();

    return () => {
      const complaintsRef = ref(database, 'complaints');
      off(complaintsRef);
    };
  }, [isFocused]);

  useEffect(() => {
    const loadVotedComplaints = async () => {
      try {
        const votes = await AsyncStorage.getItem('votedComplaints');
        if (votes) {
          const parsedVotes = JSON.parse(votes);
          const validatedVotes = {};
          Object.keys(parsedVotes).forEach(key => {
            const value = parsedVotes[key];
            validatedVotes[key] = typeof value === 'string' ? value : String(value);
          });
          setVotedComplaints(validatedVotes);
        }
      } catch (error) {
        console.error('Error loading votes:', error);
      }
    };

    if (isFocused) {
      loadVotedComplaints();
    }
  }, [isFocused]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const complaintsRef = ref(database, 'complaints');
      const snapshot = await get(complaintsRef);

      if (snapshot.exists()) {
        const complaintsData = snapshot.val();
        const complaintsArray = [];

        Object.keys(complaintsData).forEach(key => {
          complaintsArray.push({
            id: key,
            ...complaintsData[key]
          });
        });

        complaintsArray.sort((a, b) => {
          const dateA = new Date(a.createdAt || a.date || 0);
          const dateB = new Date(b.createdAt || b.date || 0);
          return dateB - dateA;
        });

        setComplaints(complaintsArray);
      }
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const filteredComplaints = complaints.filter(complaint => {
    const isUserComplaint = complaint.userId === userData?.id ||
      complaint.submittedBy === userData?.username;

    // Warden type filtering
    if (userType === 'wardenB') {
      if (complaint.hostelType !== 'male' && !isUserComplaint) {
        return false;
      }
    } else if (userType === 'wardenF') {
      if (complaint.hostelType !== 'female' && !isUserComplaint) {
        return false;
      }
    }
    else if (userType === 'staff' && userData?.assignedHostelGender === 'male') {
      if (complaint.hostelType !== 'male' && !isUserComplaint) {
        return false;
      }
    }
    else if (userType === 'staff' && userData?.assignedHostelGender === 'female') {
      if (complaint.hostelType !== 'female' && !isUserComplaint) {
        return false;
      }
    }

    if (isUserComplaint) {
      if (activeTab === 'Submitted') return complaint.status === 'Submitted';
      if (activeTab === 'Approved') return complaint.status === 'Approved';
      if (activeTab === 'Fixed') return complaint.status === 'Fixed';
      return true;
    }

    if (userType === 'student' && complaint.visibility == 'public') {
      if (userData?.hostelGender === 'male' && complaint.hostelType === 'male') {
        return true;
      }
      if (userData?.hostelGender === 'female' && complaint.hostelType === 'female') {
        return true;
      }
      return false;
    }

    if (activeTab === 'Submitted') return complaint.status === 'Submitted';
    if (activeTab === 'Approved') return complaint.status === 'Approved';
    if (activeTab === 'Fixed') return complaint.status === 'Fixed';
    return true;
  }).sort((a, b) => b.votes - a.votes);

  const handleVote = async (complaintId, voteType) => {
    if (userType !== 'student') return;

    try {
      const currentVote = votedComplaints[complaintId];
      let voteChange = 0;
      let newVoteType = voteType;

      // Calculate vote change
      if (!currentVote) {
        voteChange = voteType === 'up' ? 1 : -1;
      } else if (currentVote === voteType) {
        voteChange = voteType === 'up' ? -1 : 1;
        newVoteType = null; // Remove vote
      } else {
        voteChange = voteType === 'up' ? 2 : -2;
      }

      // Optimistic update - update local state immediately
      const updatedComplaints = complaints.map(c => {
        if (c.id === complaintId) {
          return { ...c, votes: (c.votes || 0) + voteChange };
        }
        return c;
      });

      const updatedVotes = { ...votedComplaints };
      if (newVoteType) {
        updatedVotes[complaintId] = newVoteType;
      } else {
        delete updatedVotes[complaintId];
      }

      setComplaints(updatedComplaints);
      setVotedComplaints(updatedVotes);

      // Update Firebase
      const complaintRef = ref(database, `complaints/${complaintId}`);
      await update(complaintRef, {
        votes: updatedComplaints.find(c => c.id === complaintId).votes
      });

      // Save to local storage
      await AsyncStorage.setItem('votedComplaints', JSON.stringify(updatedVotes));

    } catch (error) {
      console.error('Error saving vote to Firebase:', error);

      // Revert on error
      const originalComplaints = [...complaints];
      setComplaints(originalComplaints);
      setVotedComplaints(votedComplaints);

      showAlert("Error", "Failed to update vote. Please try again", [], 'error');
    }
  };

  const renderVoteButtons = (item) => {
    const userVote = votedComplaints[item.id];
    return (
      <>
        <TouchableOpacity
          onPress={() => handleVote(item.id, 'up')}
          style={styles.voteButton}
        >
          <Ionicons
            name={userVote === 'up' ? 'thumbs-up' : 'thumbs-up-outline'}
            size={20}
            color={userVote === 'up' ? '#4CAF50' : '#88B2FF'}
          />
        </TouchableOpacity>
        <Text style={styles.voteCount}>
          {item.votes || 0}
        </Text>
        <TouchableOpacity
          onPress={() => handleVote(item.id, 'down')}
          style={styles.voteButton}
        >
          <Ionicons
            name={userVote === 'down' ? 'thumbs-down' : 'thumbs-down-outline'}
            size={20}
            color={userVote === 'down' ? '#FF3B30' : '#88B2FF'}
          />
        </TouchableOpacity>
      </>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Submitted': return '#FFA500';
      case 'Approved': return '#007AFF';
      case 'Fixed': return '#4CAF50';
      default: return '#666';
    }
  };

  const renderComplaintItem = ({ item }) => (
    <TouchableOpacity
      style={styles.complaintCard}
      onPress={() => navigation.navigate('ComplaintDetail', {
        complaint: item,
        userType,
        userData
      })}
    >
      <View style={styles.complaintHeader}>
        <View style={styles.categoryContainer}>
          <Ionicons name="pricetag" size={16} color="#007AFF" />
          <Text style={styles.complaintCategory}>
            {item.category || 'Other'}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status || 'Submitted'}</Text>
        </View>
      </View>

      <Text style={styles.complaintDescription}>
        {item.description}
      </Text>

      <View style={styles.complaintFooter}>
        <View style={styles.userInfo}>
          <Ionicons name="person" size={14} color="#666" />
          <Text style={styles.submittedBy}>
            {item.userName || item.submittedBy || 'Anonymous'}
            {item.userHostel && ` • ${item.userHostel}`}
            {item.userRoom && ` • Room ${item.userRoom}`}
          </Text>
        </View>
        <Text style={styles.complaintDate}>
          {formatDate(item.date || item.createdAt)}
        </Text>
      </View>

      <View style={styles.voteContainer}>
        {item.status === 'Submitted' && userType === 'student' ? (
          renderVoteButtons(item)
        ) : (
          <View style={styles.voteDisplay}>
            <Ionicons name="heart" size={16} color="#FF3B30" />
            <Text style={styles.voteCount}>{item.votes || 0} votes</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons
        name="document-text-outline"
        size={80}
        color="#E3F2FD"
      />
      <Text style={styles.emptyStateText}>
        {loading ? 'Loading complaints...' : 'No complaints found'}
      </Text>
      {!loading && (
        <Text style={styles.emptyStateSubtext}>
          {activeTab === 'Submitted' ? 'No submitted complaints' :
            activeTab === 'Approved' ? 'No approved complaints' :
              'No fixed complaints'}
        </Text>
      )}
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#86befa8d',
    },
    backgroundContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    gradientOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 122, 255, 0.1)',
    },
    contentContainer: {
      flex: 1,
    },
    header: {
      padding: 20,
      paddingBottom: 10,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: 'white',
      textAlign: 'center',
      marginBottom: 10,
    },
    headerSubtitle: {
      fontSize: 16,
      color: '#E3F2FD',
      textAlign: 'center',
      marginBottom: 20,
    },
    tabContainer: {
      marginTop: 20,
      flexDirection: 'row',
      backgroundColor: 'white',
      marginHorizontal: 20,
      borderRadius: 15,
      padding: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
    },
    tabButton: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      borderRadius: 10,
    },
    activeTab: {
      backgroundColor: '#007AFF',
    },
    tabText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#666',
    },
    activeTabText: {
      color: 'white',
    },
    complaintCard: {
      backgroundColor: 'white',
      borderRadius: 20,
      padding: 20,
      marginHorizontal: 20,
      marginVertical: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
    },
    complaintHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    categoryContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    complaintCategory: {
      fontWeight: 'bold',
      fontSize: 16,
      color: '#007AFF',
      marginLeft: 5,
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 15,
    },
    statusText: {
      fontSize: 12,
      fontWeight: 'bold',
      color: 'white',
    },
    complaintDescription: {
      fontSize: 16,
      color: '#333',
      lineHeight: 22,
      marginBottom: 12,
    },
    complaintFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    userInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    submittedBy: {
      fontSize: 12,
      color: '#666',
      marginLeft: 5,
      fontStyle: 'italic',
      maxWidth: 100,
    },
    complaintDate: {
      fontSize: 12,
      color: '#999',
    },
    voteContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    voteButton: {
      padding: 5,
    },
    voteCount: {
      marginHorizontal: 8,
      fontSize: 14,
      fontWeight: '600',
      color: '#333',
    },
    voteDisplay: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    fab: {
      position: 'absolute',
      right: 25,
      bottom: 25,
      backgroundColor: '#ffffffff',
      width: 60,
      height: 60,
      borderRadius: 30,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#879cb3ff',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
      borderWidth: 3,
      borderColor: '#5986b6ff',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
      marginTop: 50,
    },
    emptyStateText: {
      fontSize: 18,
      textAlign: 'center',
      marginTop: 16,
      marginBottom: 8,
      color: '#666',
      fontWeight: '600',
    },
    emptyStateSubtext: {
      fontSize: 14,
      textAlign: 'center',
      color: '#999',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#86befa8d',
    },
    loadingText: {
      color: '#007AFF',
      fontSize: 18,
      marginTop: 20,
      fontWeight: '600',
    },
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="white" />
        <Text style={styles.loadingText}>Loading Complaints...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.backgroundContainer}>
        <View style={styles.gradientOverlay} />
      </View>

      <View style={styles.tabContainer}>
        {['Submitted', 'Approved', 'Fixed'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab && styles.activeTabText
            ]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredComplaints}
        keyExtractor={(item) => item.id}
        renderItem={renderComplaintItem}
        contentContainerStyle={{ paddingVertical: 15, paddingBottom: 100 }}
        ListEmptyComponent={renderEmptyState}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        showsVerticalScrollIndicator={false}
      />

      {userType === 'student' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('AddComplaint', { userData })}
        >
          <Ionicons name="add" size={28} color="#007AFF" />
        </TouchableOpacity>
      )}
      <AlertComponent />
    </View>
  );
}