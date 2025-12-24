import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Notes from './pages/Notes';
import UploadNote from './pages/UploadNote';
import NoteDetail from './pages/NoteDetail';
import PaymentUpload from './pages/PaymentUpload';
import MyPayments from './pages/MyPayments';
import AdminPayments from './pages/AdminPayments';
import Forum from './pages/Forum';
import QuestionDetail from './pages/QuestionDetail';
import CreateQuestion from './pages/CreateQuestion';
import Tutors from './pages/Tutors';
import TutorProfile from './pages/TutorProfile';
import SessionBooking from './pages/SessionBooking';
import MySessions from './pages/MySessions';
import Reminders from './pages/Reminders';
import PrivateRoute from './components/PrivateRoute';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <main className="main-content">
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
              <Route path="/admin/payments" element={<PrivateRoute><AdminPayments /></PrivateRoute>} />
              <Route path="/forum/create" element={<PrivateRoute><CreateQuestion /></PrivateRoute>} />
              <Route path="/book-session/:tutorId" element={<PrivateRoute><SessionBooking /></PrivateRoute>} />
              <Route path="/my-sessions" element={<PrivateRoute><MySessions /></PrivateRoute>} />
              <Route path="/reminders" element={<PrivateRoute><Reminders /></PrivateRoute>} />
              
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
