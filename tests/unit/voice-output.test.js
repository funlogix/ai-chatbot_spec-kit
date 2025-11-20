// Unit test for voice output functionality

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
    console.log(`Running ${this.tests.length} voice output tests...\n`);
    
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
    
    console.log(`\nVoice Output Test Results: ${this.passed} passed, ${this.failed} failed`);
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

runner.test('Voice output should be initializable', () => {
  // Mock the speech synthesis API
  window.speechSynthesis = window.speechSynthesis || {
    speak: () => {},
    cancel: () => {},
    pause: () => {},
    resume: () => {},
    speaking: false,
    paused: false,
    pending: false,
    getVoices: () => [],
    addEventListener: () => {}
  };
  
  window.SpeechSynthesisUtterance = window.SpeechSynthesisUtterance || function(text) {
    this.text = text;
    this.rate = 1;
    this.pitch = 1;
    this.volume = 1;
  };
  
  const voiceOutput = new VoiceOutput();
  assert.ok(voiceOutput, 'Should create VoiceOutput instance');
});

runner.test('Voice output should support required functions', () => {
  // Mock the speech synthesis API
  window.speechSynthesis = window.speechSynthesis || {
    speak: () => {},
    cancel: () => {},
    pause: () => {},
    resume: () => {},
    speaking: false,
    paused: false,
    pending: false,
    getVoices: () => [],
    addEventListener: () => {}
  };
  
  window.SpeechSynthesisUtterance = window.SpeechSynthesisUtterance || function(text) {
    this.text = text;
    this.rate = 1;
    this.pitch = 1;
    this.volume = 1;
  };
  
  const voiceOutput = new VoiceOutput();
  
  assert.ok(voiceOutput.speak, 'Should have speak function');
  assert.ok(voiceOutput.stop, 'Should have stop function');
  assert.ok(voiceOutput.pause, 'Should have pause function');
  assert.ok(voiceOutput.resume, 'Should have resume function');
  assert.ok(voiceOutput.isVoiceOutputEnabled, 'Should have isVoiceOutputEnabled function');
});

runner.test('Voice output should toggle correctly', () => {
  // Mock the speech synthesis API and DOM
  window.speechSynthesis = window.speechSynthesis || {
    speak: () => {},
    cancel: () => {},
    pause: () => {},
    resume: () => {},
    speaking: false,
    paused: false,
    pending: false,
    getVoices: () => [],
    addEventListener: () => {}
  };
  
  window.SpeechSynthesisUtterance = window.SpeechSynthesisUtterance || function(text) {
    this.text = text;
    this.rate = 1;
    this.pitch = 1;
    this.volume = 1;
  };
  
  // Mock the button element
  const mockButton = {
    classList: {
      contains: (cls) => cls === 'active', // Initially not active
      toggle: function(cls) {
        this._active = !this._active;
      },
      add: (cls) => { this._active = true; },
      remove: (cls) => { this._active = false; },
      _active: false,
      item: (index) => index === 0 ? (this._active ? 'active' : '') : null
    },
    title: ''
  };
  
  // Mock document.getElementById to return our mock button
  const originalGetElementById = document.getElementById;
  document.getElementById = (id) => id === 'voice-output-btn' ? mockButton : null;
  
  const voiceOutput = new VoiceOutput();
  
  // Initially should be disabled
  assert.equal(voiceOutput.isVoiceOutputEnabled(), false, 'Should be disabled initially');
  
  // Toggle on
  voiceOutput.voiceOutputButton.classList.toggle('active');
  assert.equal(voiceOutput.isVoiceOutputEnabled(), true, 'Should be enabled after toggle');
  
  // Toggle off
  voiceOutput.voiceOutputButton.classList.toggle('active');
  assert.equal(voiceOutput.isVoiceOutputEnabled(), false, 'Should be disabled after second toggle');
  
  // Restore original method
  document.getElementById = originalGetElementById;
});

