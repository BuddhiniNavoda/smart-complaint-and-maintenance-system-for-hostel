import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { ThemeContext } from '../context/ThemeContext';
import { ref, onValue, off, get } from 'firebase/database';
import { database } from '../firebase/config';

export default function HomeScreen({ navigation, route }) {
  const { userType, userData } = route.params;
  const [activeTab, setActiveTab] = useState('Submitted');
  const [complaints, setComplaints] = useState([]);
  const [votedComplaints, setVotedComplaints] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { isDarkMode } = useContext(ThemeContext);
  const isFocused = useIsFocused();

  // Load complaints from Firebase Realtime Database
  useEffect(() => {
    const loadComplaints = async () => {
      if (!isFocused) return;

      setLoading(true);
      try {
        const complaintsRef = ref(database, 'complaints');

        // Set up realtime listener
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

          // Sort by date (newest first) and then by votes
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

          // Fallback to local storage if Firebase fails
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

    // Clean up listener when component unmounts
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
      // Force reload from Firebase
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
    // Students can only see public complaints
    if (userType === 'student' && complaint.visibility !== 'public') {
      return false;
    }

    // Filter by active tab
    if (activeTab === 'Submitted') return complaint.status === 'Submitted';
    if (activeTab === 'Approved') return complaint.status === 'Approved';
    if (activeTab === 'Fixed') return complaint.status === 'Fixed';

    return true;
  }).sort((a, b) => b.votes - a.votes);

  const handleVote = async (complaintId, voteType) => {
    if (userType !== 'student') return;

    try {
      const currentVote = votedComplaints[complaintId];
      let updatedComplaints = [...complaints];
      let updatedVotes = { ...votedComplaints };

      updatedComplaints = complaints.map(c => {
        if (c.id === complaintId) {
          let voteChange = 0;

          if (!currentVote) {
            voteChange = voteType === 'up' ? 1 : -1;
            updatedVotes[complaintId] = voteType;
          } else if (currentVote === voteType) {
            voteChange = voteType === 'up' ? -1 : 1;
            delete updatedVotes[complaintId];
          } else {
            voteChange = voteType === 'up' ? 2 : -2;
            updatedVotes[complaintId] = voteType;
          }

          return { ...c, votes: (c.votes || 0) + voteChange };
        }
        return c;
      });

      await AsyncStorage.setItem('votedComplaints', JSON.stringify(updatedVotes));
      setComplaints(updatedComplaints);
      setVotedComplaints(updatedVotes);

    } catch (error) {
      console.error('Error saving vote:', error);
      Alert.alert("Error", "Failed to save your vote");
    }
  };

  const renderVoteButtons = (item) => {
    const userVote = votedComplaints[item.id];
    return (
      <>
        <TouchableOpacity
          onPress={() => handleVote(item.id, 'up')}
        >
          <Ionicons
            name={userVote === 'up' ? 'thumbs-up' : 'thumbs-up-outline'}
            size={20}
            color={userVote === 'up' ? '#4CAF50' : (isDarkMode ? '#aaa' : '#888')} />
        </TouchableOpacity>
        <Text style={[styles.voteCount, { color: isDarkMode ? 'white' : 'black' }]}>
          {item.votes || 0}
        </Text>
        <TouchableOpacity
          onPress={() => handleVote(item.id, 'down')}
        >
          <Ionicons
            name={userVote === 'down' ? 'thumbs-down' : 'thumbs-down-outline'}
            size={20}
            color={userVote === 'down' ? '#F44336' : (isDarkMode ? '#aaa' : '#888')} />
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
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  const renderComplaintItem = ({ item }) => (
    <View
      style={[
        styles.complaintCard,
        { backgroundColor: isDarkMode ? '#1e1e1e' : 'white' }
      ]}
    >
      <View style={styles.complaintHeader}>
        <TouchableOpacity onPress={() => navigation.navigate('ComplaintDetail', {
          complaint: item,
          userType,
          userData
        })}>
          <Text style={[styles.complaintCategory, { color: '#007AFF' }]}>
            {item.category || 'Other'}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.complaintDate, { color: isDarkMode ? '#aaa' : '#666' }]}>
          {formatDate(item.date || item.createdAt)}
        </Text>
      </View>

      <TouchableOpacity onPress={() => navigation.navigate('ComplaintDetail', {
        complaint: item,
        userType,
        userData
      })}>
        <Text style={[styles.complaintDescription, { color: isDarkMode ? 'white' : 'black' }]}>
          {item.description}
        </Text>

        {/* Show submitted by information */}
        <Text style={[styles.submittedBy, { color: isDarkMode ? '#aaa' : '#666' }]}>
          Submitted by: {item.userName || item.submittedBy || 'Anonymous'}
          {item.userHostel && ` • ${item.userHostel}`}
          {item.userRoom && ` • Room ${item.userRoom}`}
        </Text>
      </TouchableOpacity>

      <View style={styles.complaintFooter}>
        <TouchableOpacity style={[
          styles.statusBadge,
          {
            backgroundColor: getStatusColor(item.status, isDarkMode),
            borderColor: isDarkMode ? '#333' : '#ddd'
          }
        ]}
          onPress={() => navigation.navigate('ComplaintDetail', {
            complaint: item,
            userType,
            userData
          })}
        >
          <Text style={styles.statusText}>{item.status || 'Submitted'}</Text>
        </TouchableOpacity>

        <View style={styles.voteContainer}>
          {item.status === 'Submitted' && userType === 'student'
            ? renderVoteButtons(item)
            : <Text style={[styles.voteCount, { color: isDarkMode ? 'white' : 'black' }]}>
              Votes: {item.votes || 0}
            </Text>
          }
        </View>
      </View>
    </View>
  );

  const getStatusColor = (status, isDark) => {
    switch (status) {
      case 'Submitted': return isDark ? '#333' : '#eee';
      case 'Approved': return isDark ? '#2a3c96' : '#d4e2ff';
      case 'Fixed': return isDark ? '#1a5c1a' : '#d4ffd4';
      default: return isDark ? '#333' : '#eee';
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons
        name="document-text-outline"
        size={64}
        color={isDarkMode ? '#555' : '#ccc'}
      />
      <Text style={[styles.emptyStateText, { color: isDarkMode ? '#aaa' : '#666' }]}>
        {loading ? 'Loading complaints...' : 'No complaints found'}
      </Text>
      {!loading && (
        <Text style={[styles.emptyStateSubtext, { color: isDarkMode ? '#888' : '#999' }]}>
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
      backgroundColor: isDarkMode ? '#121212' : '#f5f5f5'
    },
    tabContainer: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#333' : '#ddd',
      backgroundColor: isDarkMode ? '#1e1e1e' : 'white'
    },
    tabButton: {
      flex: 1,
      paddingVertical: 15,
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: 'transparent'
    },
    activeTab: {
      borderBottomColor: '#007AFF'
    },
    tabText: {
      color: isDarkMode ? 'white' : 'black'
    },
    activeTabText: {
      color: '#007AFF',
      fontWeight: 'bold'
    },
    complaintCard: {
      borderRadius: 10,
      padding: 15,
      margin: 10,
      shadowColor: isDarkMode ? '#333' : '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3
    },
    complaintHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 5
    },
    complaintCategory: {
      fontWeight: 'bold',
      fontSize: 14
    },
    complaintDate: {
      fontSize: 12
    },
    complaintDescription: {
      fontSize: 16,
      marginBottom: 8
    },
    submittedBy: {
      fontSize: 12,
      marginBottom: 10,
      fontStyle: 'italic'
    },
    complaintFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 10,
      borderWidth: 1
    },
    statusText: {
      fontSize: 12,
      color: isDarkMode ? 'white' : 'black'
    },
    voteContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8
    },
    voteCount: {
      marginHorizontal: 5,
      fontSize: 14
    },
    fab: {
      position: 'absolute',
      right: 20,
      bottom: 20,
      backgroundColor: '#007AFF',
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 5
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40
    },
    emptyStateText: {
      fontSize: 18,
      textAlign: 'center',
      marginTop: 16,
      marginBottom: 8
    },
    emptyStateSubtext: {
      fontSize: 14,
      textAlign: 'center'
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
    }
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={[styles.emptyStateText, { color: isDarkMode ? 'white' : 'black' }]}>
          Loading complaints...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tab Bar */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'Submitted' && styles.activeTab]}
          onPress={() => setActiveTab('Submitted')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'Submitted' && styles.activeTabText
          ]}>
            Submitted
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'Approved' && styles.activeTab]}
          onPress={() => setActiveTab('Approved')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'Approved' && styles.activeTabText
          ]}>
            Approved
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'Fixed' && styles.activeTab]}
          onPress={() => setActiveTab('Fixed')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'Fixed' && styles.activeTabText
          ]}>
            Fixed
          </Text>
        </TouchableOpacity>
      </View>

      {/* Complaints List */}
      <FlatList
        data={filteredComplaints}
        keyExtractor={(item) => item.id}
        renderItem={renderComplaintItem}
        contentContainerStyle={{ paddingBottom: 80 }}
        ListEmptyComponent={renderEmptyState}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />

      {/* Add Complaint Button (for students) */}
      {userType === 'student' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('AddComplaint', { userData })}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
}