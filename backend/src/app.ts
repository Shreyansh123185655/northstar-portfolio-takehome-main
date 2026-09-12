import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import multer from 'multer';
import { parse } from 'csv-parse';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/northstar'
});

app.use(cors());
app.use(express.json());

// Run migrations and seeds on startup
async function initDb() {
  try {
    const migrationSql = fs.readFileSync(path.join(__dirname, 'db/migration.sql'), 'utf-8');
    await pool.query(migrationSql);
    const seedSql = fs.readFileSync(path.join(__dirname, 'db/seed.sql'), 'utf-8');
    await pool.query(seedSql);
    console.log('Database initialized successfully.');
  } catch (err) {
    console.error('Error initializing database', err);
  }
}
initDb();

const upload = multer({ dest: 'uploads/' });

// Auth Middleware
const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    req.user = payload; // { userId, tenantId }
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid email or password.' });
    
    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password.' });
    
    const token = jwt.sign({ userId: user.id, tenantId: user.tenant_id }, JWT_SECRET, { expiresIn: '1d' });
    
    const tenantRes = await pool.query('SELECT name FROM tenants WHERE id = $1', [user.tenant_id]);
    const tenantName = tenantRes.rows[0].name;

    res.json({ token, user: { id: user.id, email: user.email, tenantId: user.tenant_id, tenantName } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

app.post('/api/holdings/upload', authenticate, upload.single('file'), (req: any, res: any) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  
  const tenantId = req.user.tenantId;
  const results: any[] = [];
  const errors: any[] = [];
  const seenKeys = new Set();
  let rowCount = 1; // Header is row 1
  
  fs.createReadStream(req.file.path)
    .pipe(parse({ columns: true, skip_empty_lines: true }))
    .on('data', (data) => {
      rowCount++;
      
      // Validation: date, ticker, asset_class, quantity, price
      if (!data.date || !data.ticker || !data.asset_class || data.quantity === undefined || data.price === undefined) {
        errors.push({ row: rowCount, message: `Missing required field in row.` });
        return;
      }
      
      const parsedDate = new Date(data.date);
      if (isNaN(parsedDate.getTime())) {
        errors.push({ row: rowCount, message: `Invalid date format.` });
        return;
      }
      
      const quantity = parseFloat(data.quantity);
      if (isNaN(quantity) || quantity < 0) {
        errors.push({ row: rowCount, message: `Quantity must be a positive number.` });
        return;
      }
      
      const price = parseFloat(data.price);
      if (isNaN(price) || price < 0) {
        errors.push({ row: rowCount, message: `Price must be a positive number.` });
        return;
      }
      
      const key = `${data.date}_${data.ticker}_${data.asset_class}_${quantity}_${price}`;
      if (seenKeys.has(key)) {
        errors.push({ row: rowCount, message: `Duplicate holding detected.` });
        return;
      }
      seenKeys.add(key);

      results.push({
        date: data.date,
        ticker: data.ticker,
        asset_class: data.asset_class,
        quantity: quantity,
        price: price
      });
    })
    .on('end', async () => {
      fs.unlinkSync(req.file.path); // Clean up
      
      if (errors.length > 0) {
        return res.status(400).json({ message: 'CSV validation failed', errors });
      }
      
      try {
        await pool.query('BEGIN');
        await pool.query('DELETE FROM holdings WHERE tenant_id = $1', [tenantId]);
        
        for (const row of results) {
          await pool.query(
            'INSERT INTO holdings (tenant_id, holding_date, ticker, asset_class, quantity, price) VALUES ($1, $2, $3, $4, $5, $6)',
            [tenantId, row.date, row.ticker, row.asset_class, row.quantity, row.price]
          );
        }
        await pool.query('COMMIT');
        res.json({ message: 'Holdings uploaded successfully.', count: results.length });
      } catch (err) {
        await pool.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Something went wrong. Please try again.' });
      }
    });
});

app.get('/api/dashboard', authenticate, async (req: any, res: any) => {
  const tenantId = req.user.tenantId;
  
  try {
    const holdingsRes = await pool.query('SELECT * FROM holdings WHERE tenant_id = $1 ORDER BY holding_date ASC', [tenantId]);
    const holdings = holdingsRes.rows;
    
    if (holdings.length === 0) {
      return res.json({
        hasData: false,
        message: 'No holdings uploaded yet.'
      });
    }
    
    // Find earliest and latest dates
    const earliestDate = holdings[0].holding_date;
    const latestDate = holdings[holdings.length - 1].holding_date;
    
    let startMarketValue = 0;
    let endMarketValue = 0;
    
    const assetClassMap: Record<string, number> = {};
    
    for (const h of holdings) {
      const value = parseFloat(h.quantity) * parseFloat(h.price);
      
      // Compute start and end market values based on exact Date match
      // Note: PostgreSQL DATE type is returned as a JS Date object
      if (h.holding_date.getTime() === earliestDate.getTime()) {
        startMarketValue += value;
      }
      
      if (h.holding_date.getTime() === latestDate.getTime()) {
        endMarketValue += value;
        // Group market value by asset class for the latest date (current portfolio)
        if (!assetClassMap[h.asset_class]) {
          assetClassMap[h.asset_class] = 0;
        }
        assetClassMap[h.asset_class] = (assetClassMap[h.asset_class] || 0) + value;
      }
    }
    
    let periodReturn = 0;
    if (startMarketValue > 0) {
      periodReturn = (endMarketValue - startMarketValue) / startMarketValue;
    }
    
    const assetClassBreakdown = Object.keys(assetClassMap).map(ac => ({
      assetClass: ac,
      marketValue: assetClassMap[ac]
    }));
    
    res.json({
      hasData: true,
      startDate: earliestDate.toISOString().split('T')[0],
      endDate: latestDate.toISOString().split('T')[0],
      startMarketValue,
      endMarketValue,
      periodReturn,
      assetClassBreakdown
    });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

app.listen(port, () => {
  console.log(`API running on port ${port}`);
});
