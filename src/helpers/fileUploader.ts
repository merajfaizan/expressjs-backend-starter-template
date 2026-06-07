import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, path.join(process.cwd(), 'uploads'));
  },
  filename: function (_req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const upload = multer({ storage: storage });

const uploadProfileImage = upload.single('profileImage');

const uploadMultiple = upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'documents', maxCount: 10 },
]);

export const fileUploader = {
  upload,
  uploadProfileImage,
  uploadMultiple,
};
