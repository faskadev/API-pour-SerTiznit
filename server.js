require('dotenv').config();
const express = require('express');
const { Client } = require('pg');

const app = express();
app.use(express.json());

// Database connection configuration
const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// Connect to the database
client.connect()
  .then(() => {
    console.log('✅ Connected to PostgreSQL database!');
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  });

// GET /artisans — Retrieve all artisans
app.get('/artisans', async (req, res) => {
  try {
    const result = await client.query('SELECT * FROM artisans');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching artisans:', err.message);
    res.status(500).json({ error: 'Failed to retrieve artisans' });
  }
});

// GET /artisans/:id — Retrieve one artisan by ID
app.get('/artisans/:id', async (req, res) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID must be a number.' });
  }

  try {
    const result = await client.query('SELECT * FROM artisans WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'had khona rah makayanach wa ghayaraha.' });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching artisan by ID:', err.message);
    res.status(500).json({ error: 'Failed to fetch artisan' });
  }
});
// POST /artisans — Add a new artisan
app.post('/artisans', async (req, res) => {
  const { nom, profession, telephone, adresse, note } = req.body;

  // Validation: required fields
  if (!nom || !profession) {
    return res.status(400).json({
      error: 'Fields "nom" and "profession" are required.'
    });
  }

  try {
    const query = `
      INSERT INTO artisans (nom, profession, telephone, adresse, note)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [nom, profession, telephone || null, adresse || null, note || 0.0];
    
    const result = await client.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding artisan:', err.message);
    res.status(500).json({ error: 'Failed to add artisan' });
  }
});

// PUT /artisans/:id — Update an existing artisan by ID
app.put('/artisans/:id', async (req, res) => {
  const { id } = req.params;
  const { nom, profession, telephone, adresse, note } = req.body;

  // Validation: ID must be a number
  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID must be a number.' });
  }

  try {
    // First, check if the artisan exists
    const checkResult = await client.query('SELECT * FROM artisans WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Artisan not found.' });
    }

    // Build dynamic update query (only update provided fields)
    const fields = [];
    const values = [];
    let index = 1;

    if (nom !== undefined) {
      fields.push(`nom = $${index++}`);
      values.push(nom);
    }
    if (profession !== undefined) {
      fields.push(`profession = $${index++}`);
      values.push(profession);
    }
    if (telephone !== undefined) {
      fields.push(`telephone = $${index++}`);
      values.push(telephone);
    }
    if (adresse !== undefined) {
      fields.push(`adresse = $${index++}`);
      values.push(adresse);
    }
    if (note !== undefined) {
      fields.push(`note = $${index++}`);
      values.push(note);
    }

    // If no fields to update
    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update.' });
    }

    // Add ID at the end for WHERE clause
    values.push(id);

    const query = `
      UPDATE artisans
      SET ${fields.join(', ')}
      WHERE id = $${index}
      RETURNING *;
    `;

    const result = await client.query(query, values);
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Error updating artisan:', err.message);
    res.status(500).json({ error: 'Failed to update artisan' });
  }
});

// DELETE /artisans/:id — Delete an artisan by ID
app.delete('/artisans/:id', async (req, res) => {
  const { id } = req.params;

  // Validate ID is a number
  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID must be a number.' });
  }

  try {
    // Check if artisan exists
    const checkResult = await client.query('SELECT * FROM artisans WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Artisan not found.' });
    }

    // Delete the artisan
    await client.query('DELETE FROM artisans WHERE id = $1', [id]);
    res.status(204).send(); // No content
  } catch (err) {
    console.error('Error deleting artisan:', err.message);
    res.status(500).json({ error: 'Failed to delete artisan' });
  }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🧪 Test endpoint: GET http://localhost:${PORT}/artisans`);
});