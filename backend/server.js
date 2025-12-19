const express = require('express');

const app = express();
const port = process.env.PORT || 3001;

// Sample route
app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});