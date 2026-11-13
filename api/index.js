const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'MealMate API',
    version: '0.2.0',
    endpoints: {
      profile: '/api/profile',
      recipes: '/api/recipes',
      recipeSearch: '/api/recipes/search',
      pantry: '/api/pantry',
      groceryList: '/api/grocery-list',
      deals: '/api/deals',
      health: '/api/health'
    }
  });
});

// Liveness check used by the smoke test.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/profile', require('./routes/profile'));
app.use('/api/recipes', require('./routes/recipes'));
app.use('/api/pantry', require('./routes/pantry'));
app.use('/api/grocery-list', require('./routes/grocery-list'));
app.use('/api/deals', require('./routes/deals'));

// 404 for unmatched routes
app.use((req, res) => {
  res.status(404).json({ error: `Not found: ${req.method} ${req.path}` });
});

// Error handling
app.use((err, req, res, next) => {
  const status = err.status || 500;
  if (status >= 500) console.error(err.stack);
  res.status(status).json({ error: err.message || 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`MealMate API server running on http://localhost:${PORT}`);
});
