const multer = require('multer');
const path = require('path');

// Storage for note files
const noteStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/notes/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'note-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Storage for payment screenshots
const paymentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/payments/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'payment-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for documents (notes)
const noteFileFilter = (req, file, cb) => {
  const allowedTypes = ['.pdf', '.doc', '.docx', '.txt', '.ppt', '.pptx'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only document files are allowed (PDF, DOC, DOCX, TXT, PPT, PPTX)'));
  }
};

// File filter for images (payment screenshots)
const imageFileFilter = (req, file, cb) => {
  const allowedTypes = ['.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (JPG, JPEG, PNG)'));
  }
};

const uploadNote = multer({
  storage: noteStorage,
  fileFilter: noteFileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 } // 10MB default
});

const uploadPayment = multer({
  storage: paymentStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5242880 } // 5MB
});

module.exports = { uploadNote, uploadPayment };
