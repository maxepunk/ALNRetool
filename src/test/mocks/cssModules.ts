/**
 * CSS Module mock for testing
 * Returns the class name as-is for easier testing
 */

const cssModule = new Proxy(
  {},
  {
    get: (_target, prop: string) => prop,
  }
)

// Export both default and named exports for compatibility
export default cssModule
export const styles = cssModule