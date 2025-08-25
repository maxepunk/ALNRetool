/**
 * Barnes-Hut Quadtree implementation for efficient force calculations
 * Reduces complexity from O(n²) to O(n log n) for large graphs
 */

export interface QuadTreeNode {
  x: number;
  y: number;
  id?: string;
  mass?: number;
}

export interface QuadTreeBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface QuadTreeRegion {
  centerOfMass: { x: number; y: number };
  totalMass: number;
  bounds: QuadTreeBounds;
  nodes: QuadTreeNode[];
  children?: QuadTreeRegion[];
}

/**
 * Barnes-Hut Quadtree for spatial indexing and force approximation
 */
export class QuadTree {
  private root: QuadTreeRegion;
  private theta: number; // Barnes-Hut approximation parameter (typically 0.5-1.2)
  private maxDepth: number;

  constructor(bounds: QuadTreeBounds, theta = 0.8, maxDepth = 20) {
    this.root = this.createRegion(bounds);
    this.theta = theta;
    this.maxDepth = maxDepth;
  }

  /**
   * Create a new region
   */
  private createRegion(bounds: QuadTreeBounds): QuadTreeRegion {
    return {
      centerOfMass: { x: 0, y: 0 },
      totalMass: 0,
      bounds,
      nodes: [],
    };
  }

  /**
   * Insert a node into the quadtree
   */
  insert(node: QuadTreeNode): void {
    this.insertIntoRegion(node, this.root, 0);
    this.updateCenterOfMass(this.root);
  }

  /**
   * Insert node into a specific region
   */
  private insertIntoRegion(node: QuadTreeNode, region: QuadTreeRegion, depth: number): void {
    // Check if node is within bounds
    if (!this.isInBounds(node, region.bounds)) {
      return;
    }

    const mass = node.mass || 1;

    // If region has no nodes, just add this one
    if (region.nodes.length === 0 && !region.children) {
      region.nodes.push(node);
      region.totalMass = mass;
      region.centerOfMass = { x: node.x, y: node.y };
      return;
    }

    // If we're at max depth, just add to this region
    if (depth >= this.maxDepth) {
      region.nodes.push(node);
      return;
    }

    // If region has one node and no children, subdivide
    if (region.nodes.length === 1 && !region.children) {
      this.subdivide(region);
      
      // Move existing node to appropriate child
      const existingNode = region.nodes[0];
      if (existingNode) {
        region.nodes = [];
        this.insertIntoRegion(existingNode, region, depth);
      }
    }

    // If subdivided, insert into appropriate child
    if (region.children) {
      const quadrant = this.getQuadrant(node, region.bounds);
      const childRegion = region.children[quadrant];
      if (childRegion) {
        this.insertIntoRegion(node, childRegion, depth + 1);
      }
    } else {
      region.nodes.push(node);
    }
  }

  /**
   * Subdivide a region into 4 quadrants
   */
  private subdivide(region: QuadTreeRegion): void {
    const { x, y, width, height } = region.bounds;
    const hw = width / 2;
    const hh = height / 2;

    region.children = [
      this.createRegion({ x, y, width: hw, height: hh }), // NW
      this.createRegion({ x: x + hw, y, width: hw, height: hh }), // NE
      this.createRegion({ x, y: y + hh, width: hw, height: hh }), // SW
      this.createRegion({ x: x + hw, y: y + hh, width: hw, height: hh }), // SE
    ];
  }

  /**
   * Get quadrant index for a node in bounds
   */
  private getQuadrant(node: QuadTreeNode, bounds: QuadTreeBounds): number {
    const midX = bounds.x + bounds.width / 2;
    const midY = bounds.y + bounds.height / 2;
    
    if (node.x < midX) {
      return node.y < midY ? 0 : 2; // NW : SW
    } else {
      return node.y < midY ? 1 : 3; // NE : SE
    }
  }

  /**
   * Check if node is within bounds
   */
  private isInBounds(node: QuadTreeNode, bounds: QuadTreeBounds): boolean {
    return node.x >= bounds.x &&
           node.x < bounds.x + bounds.width &&
           node.y >= bounds.y &&
           node.y < bounds.y + bounds.height;
  }

  /**
   * Update center of mass for a region and its children
   */
  private updateCenterOfMass(region: QuadTreeRegion): void {
    if (region.nodes.length > 0 && !region.children) {
      // Leaf node: calculate from actual nodes
      let totalX = 0;
      let totalY = 0;
      let totalMass = 0;

      for (const node of region.nodes) {
        const mass = node.mass || 1;
        totalX += node.x * mass;
        totalY += node.y * mass;
        totalMass += mass;
      }

      if (totalMass > 0) {
        region.centerOfMass = {
          x: totalX / totalMass,
          y: totalY / totalMass,
        };
        region.totalMass = totalMass;
      }
    } else if (region.children) {
      // Internal node: calculate from children
      let totalX = 0;
      let totalY = 0;
      let totalMass = 0;

      for (const child of region.children) {
        this.updateCenterOfMass(child);
        if (child.totalMass > 0) {
          totalX += child.centerOfMass.x * child.totalMass;
          totalY += child.centerOfMass.y * child.totalMass;
          totalMass += child.totalMass;
        }
      }

      if (totalMass > 0) {
        region.centerOfMass = {
          x: totalX / totalMass,
          y: totalY / totalMass,
        };
        region.totalMass = totalMass;
      }
    }
  }

