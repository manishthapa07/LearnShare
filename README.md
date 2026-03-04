# LearnShare 📚

A comprehensive educational platform that connects students with tutors, facilitates class enrollment, enables note sharing, and provides a collaborative learning forum.

## ✨ Features

### 🎓 Tuition Classes
- **Create & Manage Classes**: Tutors can create monthly or hourly tuition classes
- **Browse Classes**: Students can browse available classes by subject and tutor
- **Enrollment System**: Complete enrollment workflow with approval and payment verification
- **Payment Processing**: Support for multiple payment methods (Bank Transfer, eSewa, Khalti, QR Code)

### 📝 Notes Marketplace
- **Upload Notes**: Share your study materials with the community
- **Browse & Purchase**: Find and purchase notes on various subjects
- **Payment Verification**: Secure payment verification system for note purchases
- **Track Earnings**: Note uploaders can track their earnings from sales

### 💬 Study Forum
- **Ask Questions**: Post academic questions to the community
- **Provide Answers**: Help others by answering their questions
- **Vote System**: Upvote helpful questions and answers
- **Rating System**: Rate the quality and helpfulness of content

### 👨‍🏫 Tutor Services
- **Tutor Profiles**: Detailed profiles showcasing expertise, education, and experience
- **Session Booking**: Book one-on-one tutoring sessions
- **Reviews & Ratings**: Rate and review tutor sessions
- **Session Management**: Track active and completed sessions

### 🔔 Smart Features
- **Real-time Notifications**: Stay updated on enrollments, payments, and forum activities
- **Reminders**: Set custom reminders for important tasks and deadlines
- **Payment Dashboard**: Comprehensive view of all payment activities
- **Admin Panel**: Manage payments, users, and platform activities

## 🛠️ Technology Stack

### Frontend
- **React** (v19.2) - Modern UI library
- **React Router** (v7.11) - Client-side routing
- **Axios** - HTTP client for API calls
- **CSS3** - Custom styling with responsive design

### Backend
- **Node.js** - JavaScript runtime
- **Express** (v5.2) - Web application framework
- **PostgreSQL** (v8.16) - Relational database
- **JWT** - Secure authentication
- **Multer** - File upload handling
- **bcryptjs** - Password hashing

### Architecture
- RESTful API design
- JWT-based authentication
- Role-based access control (Student, Tutor, Admin)
- Transaction-based database operations
- Lazy loading for optimized performance

## 📋 Prerequisites

- **Node.js** (v14 or higher)
- **PostgreSQL** (v12 or higher)
- **npm** or **yarn**

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd LearnShare
```

### 2. Database Setup

Create a PostgreSQL database:
```bash
psql -U postgres
CREATE DATABASE learnshare;
\q
```

Run the database schema:
```bash
psql -U postgres -d learnshare -f server/src/config/db-schema.sql
```

### 3. Server Setup

Navigate to server directory:
```bash
cd server
```

Install dependencies:
```bash
npm install
```

Create environment file:
```bash
cp .env.example .env
```

Configure your `.env` file:
```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=learnshare

JWT_SECRET=your_secure_random_secret_key
JWT_EXPIRE=7d

MAX_FILE_SIZE=10485760
```

Start the server:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

### 4. Client Setup

Navigate to client directory:
```bash
cd client
```

Install dependencies:
```bash
npm install
```

Create environment file:
```bash
cp .env.example .env
```

Configure your `.env` file:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

Start the development server:
```bash
npm start
```

The application will open at `http://localhost:3000`

## 📁 Project Structure

