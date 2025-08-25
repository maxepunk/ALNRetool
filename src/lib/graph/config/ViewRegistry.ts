/**
 * ViewRegistry
 * 
 * Centralized registry for view configurations.
 * Manages registration, validation, and retrieval of view configs.
 */

import { log } from '@/utils/logger';
import type { ViewConfiguration, ViewConfigurationMetadata } from './ViewConfiguration';

export class ViewRegistry {
  private configurations = new Map<string, ViewConfiguration>();
  private metadata = new Map<string, ViewConfigurationMetadata>();

  /**
   * Register a view configuration
   */
  register(config: ViewConfiguration): void {
    if (this.configurations.has(config.id)) {
      log.warn(`ViewRegistry: Overwriting existing configuration ${config.id}`);
    }

    // Validate configuration
    this.validateConfiguration(config);

    // Store configuration
    this.configurations.set(config.id, config);

    // Generate and store metadata
    const metadata = this.generateMetadata(config);
    this.metadata.set(config.id, metadata);

    log.info(`ViewRegistry: Registered configuration ${config.id}`);
  }

  /**
   * Get a view configuration by ID
   */
  get(id: string): ViewConfiguration | undefined {
    return this.configurations.get(id);
  }

  /**
   * Get metadata for a view configuration
   */
  getMetadata(id: string): ViewConfigurationMetadata | undefined {
    return this.metadata.get(id);
  }

  /**
   * Check if a configuration exists
   */
  has(id: string): boolean {
    return this.configurations.has(id);
  }

  /**
   * Get all registered configuration IDs
   */
  getIds(): string[] {
    return Array.from(this.configurations.keys());
  }

  /**
   * Get all configurations
   */
  getAll(): ViewConfiguration[] {
    return Array.from(this.configurations.values());
  }

  /**
   * Remove a configuration
   */
  unregister(id: string): boolean {
    const deleted = this.configurations.delete(id);
    if (deleted) {
      this.metadata.delete(id);
      log.info(`ViewRegistry: Unregistered configuration ${id}`);
    }
    return deleted;
  }

  /**
   * Clear all configurations
   */
  clear(): void {
    this.configurations.clear();
    this.metadata.clear();
    log.info('ViewRegistry: Cleared all configurations');
  }

  /**
   * Validate a configuration
   */
  private validateConfiguration(config: ViewConfiguration): void {
    // Basic validation
    if (!config.id) {
      throw new Error('Configuration must have an id');
    }
    if (!config.name) {
      throw new Error('Configuration must have a name');
    }
    if (!config.nodes?.include || config.nodes.include.length === 0) {
      throw new Error('Configuration must include at least one node selection');
    }
    if (!config.edges || config.edges.length === 0) {
      throw new Error('Configuration must include at least one edge configuration');
    }

    // Validate node selections
    config.nodes.include.forEach((selection, index) => {
      this.validateNodeSelection(selection, `nodes.include[${index}]`);
    });

    if (config.nodes.exclude) {
      config.nodes.exclude.forEach((selection, index) => {
        this.validateNodeSelection(selection, `nodes.exclude[${index}]`);
      });
    }

    // Validate edge configurations
    config.edges.forEach((edge, index) => {
      if (!edge.entityType) {
        throw new Error(`edges[${index}] must have an entityType`);
      }
    });
  }

  /**
   * Validate a node selection
   */
  private validateNodeSelection(selection: any, path: string): void {
    if (!selection.type) {
      throw new Error(`${path} must have a type`);
    }

    switch (selection.type) {
      case 'basic':
        if (!selection.ids || selection.ids.length === 0) {
          throw new Error(`${path} of type 'basic' must have ids`);
        }
        break;

      case 'related':
        if (!selection.from) {
          throw new Error(`${path} of type 'related' must have 'from'`);
        }
        if (!selection.relation) {
          throw new Error(`${path} of type 'related' must have 'relation'`);
        }
        break;

      case 'filtered':
        if (!selection.entityType) {
          throw new Error(`${path} of type 'filtered' must have 'entityType'`);
        }
        if (!selection.where) {
          throw new Error(`${path} of type 'filtered' must have 'where' function`);
        }
        break;

      case 'traversed':
        if (!selection.from) {
          throw new Error(`${path} of type 'traversed' must have 'from'`);
        }
        if (!selection.entityType) {
          throw new Error(`${path} of type 'traversed' must have 'entityType'`);
        }
        break;

      default:
        throw new Error(`${path} has invalid type: ${selection.type}`);
    }
  }

  /**
   * Generate metadata for a configuration
   */
  private generateMetadata(config: ViewConfiguration): ViewConfigurationMetadata {
    // Extract required variables from template strings
    const configStr = JSON.stringify(config);
    const variableMatches = configStr.match(/\{\{(\w+)\}\}/g) || [];
    const requiredVariables = [...new Set(
      variableMatches.map(match => match.slice(2, -2))
    )];

    // Collect supported entity types
    const supportedEntityTypes = new Set<string>();
    config.nodes.include.forEach(selection => {
      if (selection.entityType) {
        supportedEntityTypes.add(selection.entityType);
      }
    });
    config.edges.forEach(edge => {
      supportedEntityTypes.add(edge.entityType);
    });

    // Estimate complexity
    let complexity: 'low' | 'medium' | 'high' = 'low';
    const nodeSelections = config.nodes.include.length + (config.nodes.exclude?.length || 0);
    const hasTraversal = config.nodes.include.some(s => s.type === 'traversed');
    const hasCustomHooks = !!config.hooks && Object.keys(config.hooks).length > 0;

    if (nodeSelections > 5 || hasTraversal || hasCustomHooks) {
      complexity = 'high';
    } else if (nodeSelections > 2) {
      complexity = 'medium';
    }

    return {
      id: config.id,
      name: config.name,
      description: config.description,
      requiredVariables,
      supportedEntityTypes,
      estimatedComplexity: complexity
    };
  }

  /**
   * Load configurations from an array
   */
  loadConfigurations(configs: ViewConfiguration[]): void {
    configs.forEach(config => this.register(config));
  }

  /**
   * Export all configurations
   */
  exportConfigurations(): ViewConfiguration[] {
    return this.getAll();
  }
}