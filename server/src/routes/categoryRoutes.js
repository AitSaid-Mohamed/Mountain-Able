import { Router } from 'express';
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createCategoryRules,
  updateCategoryRules,
} from '../middleware/validators/categoryValidators.js';

const router = Router();

router.get('/', listCategories);
router.post('/', protect, restrictTo('admin'), createCategoryRules, validate, createCategory);
router.patch('/:id', protect, restrictTo('admin'), updateCategoryRules, validate, updateCategory);
router.delete('/:id', protect, restrictTo('admin'), deleteCategory);

export default router;
