import DefaultEdge from './DefaultEdge';

// Export the component
export { DefaultEdge };

// Edge types for React Flow
export const edgeTypes = {
  default: DefaultEdge,
  // Relation edges represent entity relationships
  relation: DefaultEdge, // Uses same component as default for now
};