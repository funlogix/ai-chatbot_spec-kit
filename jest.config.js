module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'backend/src/**/*.js',
    '!backend/src/server.js',
    '!backend/server.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/config/setupJest.js'],
  testMatch: [
    '<rootDir>/tests/unit/**/*.test.js',
    '<rootDir>/tests/integration/**/*.test.js',
    '<rootDir>/backend/tests/**/*.test.js'
  ],
};