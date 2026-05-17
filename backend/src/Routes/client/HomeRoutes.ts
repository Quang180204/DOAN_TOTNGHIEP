import express from 'express'
import { Index } from '../../Controllers/client/HomeController'

const router = express.Router()

router.get('/', Index)

export default router