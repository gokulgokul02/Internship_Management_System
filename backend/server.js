const express = require('express');
const app = express();
const PORT = 5000;

app.get('/', (req, res) => {
  res.send('Internship Management System Backend Running');
});

app.listen(PORT, () => console.log(`Server started on http://localhost:${PORT}`));
