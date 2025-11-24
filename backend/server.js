const app = require('./src/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`AI Chatbot Backend server is running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
});