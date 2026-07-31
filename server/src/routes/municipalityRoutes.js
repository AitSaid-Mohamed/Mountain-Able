import { Router } from 'express';
import {
  listMunicipalities,
  getMunicipality,
  createMunicipality,
  updateMunicipality,
  deleteMunicipality,
} from '../controllers/municipalityController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createMunicipalityRules,
  updateMunicipalityRules,
} from '../middleware/validators/municipalityValidators.js';

const router = Router();

router.get('/', listMunicipalities);
router.get('/:id', getMunicipality);
router.post('/', protect, restrictTo('admin'), createMunicipalityRules, validate, createMunicipality);
router.patch('/:id', protect, restrictTo('admin'), updateMunicipalityRules, validate, updateMunicipality);
router.delete('/:id', protect, restrictTo('admin'), deleteMunicipality);

export default router;
