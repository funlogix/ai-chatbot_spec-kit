// Unit test for Message class

// Simple test framework (in absence of a full testing framework)
class SimpleTestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(description, fn) {
    this.tests.push({ description, fn });
  }

  async run() {
    console.log(`Running ${this.tests.length} Message class tests...\n`);
    
    for (const test of this.tests) {
      try {
        await test.fn();
        console.log(`✓ PASSED: ${test.description}`);
        this.passed++;
      } catch (error) {
        console.log(`✗ FAILED: ${test.description}`);
        console.log(`  Error: ${error.message}`);
        this.failed++;
      }
    }
    
    console.log(`\nMessage Class Test Results: ${this.passed} passed, ${this.failed} failed`);
    return { passed: this.passed, failed: this.failed };
  }
}

// Simple assertion utility
const assert = {
  equal: (actual, expected, message = '') => {
    if (actual !== expected) {
      throw new Error(`${message} Expected ${expected}, but got ${actual}`);
    }
  },
  ok: (value, message = '') => {
    if (!value) {
      throw new Error(message || `Expected truthy value, but got ${value}`);
    }
  },
  throws: (fn, expectedError, message = '') => {
    try {
      fn();
      throw new Error(message || 'Expected function to throw, but it did not');
    } catch (error) {
      if (expectedError && !(error instanceof expectedError)) {
        throw new Error(message || `Expected ${expectedError.name}, but got ${error.constructor.name}`);
      }
      // Success - the function threw an error as expected
    }
  }
};

// Create test runner
const runner = new SimpleTestRunner();

runner.test('Message should require content', () => {
  assert.throws(() => new Message(), Error, 'Should require content');
  assert.throws(() => new Message(''), Error, 'Should require non-empty content');
});

runner.test('Message should require valid sender', () => {
  assert.throws(() => new Message('test', 'invalid'), Error, 'Should require valid sender');
  assert.ok(new Message('test', 'user'), 'Should accept "user" as sender');
  assert.ok(new Message('test', 'bot'), 'Should accept "bot" as sender');
});

runner.test('Message should require valid media type', () => {
  assert.throws(() => new Message('test', 'user', 'invalid'), Error, 'Should require valid media type');
  assert.ok(new Message('test', 'user', 'text'), 'Should accept "text" as media type');
  assert.ok(new Message('test', 'user', 'audio'), 'Should accept "audio" as media type');
});

runner.test('Message should generate valid properties', () => {
  const message = new Message('Hello, world!', 'user', 'text');
  
  assert.ok(message.id, 'Should generate an ID');
  assert.equal(message.content, 'Hello, world!', 'Should have correct content');
  assert.equal(message.sender, 'user', 'Should have correct sender');
  assert.equal(message.mediaType, 'text', 'Should have correct media type');
  assert.ok(message.timestamp, 'Should have a timestamp');
  assert.equal(message.isProcessed, false, 'Should not be processed initially');
  assert.equal(message.audioUrl, null, 'Should not have audio URL for text message');
});

runner.test('Message should mark as processed', () => {
  const message = new Message('Hello, world!', 'user', 'text');
  assert.equal(message.isProcessed, false, 'Should start as not processed');
  
  message.markAsProcessed();
  assert.equal(message.isProcessed, true, 'Should be marked as processed');
});

runner.test('Message should handle audio URL correctly', () => {
  const audioMessage = new Message('Audio content', 'user', 'audio');
  const audioUrl = 'http://example.com/audio.mp3';
  
  audioMessage.setAudioUrl(audioUrl);
  assert.equal(audioMessage.audioUrl, audioUrl, 'Should set audio URL correctly');
  
  // Text message should not allow audio URL
  const textMessage = new Message('Text content', 'user', 'text');
  assert.throws(() => textMessage.setAudioUrl('http://example.com/audio.mp3'), Error, 
    'Should not allow setting audio URL for non-audio message');
});

runner.test('Message should allow content updates', () => {
  const message = new Message('Initial content', 'user', 'text');
  const initialTimestamp = message.timestamp;
  
  // Wait a moment to ensure timestamp difference
  const newContent = 'Updated content';
  message.updateContent(newContent);
  
  assert.equal(message.content, newContent, 'Should update content');
  assert.ok(message.timestamp > initialTimestamp || message.timestamp !== initialTimestamp, 
    'Should update timestamp when content is updated');
});

runner.test('Message should validate content updates', () => {
  const message = new Message('Initial content', 'user', 'text');
  
  assert.throws(() => message.updateContent(''), Error, 'Should require non-empty content on update');
  assert.equal(message.content, 'Initial content', 'Content should remain unchanged after invalid update');
});

// Run the tests
runner.run()
  .then(results => {
    console.log(`\nFinal Message Class Test Results: ${results.passed} passed, ${results.failed} failed`);
  })
  .catch(error => {
    console.error('Error running Message class tests:', error);
  });