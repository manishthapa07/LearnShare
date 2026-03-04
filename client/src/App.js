import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import './App.css';

// Lazy load components
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Profile = lazy(() => import('./pages/Profile'));
const Notes = lazy(() => import('./pages/Notes'));
const UploadNote = lazy(() => import('./pages/UploadNote'));
const NoteDetail = lazy(() => import('./pages/NoteDetail'));
const PaymentUpload = lazy(() => import('./pages/PaymentUpload'));
const MyPayments = lazy(() => import('./pages/MyPayments'));
const AdminPayments = lazy(() => import('./pages/AdminPayments'));
const Forum = lazy(() => import('./pages/Forum'));
const QuestionDetail = lazy(() => import('./pages/QuestionDetail'));
const CreateQuestion = lazy(() => import('./pages/CreateQuestion'));
const Tutors = lazy(() => import('./pages/Tutors'));
const TutorProfile = lazy(() => import('./pages/TutorProfile'));
const SessionBooking = lazy(() => import('./pages/SessionBooking'));
const SessionPayment = lazy(() => import('./pages/SessionPayment'));
const SessionPayments = lazy(() => import('./pages/SessionPayments'));
const MySessions = lazy(() => import('./pages/MySessions'));
const MyClassSessions = lazy(() => import('./pages/MyClassSessions'));
const Reminders = lazy(() => import('./pages/Reminders'));
const CreateClass = lazy(() => import('./pages/CreateClass'));
const MyClasses = lazy(() => import('./pages/MyClasses'));
const ClassDetail = lazy(() => import('./pages/ClassDetail'));
const BrowseClasses = lazy(() => import('./pages/BrowseClasses'));
const EditClass = lazy(() => import('./pages/EditClass'));
const EnrollmentRequests = lazy(() => import('./pages/EnrollmentRequests'));
const EnrollmentPayment = lazy(() => import('./pages/EnrollmentPayment'));
const PaymentVerification = lazy(() => import('./pages/PaymentVerification'));
const MyPurchasedNotes = lazy(() => import('./pages/MyPurchasedNotes'));
const NotFound = lazy(() => import('./pages/NotFound'));

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <main className="main-content">
            <Suspense fallback={
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                fontSize: '18px',
                color: '#667eea'
              }}>
                Loading...
              </div>
            }>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/notes" element={<Notes />} />
              <Route path="/notes/:id" element={<NoteDetail />} />
              <Route path="/forum" element={<Forum />} />
              <Route path="/forum/questions/:id" element={<QuestionDetail />} />
              <Route path="/tutors" element={<Tutors />} />
              <Route path="/tutors/:id" element={<TutorProfile />} />
              
              {/* Protected Routes */}
              <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
              <Route path="/upload-note" element={<PrivateRoute><UploadNote /></PrivateRoute>} />
              <Route path="/payment-upload" element={<PrivateRoute><PaymentUpload /></PrivateRoute>} />
              <Route path="/my-payments" element={<PrivateRoute><MyPayments /></PrivateRoute>} />
              <Route path="/my-purchased-notes" element={<PrivateRoute><MyPurchasedNotes /></PrivateRoute>} />
              <Route path="/admin/payments" element={<PrivateRoute><AdminPayments /></PrivateRoute>} />
              <Route path="/forum/create" element={<PrivateRoute><CreateQuestion /></PrivateRoute>} />
              <Route path="/session-booking/:tutorId" element={<PrivateRoute><SessionBooking /></PrivateRoute>} />
              <Route path="/session-payment/:sessionId" element={<PrivateRoute><SessionPayment /></PrivateRoute>} />
              <Route path="/session-payments-review" element={<PrivateRoute><SessionPayments /></PrivateRoute>} />
              <Route path="/my-sessions" element={<PrivateRoute><MySessions /></PrivateRoute>} />
              <Route path="/my-class-sessions" element={<PrivateRoute><MyClassSessions /></PrivateRoute>} />
              <Route path="/reminders" element={<PrivateRoute><Reminders /></PrivateRoute>} />
              <Route path="/create-class" element={<PrivateRoute><CreateClass /></PrivateRoute>} />
              <Route path="/my-classes" element={<PrivateRoute><MyClasses /></PrivateRoute>} />
              <Route path="/classes" element={<BrowseClasses />} />
              <Route path="/enrollment-requests" element={<PrivateRoute><EnrollmentRequests /></PrivateRoute>} />
              <Route path="/enrollment-payment/:enrollmentId" element={<PrivateRoute><EnrollmentPayment /></PrivateRoute>} />
              <Route path="/payment-verifications" element={<PrivateRoute><PaymentVerification /></PrivateRoute>} />
              <Route path="/class/:id" element={<PrivateRoute><ClassDetail /></PrivateRoute>} />
              <Route path="/edit-class/:id" element={<PrivateRoute><EditClass /></PrivateRoute>} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
