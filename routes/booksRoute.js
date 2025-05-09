import express from 'express';
import multer from 'multer';
import cloudinary from '../cloudinary.js';
import { Book } from '../models/bookModel.js';
import {authenticateToken} from '../middleware/authMiddleware.js';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/', authenticateToken, upload.single('image'),async (req, res) => {
  try {
    const { title, author, publishYear } = req.body;
    const createdBy = req.user.userId; 

    if (!title || !author || !publishYear || !req.file) {
      return res.status(400).json({ message: 'Missing required fields: title, author, publish year, and image' });
    }

 
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'books' },
        (error, result) => {
          if (error) {
            console.error('Error uploading image to Cloudinary:', error);
            reject(new Error('Error uploading image to Cloudinary'));
          }
          resolve(result.secure_url);  
        }
      );
      uploadStream.end(req.file.buffer);
    });

    
    const newBook = await Book.create({
      title,
      author,
      publishYear,
      createdBy,
      image: uploadResult,  
    });

    res.status(201).json({ book: newBook }); 
  } catch (error) {
    console.error('Error adding book:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});
router.get('/', authenticateToken, async (req, res) => {
  try {
    const books = await Book.find({ createdBy: req.user.userId });

    if (!books.length) {
      return res.status(404).json({ message: 'No books found' });
    }

    res.status(200).json(books);
  } catch (error) {
    console.error('Error fetching books:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const book = await Book.findOne({ _id: req.params.id, createdBy: req.user.userId });

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    res.status(200).json(book);
  } catch (error) {
    console.error('Error fetching book:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, author, publishYear } = req.body;

    if (!title || !author || !publishYear) {
      return res.status(400).json({ message: 'Missing required fields: title, author, or publish year' });
    }


    console.log('Updating book with ID:', req.params.id);
    console.log('Request body:', { title, author, publishYear });

    const updatedBook = await Book.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.userId },
      { title, author, publishYear },
      { new: true }
    );

    if (!updatedBook) {
      return res.status(404).json({ message: 'Book not found or you do not have permission to update it' });
    }

    res.status(200).json({ message: 'Book updated successfully', book: updatedBook });
  } catch (error) {
    console.error('Error updating book:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.delete('/:id', authenticateToken, async (req, res) => {
  try {
   
    const deletedBook = await Book.findOneAndDelete({ _id: req.params.id, createdBy: req.user.userId });

    if (!deletedBook) {
      return res.status(404).json({ message: 'Book not found or you are not authorized to delete this book.' });
    }


    res.status(200).json({
      message: 'Book deleted successfully',
      deletedBook,
    });
  } catch (error) {
    console.error('Error deleting book:', error.message);
    res.status(500).json({ message: 'Internal server error, please try again later.' });
  }
});


export default router;
