# Fixora - Smart Hostel Complaint Management System

A modern, cross-platform mobile application designed to streamline hostel maintenance and complaint management for students, wardens, and staff.

## 🚀 Features

### For Students
- **Submit Complaints**: Report maintenance issues with descriptions and images
- **Track Status**: Real-time tracking of complaint progress (Submitted → Approved → Fixed)
- **Voting System**: Upvote/downvote important complaints
- **Gender-based Visibility**: Secure complaint visibility based on hostel gender

### For Wardens
- **Complaint Management**: Approve, track, and manage complaints
- **Staff Management**: Add, edit, and manage maintenance staff
- **Gender-specific Access**: Male/Female warden access control
- **Analytics**: Overview of complaint statistics and trends

### For Staff
- **Task Management**: View assigned complaints and update status
- **Work Updates**: Mark complaints as fixed with completion details

## 🛠️ Technical Stack

- **Frontend**: React Native with Expo
- **Backend**: Firebase Realtime Database
- **Storage**: Clodinary API for image uploads
- **State Management**: React Context API + AsyncStorage

## 📱 Screens

### Authentication
- Login Screen with role-based routing
- Student Registration with hostel details

### Student Interface
- Dashboard with complaint tabs (Submitted/Approved/Fixed)
- Complaint submission with image upload
- Complaint details and voting system

### Warden Interface
- Complaint management dashboard
- Staff management with gender-based filtering
- Approval workflow management

### Staff Interface
- Assigned tasks dashboard
- Status update functionality
- Completion reporting

## 🔐 User Roles

| Role | Access Level | Features |
|------|-------------|----------|
| Student | Basic | Submit complaints, vote, track status |
| Warden (Male) | Admin | Manage male hostel complaints and staff |
| Warden (Female) | Admin | Manage female hostel complaints and staff |
| Staff | Limited | Update assigned complaint status |

## 🚀 APK access
- Coming soon
