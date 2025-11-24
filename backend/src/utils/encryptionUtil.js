// backend/src/utils/encryptionUtil.js
const crypto = require('crypto');

// Decrypt API key when needed
function decryptApiKey(encryptedApiKey, iv, encryptionKey) {
  const algorithm = 'aes-256-cbc';
  
  // Recreate the 32-byte key from the encryptionKey string
  const key = crypto.createHash('sha256').update(encryptionKey).digest();
  const ivBuffer = Buffer.from(iv, 'base64');
  
  // Create decipher and decrypt the API key
  const decipher = crypto.createDecipheriv(algorithm, key, ivBuffer);
  let decrypted = decipher.update(encryptedApiKey, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Encrypt API key before storing
function encryptApiKey(apiKey, encryptionKey) {
  const algorithm = 'aes-256-cbc';
  
  // Create a 32-byte key from the encryptionKey string using SHA-256
  const key = crypto.createHash('sha256').update(encryptionKey).digest();
  const iv = crypto.randomBytes(16); // Generate a random IV for each encryption
  
  // Create cipher and encrypt the API key
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(apiKey, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  return { encrypted, iv: iv.toString('base64') };
}

module.exports = {
  encryptApiKey,
  decryptApiKey
};