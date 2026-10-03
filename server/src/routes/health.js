import { Router } from 'express';

const router = Router();

// GET /api/health -> { ok: true }
router.get('/', (req, res) => {
  res.json({ ok: true });
});

export default router;
