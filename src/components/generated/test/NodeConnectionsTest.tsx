/**
 * NodeConnectionsTest
 * 
 * Test component to validate ViewComponentFactory works with NodeConnectionsConfig
 * This serves as a proof-of-concept for the component generation system.
 */

import ViewComponentFactory from '../ViewComponentFactory';
import { NodeConnectionsConfig } from '@/lib/graph/config/views/NodeConnectionsConfig';

/**
 * Test component using NodeConnectionsConfig with ViewComponentFactory
 */
export default function NodeConnectionsTest() {
  return (
    <div className="h-screen">
      <ViewComponentFactory 
        config={NodeConnectionsConfig}
        className="test-node-connections"
      />
    </div>
  );
}

/**
 * Test function to validate configuration structure
 */
export function validateNodeConnectionsConfig() {
  const config = NodeConnectionsConfig;
  
  console.group('NodeConnections Config Validation');
  
  // Check basic structure
  console.log('✓ Config ID:', config.id);
  console.log('✓ Config Name:', config.name);
  console.log('✓ UI Configuration:', !!config.ui);
  
  // Check controls
  if (config.ui?.controls) {
    console.log('✓ Controls Count:', config.ui.controls.length);
    config.ui.controls.forEach((control, index) => {
      console.log(`  Control ${index + 1}:`, {
        id: control.id,
        type: control.type,
        label: control.label,
        statePath: control.statePath
      });
    });
  }
  
  // Check routing
  if (config.ui?.routing) {
    console.log('✓ Routing Configuration:', {
      basePath: config.ui.routing.basePath,
      syncToURL: config.ui.routing.syncToURL,
      parameters: Object.keys(config.ui.routing.parameters || {})
    });
  }
  
  console.groupEnd();
  
  return true;
}