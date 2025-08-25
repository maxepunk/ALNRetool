/**
 * Graph Configuration Module
 * 
 * Exports for the declarative configuration system.
 */

export { ViewBuilder } from './ViewBuilder';
export { ViewRegistry } from './ViewRegistry';
export { ViewCache } from './ViewCache';

export type {
  ViewConfiguration,
  ViewConfigurationMetadata,
  NodeSelection,
  NodeSelectionType,
  EdgeConfiguration,
  LayoutConfiguration,
  TemplateVariables,
  ViewHooks
} from './ViewConfiguration';

// Export view configurations
export { TimelineConfig } from './views/TimelineConfig';
export { NodeConnectionsConfig } from './views/NodeConnectionsConfig';
export { CharacterJourneyConfig } from './views/CharacterJourneyConfig';
export { PuzzleFocusConfig } from './views/PuzzleFocusConfig';