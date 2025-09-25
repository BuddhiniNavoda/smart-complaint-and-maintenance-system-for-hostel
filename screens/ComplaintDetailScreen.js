import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
  TextInput,
  Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';
import { ref, update, remove } from 'firebase/database';
import { database } from '../firebase/config';
import useAlert from '../hooks/useAlert';

export default function ComplaintDetailScreen({ navigation, route }) {
  const { complaint, userType } = route.params;
  const { isDarkMode } = useContext(ThemeContext);
  const [currentComplaint, setCurrentComplaint] = useState(complaint);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editDescription, setEditDescription] = useState(complaint.description);
  const [editCategory, setEditCategory] = useState(complaint.category);
  const [editVisibility, setEditVisibility] = useState(complaint.visibility);
  const [showEditModal, setShowEditModal] = useState(false);
  const { showAlert, AlertComponent } = useAlert();

  const categories = [
    'Electrical', 'Plumbing', 'Carpentry', 'Cleaning',
    'Infrastructure', 'Furniture', 'Other'
  ];

  // Load user data from AsyncStorage and profile picture
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Load user data from AsyncStorage
        const storedUserData = await AsyncStorage.getItem('userData');
        if (storedUserData) {
          const parsedData = JSON.parse(storedUserData);
          setUserData(parsedData);

        } else if (route.params?.userData) {
          // Fallback to route params if AsyncStorage doesn't have data
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

  // Check if current user is the owner of the complaint
  const isOwner = currentComplaint.userId === userData?.id ||
    currentComplaint.submittedBy === userData?.username;

  console.log(userData);

  // Check if complaint can be edited (only submitted complaints by owner)
  const canEdit = isOwner && currentComplaint.status === 'Submitted';

  const approveComplaint = async () => {
    setLoading(true);
    try {
      const complaintRef = ref(database, `complaints/${currentComplaint.id}`);
      await update(complaintRef, {
        status: 'Approved',
        approvedBy: userData.name || userData.username,
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      setCurrentComplaint(prev => ({
        ...prev,
        status: 'Approved',
        approvedBy: userData.name || userData.username,
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      showAlert("Success", "Complaint approved successfully", [], 'success');
    } catch (error) {
      showAlert("Error", "Failed to approve complaint", [], 'error');
    } finally {
      setLoading(false);
    }
  };

  const markAsFixed = async () => {
    setLoading(true);
    try {
      const complaintRef = ref(database, `complaints/${currentComplaint.id}`);
      await update(complaintRef, {
        status: 'Fixed',
        fixedBy: userData.name || userData.username,
        fixedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      setCurrentComplaint(prev => ({
        ...prev,
        status: 'Fixed',
        fixedBy: userData.name || userData.username,
        fixedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      showAlert("Success", "Complaint marked as fixed", [], 'success');
    } catch (error) {
      showAlert("Error", "Failed to mark complaint as fixed", [], 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditDescription(currentComplaint.description);
    setEditCategory(currentComplaint.category);
    setEditVisibility(currentComplaint.visibility);
    setShowEditModal(true);
  };

  const saveEdit = async () => {
    if (!editDescription.trim()) {
      showAlert("Warning", "Please enter a description", [], 'warning');
      return;
    }

    setLoading(true);
    try {
      const complaintRef = ref(database, `complaints/${currentComplaint.id}`);
      await update(complaintRef, {
        description: editDescription.trim(),
        category: editCategory,
        visibility: editVisibility,
        updatedAt: new Date().toISOString(),
        lastEditedBy: userData.name || userData.username,
        lastEditedAt: new Date().toISOString()
      });

      setCurrentComplaint(prev => ({
        ...prev,
        description: editDescription.trim(),
        category: editCategory,
        visibility: editVisibility,
        updatedAt: new Date().toISOString(),
        lastEditedBy: userData.name || userData.username,
        lastEditedAt: new Date().toISOString()
      }));

      setShowEditModal(false);
      showAlert("Success", "Complaint updated successfully", [], 'success');
    } catch (error) {
      showAlert("Error", "Failed to update complaint", [], 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteComplaint = async () => {
    showAlert(
      "Delete Complaint",
      "Are you sure you want to delete this complaint? This action cannot be undone",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              const complaintRef = ref(database, `complaints/${currentComplaint.id}`);
              await remove(complaintRef);
              showAlert("Success", "Complaint deleted successfully", [], 'success');
              setTimeout(() => navigation.goBack(), 1000);

            } catch (error) {
              showAlert("Error", "Failed to delete complaint", [], 'error');
            } finally {
              setLoading(false);
            }
          }
        }
      ],
      'warning'
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
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
      case 'Deleted': return '#FF3B30';
      default: return '#666';
    }
  };

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
      padding: 20,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
      marginTop: 10,
    },
    backButton: {
      marginRight: 15,
      backgroundColor: 'white',
      borderRadius: 20,
      padding: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: 'white',
      flex: 1,
      textAlign: 'center',
      marginRight: 40,
    },
    card: {
      backgroundColor: 'white',
      borderRadius: 20,
      padding: 25,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 10,
    },
    statusSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    statusBadge: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
    },
    statusText: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 14,
    },
    complaintTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#007AFF',
      marginBottom: 15,
      textAlign: 'center',
    },
    complaintDescription: {
      fontSize: 16,
      color: '#333',
      lineHeight: 24,
      marginBottom: 20,
      textAlign: 'center',
    },
    detailSection: {
      marginBottom: 15,
    },
    detailLabel: {
      fontSize: 14,
      color: '#666',
      fontWeight: '600',
      marginBottom: 5,
    },
    detailValue: {
      fontSize: 16,
      color: '#333',
      fontWeight: '500',
    },
    imageSection: {
      marginTop: 15,
    },
    imageLabel: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#007AFF',
      marginBottom: 10,
    },
    complaintImage: {
      width: '100%',
      height: 200,
      borderRadius: 15,
      marginBottom: 10,
    },
    noImageText: {
      textAlign: 'center',
      color: '#999',
      fontStyle: 'italic',
      marginVertical: 20,
    },
    actionButton: {
      backgroundColor: '#007AFF',
      padding: 10,
      borderRadius: 15,
      alignItems: 'center',
      marginTop: 10,
      flexDirection: 'row',
      justifyContent: 'center',
      shadowColor: '#007AFF',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    editButton: {
      backgroundColor: '#007AFF',
    },
    deleteButton: {
      backgroundColor: '#FF3B30',
      marginBottom: 50
    },
    fixedButton: {
      backgroundColor: '#4CAF50',
      marginBottom: 50
    },
    buttonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: 'bold',
      marginLeft: 8,
    },
    userInfoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    iconContainer: {
      backgroundColor: '#E3F2FD',
      borderRadius: 10,
      padding: 8,
      marginRight: 10,
    },
    editIndicator: {
      backgroundColor: '#FFA500',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      marginLeft: 10,
    },
    editIndicatorText: {
      color: 'white',
      fontSize: 12,
      fontWeight: 'bold',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: 'white',
      borderRadius: 20,
      width: '100%',
      maxHeight: '85%',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    modalHeader: {
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#007AFF',
      textAlign: 'center',
    },
    modalScrollView: {
      height: 500,
    },
    modalScrollContent: {
      padding: 20,
      paddingBottom: 10,
      height: 500,
    },
    modalLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: '#333',
      marginBottom: 8,
    },
    modalInput: {
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 12,
      padding: 15,
      fontSize: 16,
      marginBottom: 20,
      minHeight: 120,
      textAlignVertical: 'top',
      backgroundColor: '#f9f9f9',
      lineHeight: 22,
    },
    categoryContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 20,
    },
    categoryOption: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      margin: 4,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: '#007AFF',
      backgroundColor: 'white',
    },
    categoryOptionSelected: {
      backgroundColor: '#007AFF',
      borderColor: '#007AFF',
    },
    categoryText: {
      fontSize: 14,
      color: '#007AFF',
      fontWeight: '500',
    },
    categoryTextSelected: {
      color: 'white',
      fontWeight: '600',
    },
    visibilityContainer: {
      flexDirection: 'row',
      marginBottom: 25,
      backgroundColor: '#eeeeeeff',
      borderRadius: 12,
      padding: 4,
    },
    visibilityOption: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 2,
    },
    visibilityOptionSelected: {
      backgroundColor: '#007AFF',
      shadowColor: '#007AFF',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
      elevation: 3,
    },
    visibilityText: {
      fontSize: 14,
      color: '#666',
      fontWeight: '500',
    },
    visibilityTextSelected: {
      color: 'white',
      fontWeight: '600',
    },
    modalFooter: {
      padding: 20,
      borderTopWidth: 1,
      borderTopColor: '#f0f0f0',
      backgroundColor: '#fafafa',
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 5,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    cancelButton: {
      backgroundColor: 'white',
      borderWidth: 1.5,
      borderColor: '#ddd',
    },
    saveButton: {
      backgroundColor: '#007AFF',
      borderWidth: 1.5,
      borderColor: '#007AFF',
    },
    saveButtonDisabled: {
      backgroundColor: '#ccc',
      borderColor: '#ccc',
    },
    modalButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    cancelButtonText: {
      color: '#666',
    },
    saveButtonText: {
      color: 'white',
    },
    characterCount: {
      textAlign: 'right',
      fontSize: 12,
      color: '#999',
      marginTop: -15,
      marginBottom: 15,
    },
    characterCountWarning: {
      color: '#FF3B30',
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 15,
      marginTop: 10,
    },
    infoText: {
      fontSize: 14,
      color: '#666',
      fontStyle: 'italic',
      marginBottom: 15,
      lineHeight: 20,
      textAlign: 'center',
    },
    requiredIndicator: {
      color: '#FF3B30',
    },
    inputContainer: {
      marginBottom: 20,
    },
    modalInputFocused: {
      borderColor: '#007AFF',
      backgroundColor: 'white',
      shadowColor: '#007AFF',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    modalScrollContent: {
      padding: 20,
      paddingBottom: 10,
    },
    modalFooter: {
      padding: 20,
      borderTopWidth: 1,
      borderTopColor: '#f0f0f0',
      backgroundColor: '#fafafa',
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.backgroundContainer}>
        <View style={styles.gradientOverlay} />
      </View>

      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.statusSection}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(currentComplaint.status) }]}>
                <Text style={styles.statusText}>{currentComplaint.status}</Text>
              </View>
              {currentComplaint.lastEditedAt && (
                <View style={styles.editIndicator}>
                  <Text style={styles.editIndicatorText}>EDITED</Text>
                </View>
              )}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="heart" size={20} color="#FF3B30" />
              <Text style={{ marginLeft: 5, fontWeight: '600', color: '#333' }}>
                {currentComplaint.votes || 0} votes
              </Text>
            </View>
          </View>

          <Text style={styles.complaintTitle}>{currentComplaint.category}</Text>
          <Text style={styles.complaintDescription}>{currentComplaint.description}</Text>

          <View style={styles.detailSection}>
            <View style={styles.userInfoRow}>
              <View style={styles.iconContainer}>
                <Ionicons name="person" size={16} color="#007AFF" />
              </View>
              <View>
                <Text style={styles.detailLabel}>Submitted By</Text>
                <Text style={styles.detailValue}>
                  {currentComplaint.userName || currentComplaint.submittedBy || 'Anonymous'}
                  {isOwner && ' (You)'}
                </Text>
              </View>
            </View>

            <View style={styles.userInfoRow}>
              <View style={styles.iconContainer}>
                <Ionicons name="calendar" size={16} color="#007AFF" />
              </View>
              <View>
                <Text style={styles.detailLabel}>Date Submitted</Text>
                <Text style={styles.detailValue}>
                  {formatDate(currentComplaint.date || currentComplaint.createdAt)}
                </Text>
              </View>
            </View>

            {currentComplaint.lastEditedAt && (
              <View style={styles.userInfoRow}>
                <View style={styles.iconContainer}>
                  <Ionicons name="create" size={16} color="#FFA500" />
                </View>
                <View>
                  <Text style={styles.detailLabel}>Last Edited</Text>
                  <Text style={styles.detailValue}>
                    {formatDate(currentComplaint.lastEditedAt)}
                    {currentComplaint.lastEditedBy && ` by ${currentComplaint.lastEditedBy}`}
                  </Text>
                </View>
              </View>
            )}

            {currentComplaint.userHostel && (
              <View style={styles.userInfoRow}>
                <View style={styles.iconContainer}>
                  <Ionicons name="home" size={16} color="#007AFF" />
                </View>
                <View>
                  <Text style={styles.detailLabel}>Hostel</Text>
                  <Text style={styles.detailValue}>{currentComplaint.userHostel}</Text>
                </View>
              </View>
            )}

            {currentComplaint.userRoom && (
              <View style={styles.userInfoRow}>
                <View style={styles.iconContainer}>
                  <Ionicons name="grid" size={16} color="#007AFF" />
                </View>
                <View>
                  <Text style={styles.detailLabel}>Room Number</Text>
                  <Text style={styles.detailValue}>{currentComplaint.userRoom}</Text>
                </View>
              </View>
            )}

            <View style={styles.userInfoRow}>
              <View style={styles.iconContainer}>
                <Ionicons name="eye" size={16} color="#007AFF" />
              </View>
              <View>
                <Text style={styles.detailLabel}>Visibility</Text>
                <Text style={styles.detailValue}>
                  {currentComplaint.visibility === 'public' ? 'Public (All students)' : 'Private (Staff only)'}
                </Text>
              </View>
            </View>
          </View>

          {currentComplaint.imageUrl ? (
            <View style={styles.imageSection}>
              <Text style={styles.imageLabel}>Complaint Image</Text>
              <Image
                source={{ uri: currentComplaint.imageUrl }}
                style={styles.complaintImage}
                resizeMode="contain"
              />
            </View>
          ) : (
            <Text style={styles.noImageText}>No image attached to this complaint</Text>
          )}

          {currentComplaint.approvedBy && (
            <View style={styles.detailSection}>
              <View style={styles.userInfoRow}>
                <View style={styles.iconContainer}>
                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                </View>
                <View>
                  <Text style={styles.detailLabel}>Approved By</Text>
                  <Text style={styles.detailValue}>{currentComplaint.approvedBy}</Text>
                  <Text style={[styles.detailLabel, { fontSize: 12 }]}>
                    {formatDate(currentComplaint.approvedAt)}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {currentComplaint.fixedBy && (
            <View style={styles.detailSection}>
              <View style={styles.userInfoRow}>
                <View style={styles.iconContainer}>
                  <Ionicons name="hammer" size={16} color="#4CAF50" />
                </View>
                <View>
                  <Text style={styles.detailLabel}>Fixed By</Text>
                  <Text style={styles.detailValue}>{currentComplaint.fixedBy}</Text>
                  <Text style={[styles.detailLabel, { fontSize: 12 }]}>
                    {formatDate(currentComplaint.fixedAt)}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Action buttons */}
        {canEdit && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={handleEdit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="create" size={20} color="white" />
                  <Text style={styles.buttonText}>Edit Complaint</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={deleteComplaint}
              disabled={loading}
            >
              <Ionicons name="trash" size={20} color="white" />
              <Text style={styles.buttonText}>Delete Complaint</Text>
            </TouchableOpacity>
          </>
        )}

        {(userType === 'warden' || userType === 'wardenB' || userType === 'wardenF') && currentComplaint.status === 'Submitted' && (
          <TouchableOpacity
            style={[styles.actionButton, { marginBottom: 50 }]}
            onPress={approveComplaint}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="white" />
                <Text style={styles.buttonText}>Approve Complaint</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {userType === 'staff' && currentComplaint.status === 'Approved' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.fixedButton]}
            onPress={markAsFixed}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="hammer" size={20} color="white" />
                <Text style={styles.buttonText}>Mark as Fixed</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <View style={{ height: 50 }} />
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Complaint</Text>
            </View>

            {/* Scrollable Content */}
            <ScrollView
              style={styles.modalScrollView}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.modalScrollContent}
            >
              <Text style={styles.infoText}>
                You can edit your complaint details below. Changes will be visible to all users.
              </Text>

              {/* Description Section */}
              <View style={styles.inputContainer}>
                <Text style={styles.modalLabel}>
                  Description <Text style={styles.requiredIndicator}>*</Text>
                </Text>
                <TextInput
                  style={styles.modalInput}
                  value={editDescription}
                  onChangeText={setEditDescription}
                  multiline
                  placeholder="Describe your issue in detail..."
                  placeholderTextColor="#999"
                  maxLength={500}
                />
                <Text style={[
                  styles.characterCount,
                  editDescription.length > 400 && styles.characterCountWarning
                ]}>
                  {editDescription.length}/500 characters
                </Text>
              </View>

              {/* Category Section */}
              <View style={styles.inputContainer}>
                <Text style={styles.sectionTitle}>Category</Text>
                <View style={styles.categoryContainer}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryOption,
                        editCategory === cat && styles.categoryOptionSelected
                      ]}
                      onPress={() => setEditCategory(cat)}
                    >
                      <Text style={[
                        styles.categoryText,
                        editCategory === cat && styles.categoryTextSelected
                      ]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Visibility Section */}
              <View style={styles.inputContainer}>
                <Text style={styles.sectionTitle}>Visibility</Text>
                <View style={styles.visibilityContainer}>
                  <TouchableOpacity
                    style={[
                      styles.visibilityOption,
                      editVisibility === 'public' && styles.visibilityOptionSelected
                    ]}
                    onPress={() => setEditVisibility('public')}
                  >
                    <Ionicons
                      name="earth"
                      size={16}
                      color={editVisibility === 'public' ? 'white' : '#666'}
                    />
                    <Text style={[
                      styles.visibilityText,
                      editVisibility === 'public' && styles.visibilityTextSelected
                    ]}>
                      Public
                    </Text>
                    <Text style={[
                      styles.visibilityText,
                      editVisibility === 'public' ? styles.visibilityTextSelected : { fontSize: 12, color: '#999' }
                    ]}>
                      (All students)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.visibilityOption,
                      editVisibility === 'private' && styles.visibilityOptionSelected
                    ]}
                    onPress={() => setEditVisibility('private')}
                  >
                    <Ionicons
                      name="lock-closed"
                      size={16}
                      color={editVisibility === 'private' ? 'white' : '#666'}
                    />
                    <Text style={[
                      styles.visibilityText,
                      editVisibility === 'private' && styles.visibilityTextSelected
                    ]}>
                      Private
                    </Text>
                    <Text style={[
                      styles.visibilityText,
                      editVisibility === 'private' ? styles.visibilityTextSelected : { fontSize: 12, color: '#999' }
                    ]}>
                      (Staff only)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            {/* Fixed Footer with Buttons */}
            <View style={styles.modalFooter}>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowEditModal(false)}
                  disabled={loading}
                >
                  <Text style={[styles.modalButtonText, styles.cancelButtonText]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.saveButton,
                    (!editDescription.trim() || loading) && styles.saveButtonDisabled
                  ]}
                  onPress={saveEdit}
                  disabled={!editDescription.trim() || loading}
                >
                  {loading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      <Ionicons name="save" size={18} color="white" style={{ marginRight: 5 }} />
                      <Text style={[styles.modalButtonText, styles.saveButtonText]}>Save Changes</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
      <AlertComponent />
    </View>
  );
}