/**
 * Fix for custom element duplicate registration errors
 * This prevents the "A custom element with name 'X' has already been defined" error
 */

// Only run in browser environment
if (typeof window !== 'undefined' && window.customElements) {
  // Store original customElements.define method
  const originalDefine = window.customElements.define;

  // Override customElements.define to check for existing definitions
  window.customElements.define = function(name: string, constructor: CustomElementConstructor, options?: ElementDefinitionOptions) {
    // Check if element is already defined
    if (!window.customElements.get(name)) {
      // Only define if not already defined
      try {
        originalDefine.call(this, name, constructor, options);
      } catch (error) {
        // Silently handle the error for known problematic elements
        if (name === 'mce-autosize-textarea' || name.startsWith('mce-')) {
          console.debug(`Skipping redefinition of known problematic element '${name}'`);
        } else {
          console.warn(`Failed to define custom element '${name}':`, error);
        }
      }
    } else {
      // Silently handle known problematic elements
      if (name === 'mce-autosize-textarea' || name.startsWith('mce-')) {
        console.debug(`Custom element '${name}' is already defined, skipping redefinition`);
      } else {
        console.warn(`Custom element '${name}' is already defined, skipping redefinition`);
      }
    }
  };

  // Also handle the specific case where the element might be defined before our override
  // This catches cases where browser extensions or other scripts define elements early
  const checkAndSuppressErrors = () => {
    const originalConsoleError = console.error;
    console.error = function(...args) {
      const message = args[0];
      if (typeof message === 'string' && 
          (message.includes('mce-autosize-textarea') || 
           message.includes('custom element') && message.includes('already been defined'))) {
        // Suppress the error for known problematic elements
        console.debug('Suppressed custom element redefinition error:', message);
        return;
      }
      originalConsoleError.apply(console, args);
    };
  };

  // Apply error suppression immediately
  checkAndSuppressErrors();

  // Also apply on DOM ready in case elements are defined later
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAndSuppressErrors);
  }
}

export {};