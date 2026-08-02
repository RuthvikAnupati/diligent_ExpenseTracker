const createApp = require('./app');

const PORT = process.env.PORT || 3000;
const app = createApp();

app.listen(PORT, () => {
  console.log(`Smart Expense Tracker API is running on http://localhost:${PORT}`);
  console.log(`Swagger Interactive Docs available at http://localhost:${PORT}/docs`);
});
