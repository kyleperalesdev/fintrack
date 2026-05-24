const express = require('express');
const cors = require('cors');
const entriesRouter = require('./routes/entries');
const importRouter = require('./routes/import');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/api/entries', entriesRouter);
app.use('/api/import', importRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
