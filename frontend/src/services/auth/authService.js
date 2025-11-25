/**
 * Authentication Service
 * Handles user authentication and role management for the AI chatbot
 * Specifically manages developer/administrator vs regular user roles
 */
class AuthService {
  constructor() {
    this.currentUser = null;
    this.roles = {
      USER: 'user',
      DEVELOPER: 'developer'
    };
  }

  /**
   * Initialize the authentication service
   * @returns {Promise<void>}
   */
  async init() {
    // Check if user is already authenticated (from session storage, etc.)
    this.currentUser = this.loadCurrentUser();
  }

  /**
   * Load current user from storage
   * @returns {Object|null} User object or null if not authenticated
   */
  loadCurrentUser() {
    try {
      const userData = localStorage.getItem('currentUser');
      if (userData) {
        return JSON.parse(userData);
      }
      return null;
    } catch (error) {
      console.error('Error loading current user:', error);
      return null;
    }
  }

  /**
   * Authenticate a user with credentials
   * In a real implementation, this would validate against a backend
   * @param {string} username - Username or identifier
   * @param {string} password - Password or token
   * @returns {Promise<Object>} Authentication result
   */
  async authenticate(username, password) {
    try {
      // In a client-side only application, this would typically involve
      // validating credentials against a backend API
      // For this implementation, we'll simulate authentication
      
      // This is a simplified implementation - in a real application,
      // authentication would be handled securely by a backend service
      const isValid = this.validateCredentials(username, password);
      
      if (isValid) {
        this.currentUser = {
          id: username,
          username: username,
          role: this.determineRole(username), // Could be 'user' or 'developer'
          authenticated: true,
          lastLogin: new Date().toISOString()
        };
        
        // Store user data locally
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        
        return {
          success: true,
          user: this.currentUser,
          message: 'Authentication successful'
        };
      } else {
        return {
          success: false,
          message: 'Invalid credentials'
        };
      }
    } catch (error) {
      console.error('Authentication error:', error);
      return {
        success: false,
        message: 'Authentication failed: ' + error.message
      };
    }
  }

  /**
   * Validate user credentials
   * @param {string} username - Username to validate
   * @param {string} password - Password to validate
   * @returns {boolean} True if credentials are valid
   */
  validateCredentials(username, password) {
    // In a real implementation, this would validate against a backend service
    // For this client-side example, we'll use a simple check
    // Note: This is for demonstration only - real credentials should never be stored client-side
    if (!username || !password) {
      return false;
    }
    
    // In a real application, you would send credentials to a backend for validation
    // This is just a placeholder implementation
    return username.length > 0 && password.length > 0;
  }

  /**
   * Determine user role based on username or other factors
   * @param {string} username - Username to determine role for
   * @returns {string} Role ('user' or 'developer')
   */
  determineRole(username) {
    // In a real implementation, role would be determined by a backend service
    // For now, we'll hardcode some users as developers based on naming convention
    
    // For demo purposes, any username starting with 'dev_' or 'admin_' is considered a developer
    if (username.startsWith('dev_') || username.startsWith('admin_')) {
      return this.roles.DEVELOPER;
    }
    
    return this.roles.USER;
  }

  /**
   * Check if the current user is authenticated
   * @returns {boolean} True if user is authenticated
   */
  isAuthenticated() {
    return !!this.currentUser && this.currentUser.authenticated;
  }

  /**
   * Check if the current user has developer/administrator privileges
   * @returns {boolean} True if user has developer privileges
   */
  isDeveloper() {
    return this.isAuthenticated() && 
           this.currentUser.role === this.roles.DEVELOPER;
  }

  /**
   * Get the current user
   * @returns {Object|null} Current user object or null if not authenticated
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Logout the current user
   * @returns {void}
   */
  logout() {
    this.currentUser = null;
    localStorage.removeItem('currentUser');
  }

  /**
   * Get available roles
   * @returns {Object} Object containing role definitions
   */
  getRoles() {
    return { ...this.roles };
  }
}

// Export a singleton instance
const authService = new AuthService();
export default authService;