```
LearnShare/
├── client/                 # React frontend
│   ├── public/            # Static files
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── context/       # React context (Auth)
│   │   ├── pages/         # Page components
│   │   ├── services/      # API service modules
│   │   ├── App.js         # Main app component
│   │   └── index.js       # App entry point
│   └── package.json
│
├── server/                # Node.js backend
│   ├── src/
│   │   ├── config/        # Database & configuration
│   │   ├── controllers/   # Request handlers
│   │   ├── middleware/    # Auth & upload middleware
│   │   ├── routes/        # API routes
│   │   ├── utils/         # Utility functions
│   │   └── index.js       # Server entry point
│   ├── uploads/           # Uploaded files
│   │   ├── notes/
│   │   └── payments/
│   ├── .env.example       # Environment template
│   └── package.json
│
└── README.md
```

## 🔐 User Roles & Permissions

### Student
- Browse and enroll in classes
- Purchase and upload notes
- Book tutoring sessions
- Participate in forum discussions
- Manage payments and purchases

### Tutor
- Create and manage tuition classes
- Approve enrollment requests
- Verify student payments
- Manage tutoring sessions
- Upload notes

### Admin
- Verify all payments
- Manage users and content
- Access comprehensive dashboards
- Override permissions when needed

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Classes
- `GET /api/classes` - Browse all classes
- `POST /api/classes` - Create new class (Tutor)
- `GET /api/classes/:id` - Get class details
- `POST /api/classes/:id/enroll` - Enroll in class
- `GET /api/classes/my-classes` - Get tutor's classes

### Notes
- `GET /api/notes` - Browse all notes
- `POST /api/notes` - Upload note
- `GET /api/notes/:id` - Get note details
- `GET /api/notes/purchased` - Get purchased notes

### Forum
- `GET /api/forum/questions` - Get all questions
- `POST /api/forum/questions` - Create question
- `GET /api/forum/questions/:id` - Get question details
- `POST /api/forum/questions/:id/answers` - Post answer
- `POST /api/forum/questions/:id/vote` - Vote on question

### Tutors
- `GET /api/tutors` - Get all tutors
- `GET /api/tutors/:id` - Get tutor profile
- `POST /api/tutors/profile` - Create/Update tutor profile
- `POST /api/tutors/book-session` - Book tutoring session

### Payments
- `POST /api/payments/submit` - Submit payment
- `GET /api/payments/user` - Get user payments
- `PUT /api/payments/:id/status` - Update payment status (Admin/Uploader)

### Notifications
- `GET /api/notifications` - Get user notifications
- `GET /api/notifications/unread-count` - Get unread count
- `PUT /api/notifications/:id/read` - Mark as read

For complete API documentation, see [API.md](./API.md)

## 🧪 Testing

Run tests:
```bash
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test
```

## 📦 Building for Production

### Build Client
```bash
cd client
npm run build
```

### Deploy Server
```bash
cd server
NODE_ENV=production npm start
```

## 🔧 Environment Variables

### Server Environment Variables
| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 5000) |
| `NODE_ENV` | Environment mode | No (default: development) |
| `DB_HOST` | PostgreSQL host | Yes |
| `DB_PORT` | PostgreSQL port | No (default: 5432) |
| `DB_USER` | Database user | Yes |
| `DB_PASSWORD` | Database password | Yes |
| `DB_NAME` | Database name | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `JWT_EXPIRE` | Token expiration | No (default: 7d) |
| `MAX_FILE_SIZE` | Max upload size | No (default: 10MB) |

### Client Environment Variables
| Variable | Description | Required |
|----------|-------------|----------|
| `REACT_APP_API_URL` | Backend API URL | Yes |

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](./CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 👥 Authors

- Development Team

## 🙏 Acknowledgments

- React team for the amazing framework
- Express.js for the backend framework
- PostgreSQL for the robust database
- All contributors who have helped shape LearnShare

## 📞 Support

For support, please create an issue in the repository or contact the development team.

## 🗺️ Roadmap

- [ ] Real-time chat between students and tutors
- [ ] Video conferencing integration
- [ ] Mobile application (React Native)
- [ ] Advanced analytics dashboard
- [ ] Automated payment reminders
- [ ] Certificate generation for completed courses
- [ ] Multi-language support

---

Made with ❤️ by the LearnShare Team