runner.test('Voice output should speak text when enabled', () => {
  let speakCalled = false;
  let utteranceReceived = null;
  
  // Mock the speech synthesis API
  window.speechSynthesis = window.speechSynthesis || {
    speak: (utterance) => {
      speakCalled = true;
      utteranceReceived = utterance;
    },
    cancel: () => {},
    pause: () => {},
    resume: () => {},
    speaking: false,
    paused: false,
    pending: false,
    getVoices: () => [],
    addEventListener: () => {}
  };
  
  window.SpeechSynthesisUtterance = window.SpeechSynthesisUtterance || function(text) {
    this.text = text;
    this.rate = 1;
    this.pitch = 1;
    this.volume = 1;
  };
  
  // Mock the button element
  const mockButton = {
    classList: {
      contains: (cls) => cls === 'active', // Make it appear active/enabled
      toggle: function(cls) { this._active = !this._active; },
      add: (cls) => { this._active = true; },
      remove: (cls) => { this._active = false; },
      _active: true // Simulate enabled state
    },
    title: ''
  };
  
  // Mock document.getElementById to return our mock button
  const originalGetElementById = document.getElementById;
  document.getElementById = (id) => id === 'voice-output-btn' ? mockButton : null;
  
  const voiceOutput = new VoiceOutput();
  
  // Call speak when enabled
  const testText = "Hello, this is a test";
  voiceOutput.speak(testText);
  
  // Should have called speak
  assert.ok(speakCalled, 'Should call speechSynthesis.speak when enabled');
  assert.ok(utteranceReceived, 'Should create an utterance');
  assert.equal(utteranceReceived.text, testText, 'Should speak the correct text');
  
  // Restore original method
  document.getElementById = originalGetElementById;
});

runner.test('Voice output should not speak when disabled', () => {
  let speakCalled = false;
  
  // Mock the speech synthesis API
  window.speechSynthesis = window.speechSynthesis || {
    speak: () => { speakCalled = true; },
    cancel: () => {},
    pause: () => {},
    resume: () => {},
    speaking: false,
    paused: false,
    pending: false,
    getVoices: () => [],
    addEventListener: () => {}
  };
  
  window.SpeechSynthesisUtterance = window.SpeechSynthesisUtterance || function(text) {
    this.text = text;
    this.rate = 1;
    this.pitch = 1;
    this.volume = 1;
  };
  
  // Mock the button element as disabled
  const mockButton = {
    classList: {
      contains: (cls) => cls === 'active' ? false : false, // Always return false (disabled)
      toggle: function(cls) { this._active = !this._active; },
      add: (cls) => { this._active = true; },
      remove: (cls) => { this._active = false; },
      _active: false
    },
    title: ''
  };
  
  // Mock document.getElementById to return our mock button
  const originalGetElementById = document.getElementById;
  document.getElementById = (id) => id === 'voice-output-btn' ? mockButton : null;
  
  const voiceOutput = new VoiceOutput();
  
  // Call speak when disabled
  voiceOutput.speak("This should not be spoken");
  
  // Should NOT have called speak
  assert.equal(speakCalled, false, 'Should not call speechSynthesis.speak when disabled');
  
  // Restore original method
  document.getElementById = originalGetElementById;
});

runner.test('Voice output configuration should work', () => {
  // Mock the speech synthesis API
  window.speechSynthesis = window.speechSynthesis || {
    speak: () => {},
    cancel: () => {},
    pause: () => {},
    resume: () => {},
    speaking: false,
    paused: false,
    pending: false,
    getVoices: () => [],
    addEventListener: () => {}
  };
  
  window.SpeechSynthesisUtterance = window.SpeechSynthesisUtterance || function(text) {
    this.text = text;
    this.rate = 1;
    this.pitch = 1;
    this.volume = 1;
  };
  
  const voiceOutput = new VoiceOutput();
  
  // Test rate configuration
  voiceOutput.setVoiceRate(0.7);
  assert.equal(CONFIG.VOICE_DEFAULT_RATE, 0.7, 'Should set voice rate');
  
  // Test pitch configuration
  voiceOutput.setVoicePitch(1.2);
  assert.equal(CONFIG.VOICE_DEFAULT_PITCH, 1.2, 'Should set voice pitch');
  
  // Test volume configuration
  voiceOutput.setVoiceVolume(0.9);
  assert.equal(CONFIG.VOICE_DEFAULT_VOLUME, 0.9, 'Should set voice volume');
});

// Run the tests
runner.run()
  .then(results => {
    console.log(`\nFinal Voice Output Unit Test Results: ${results.passed} passed, ${results.failed} failed`);
  })
  .catch(error => {
    console.error('Error running voice output unit tests:', error);
  });