const app = require('./app');

const PORT = parseInt(process.env.PORT, 10) || 5000;

app.listen(PORT, () => {
  console.log(`DSP Real Estate Investment API running on port ${PORT}`);
  console.log(`API docs available at http://localhost:${PORT}/api/docs`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
