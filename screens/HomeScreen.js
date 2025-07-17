import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { ThemeContext } from '../context/ThemeContext';

const mockComplaints = [
  {
    id: '1',
    description: 'Light not working in Room 101',
    status: 'Submitted',
    visibility: 'private',
    votes: 1,
    category: 'Electrical',
    date: '2023-05-15'
  },
  {
    id: '2',
    description: 'Water leakage in Block A',
    status: 'Approved',
    visibility: 'public',
    votes: 6,
    category: 'Plumbing',
    date: '2023-05-16'
  },
  {
    id: '3',
    description: 'Broken window in common room',
    status: 'Fixed',
    visibility: 'public',
    votes: 12,
    category: 'Infrastructure',
    date: '2023-05-10'
  },
  {
    id: '4',
    description: 'Faulty fan in Room 205',
    status: 'Submitted',
    visibility: 'public',
    votes: 2,
    category: 'Electrical',
    date: '2023-05-18'
  },
];

export default function HomeScreen({ navigation, route }) {
  const { userType, userData } = route.params;
  const [activeTab, setActiveTab] = useState('Submitted');
  const [complaints, setComplaints] = useState(mockComplaints);
  const [votedComplaints, setVotedComplaints] = useState({});
  const { isDarkMode } = useContext(ThemeContext);
  const isFocused = useIsFocused();

  useEffect(() => {
    const loadVotedComplaints = async () => {
      try {
        const votes = await AsyncStorage.getItem('votedComplaints');
        if (votes) {
          const parsedVotes = JSON.parse(votes);
          // Ensure we have an object with proper string values
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
  })
    .sort((a, b) => b.votes - a.votes);

  // Modified handleVote function
  const handleVote = async (complaintId, voteType) => {
    if (userType !== 'student') return;

    try {
      const currentVote = votedComplaints[complaintId];
      let updatedComplaints = [...complaints];
      let updatedVotes = { ...votedComplaints };

      updatedComplaints = complaints.map(c => {
        if (c.id === complaintId) {
          let voteChange = 0;

          // Toggle or switch vote
          if (!currentVote) {
            voteChange = voteType === 'up' ? 1 : -1;
            updatedVotes[complaintId] = voteType;
          } else if (currentVote === voteType) {
            // Unvote (remove existing vote)
            voteChange = voteType === 'up' ? -1 : 1;
            delete updatedVotes[complaintId];
          } else {
            // Switch vote
            voteChange = voteType === 'up' ? 2 : -2;
            updatedVotes[complaintId] = voteType;
          }

          return { ...c, votes: c.votes + voteChange };
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
        </TouchableOpacity><Text style={[styles.voteCount, { color: isDarkMode ? 'white' : 'black' }]}>
          {item.votes}
        </Text><TouchableOpacity
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

  const renderComplaintItem = ({ item }) => (
    <View
      style={[
        styles.complaintCard,
        { backgroundColor: isDarkMode ? '#1e1e1e' : 'white' }
      ]}
    >
      <View style={styles.complaintHeader}>
        <TouchableOpacity onPress={() => navigation.navigate('ComplaintDetail', { complaint: item, userType })}>
          <Text style={[styles.complaintCategory, { color: '#007AFF' }]}>{item.category}</Text>
        </TouchableOpacity>
        <Text style={[styles.complaintDate, { color: isDarkMode ? '#aaa' : '#666' }]}>{item.date}</Text>
      </View>
      <TouchableOpacity onPress={() => navigation.navigate('ComplaintDetail', { complaint: item, userType })}>
        <Text style={[styles.complaintDescription, { color: isDarkMode ? 'white' : 'black' }]}>
          {item.description}
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
          onPress={() => navigation.navigate('ComplaintDetail', { complaint: item, userType })}
        >
          <Text style={styles.statusText}>{item.status}</Text>
        </TouchableOpacity>

        <View style={styles.voteContainer}>
          {item.status === 'Submitted' && userType === 'student'
            ? renderVoteButtons(item)
            : <Text style={[styles.voteCount, { color: isDarkMode ? 'white' : 'black' }]}>
              Votes: {item.votes}
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
      fontWeight: 'bold'
    },
    complaintDate: {
      fontSize: 12
    },
    complaintDescription: {
      fontSize: 16,
      marginBottom: 10
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
      marginHorizontal: 5
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
    }
  });

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
            activeTab === 'Submitted' && styles.activeTabText,
            { color: isDarkMode ? 'white' : 'black' }
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
            activeTab === 'Approved' && styles.activeTabText,
            { color: isDarkMode ? 'white' : 'black' }
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
            activeTab === 'Fixed' && styles.activeTabText,
            { color: isDarkMode ? 'white' : 'black' }
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
      />

      {/* Add Complaint Button (for students) */}
      {userType === 'student' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('AddComplaint')}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
}