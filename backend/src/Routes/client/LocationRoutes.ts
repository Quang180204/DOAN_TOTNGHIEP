import express from 'express';
import { GetProvinces, GetDistricts, GetWards } from '../../Controllers/client/LocationController';

const router = express.Router();

router.get('/provinces', GetProvinces);
router.get('/districts/:provinceId', GetDistricts);
router.get('/wards/:districtId', GetWards);

export default router;