  /**
   * Calculate force on a node using Barnes-Hut approximation
   */
  calculateForce(
    node: QuadTreeNode,
    options: {
      gravity?: number;
      repulsion?: number;
      minDistance?: number;
    } = {}
  ): { fx: number; fy: number } {
    const { gravity = 1, repulsion = 100, minDistance = 1 } = options;
    const force = { fx: 0, fy: 0 };

    this.calculateForceFromRegion(node, this.root, force, {
      gravity,
      repulsion,
      minDistance,
    });

    return force;
  }

  /**
   * Recursively calculate force from a region
   */
  private calculateForceFromRegion(
    node: QuadTreeNode,
    region: QuadTreeRegion,
    force: { fx: number; fy: number },
    options: {
      gravity: number;
      repulsion: number;
      minDistance: number;
    }
  ): void {
    if (region.totalMass === 0) {
      return;
    }

    // Calculate distance to center of mass
    const dx = region.centerOfMass.x - node.x;
    const dy = region.centerOfMass.y - node.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Skip if this is the node itself
    if (distance < options.minDistance) {
      return;
    }

    // Calculate region size
    const regionSize = Math.max(region.bounds.width, region.bounds.height);

    // Barnes-Hut criterion: if region is far enough, treat as single mass
    if (regionSize / distance < this.theta || !region.children) {
      // Treat region as single mass point
      const forceMagnitude = (options.repulsion * region.totalMass) / (distance * distance);
      force.fx -= (forceMagnitude * dx) / distance;
      force.fy -= (forceMagnitude * dy) / distance;
    } else if (region.children) {
      // Region is too close, recurse into children
      for (const child of region.children) {
        this.calculateForceFromRegion(node, child, force, options);
      }
    }
  }

  /**
   * Get all nodes within a radius of a point
   */
  getNodesInRadius(x: number, y: number, radius: number): QuadTreeNode[] {
    const nodes: QuadTreeNode[] = [];
    this.getNodesInRadiusFromRegion(x, y, radius, this.root, nodes);
    return nodes;
  }

  /**
   * Recursively find nodes within radius
   */
  private getNodesInRadiusFromRegion(
    x: number,
    y: number,
    radius: number,
    region: QuadTreeRegion,
    nodes: QuadTreeNode[]
  ): void {
    // Check if region intersects with search circle
    if (!this.regionIntersectsCircle(region.bounds, x, y, radius)) {
      return;
    }

    // Check nodes in this region
    for (const node of region.nodes) {
      const dx = node.x - x;
      const dy = node.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance <= radius) {
        nodes.push(node);
      }
    }

    // Recurse into children
    if (region.children) {
      for (const child of region.children) {
        this.getNodesInRadiusFromRegion(x, y, radius, child, nodes);
      }
    }
  }

  /**
   * Check if region intersects with a circle
   */
  private regionIntersectsCircle(
    bounds: QuadTreeBounds,
    cx: number,
    cy: number,
    radius: number
  ): boolean {
    // Find closest point on rectangle to circle center
    const closestX = Math.max(bounds.x, Math.min(cx, bounds.x + bounds.width));
    const closestY = Math.max(bounds.y, Math.min(cy, bounds.y + bounds.height));

    // Check if closest point is within radius
    const dx = closestX - cx;
    const dy = closestY - cy;
    return dx * dx + dy * dy <= radius * radius;
  }

  /**
   * Get tree statistics for debugging
   */
  getStats(): {
    totalNodes: number;
    totalRegions: number;
    maxDepth: number;
    averageNodesPerLeaf: number;
  } {
    const stats = {
      totalNodes: 0,
      totalRegions: 0,
      maxDepth: 0,
      leafRegions: 0,
      leafNodes: 0,
    };

    this.gatherStats(this.root, 0, stats);

    return {
      totalNodes: stats.totalNodes,
      totalRegions: stats.totalRegions,
      maxDepth: stats.maxDepth,
      averageNodesPerLeaf: stats.leafRegions > 0 ? stats.leafNodes / stats.leafRegions : 0,
    };
  }

  /**
   * Recursively gather statistics
   */
  private gatherStats(
    region: QuadTreeRegion,
    depth: number,
    stats: any
  ): void {
    stats.totalRegions++;
    stats.maxDepth = Math.max(stats.maxDepth, depth);
    stats.totalNodes += region.nodes.length;

    if (!region.children) {
      stats.leafRegions++;
      stats.leafNodes += region.nodes.length;
    } else {
      for (const child of region.children) {
        this.gatherStats(child, depth + 1, stats);
      }
    }
  }

  /**
   * Clear the quadtree
   */
  clear(): void {
    this.root = this.createRegion(this.root.bounds);
  }

  /**
   * Build quadtree from array of nodes
   */
  static fromNodes(
    nodes: QuadTreeNode[],
    theta = 0.8,
    padding = 100
  ): QuadTree {
    if (nodes.length === 0) {
      return new QuadTree({ x: 0, y: 0, width: 1000, height: 1000 }, theta);
    }

    // Calculate bounds
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const node of nodes) {
      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);
      maxX = Math.max(maxX, node.x);
      maxY = Math.max(maxY, node.y);
    }

    // Add padding
    const bounds: QuadTreeBounds = {
      x: minX - padding,
      y: minY - padding,
      width: maxX - minX + 2 * padding,
      height: maxY - minY + 2 * padding,
    };

    // Create tree and insert all nodes
    const tree = new QuadTree(bounds, theta);
    for (const node of nodes) {
      tree.insert(node);
    }

    return tree;
  }
}