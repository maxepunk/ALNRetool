// Browser console test script for alignment verification
// Run this in the browser console after loading the graph

console.log('=== Testing Character-Puzzle and Timeline-Element Alignment ===');

// Get all nodes from React Flow
const nodes = window.__REACT_FLOW_INSTANCE__?.getNodes() || [];
const edges = window.__REACT_FLOW_INSTANCE__?.getEdges() || [];

console.log(`Total nodes: ${nodes.length}`);
console.log(`Total edges: ${edges.length}`);

// Find characters and their connected puzzles
const characters = nodes.filter(n => n.data?.metadata?.entityType === 'character');
console.log(`\nFound ${characters.length} character nodes`);

characters.forEach(char => {
  // Find connected puzzles
  const puzzleEdges = edges.filter(e => 
    e.source === char.id && 
    e.data?.relationshipType === 'puzzle'
  );
  
  if (puzzleEdges.length > 0) {
    console.log(`\nCharacter: ${char.data.label} (${char.id})`);
    console.log(`  Position Y: ${char.position.y}`);
    
    puzzleEdges.forEach(edge => {
      const puzzle = nodes.find(n => n.id === edge.target);
      if (puzzle) {
        const yDiff = Math.abs(char.position.y - puzzle.position.y);
        console.log(`  Connected Puzzle: ${puzzle.data.label}`);
        console.log(`    Puzzle Y: ${puzzle.position.y}`);
        console.log(`    Y Difference: ${yDiff.toFixed(2)} ${yDiff < 5 ? '✅ ALIGNED' : '❌ NOT ALIGNED'}`);
      }
    });
  }
});

// Find timeline events and their connected elements
const timelines = nodes.filter(n => n.data?.metadata?.entityType === 'timeline');
console.log(`\nFound ${timelines.length} timeline nodes`);

timelines.forEach(timeline => {
  // Find connected elements (through reward relationships)
  const elementEdges = edges.filter(e => 
    e.source === timeline.id && 
    e.data?.relationshipType === 'reward'
  );
  
  if (elementEdges.length > 0) {
    console.log(`\nTimeline: ${timeline.data.label} (${timeline.id})`);
    console.log(`  Position Y: ${timeline.position.y}`);
    
    elementEdges.forEach(edge => {
      const element = nodes.find(n => n.id === edge.target);
      if (element && element.data?.metadata?.entityType === 'element') {
        const yDiff = Math.abs(timeline.position.y - element.position.y);
        console.log(`  Connected Element: ${element.data.label}`);
        console.log(`    Element Y: ${element.position.y}`);
        console.log(`    Y Difference: ${yDiff.toFixed(2)} ${yDiff < 5 ? '✅ ALIGNED' : '❌ NOT ALIGNED'}`);
      }
    });
  }
});

console.log('\n=== Alignment Test Complete ===');