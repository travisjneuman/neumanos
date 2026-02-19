/**
 * Extended Shape Library (P2)
 * Additional shape categories: Cloud Computing, People, Network, Data Flow, Charts
 */

import type { ShapeDefinition } from '../../types/shapes';

// ============================================================================
// CLOUD COMPUTING SHAPES
// ============================================================================

export const cloudComputingShapes: ShapeDefinition[] = [
  // Cloud
  {
    id: 'cloud-computing-cloud',
    name: 'Cloud',
    category: 'cloud-computing',
    keywords: ['cloud', 'aws', 'azure', 'gcp', 'infrastructure', 'hosting'],
    thumbnail: 'cloud',
    pathData: 'M 20 30 Q 20 15 35 15 Q 40 5 55 5 Q 70 5 75 15 Q 90 15 90 30 Q 90 45 75 45 L 35 45 Q 20 45 20 30 Z',
    defaultProps: {
      type: 'shape',
      width: 100,
      height: 50,
      fill: 'var(--accent-cyan)',
      stroke: 'var(--accent-cyan)',
      strokeWidth: 2,
      zIndex: 1,
    },
  },

  // Server
  {
    id: 'cloud-computing-server',
    name: 'Server',
    category: 'cloud-computing',
    keywords: ['server', 'rack', 'compute', 'vm', 'instance'],
    thumbnail: 'rectangle',
    pathData: 'M 0 0 L 80 0 L 80 60 L 0 60 Z M 0 20 L 80 20 M 0 40 L 80 40 M 10 10 L 20 10 M 10 30 L 20 30 M 10 50 L 20 50',
    defaultProps: {
      type: 'shape',
      width: 80,
      height: 60,
      fill: 'transparent',
      stroke: 'var(--accent-blue)',
      strokeWidth: 2,
      zIndex: 1,
    },
  },

  // Database
  {
    id: 'cloud-computing-database',
    name: 'Database',
    category: 'cloud-computing',
    keywords: ['database', 'db', 'sql', 'nosql', 'storage', 'data'],
    thumbnail: 'cylinder',
    pathData: 'M 0 10 Q 0 0 40 0 Q 80 0 80 10 L 80 50 Q 80 60 40 60 Q 0 60 0 50 Z M 0 10 Q 0 20 40 20 Q 80 20 80 10',
    defaultProps: {
      type: 'shape',
      width: 80,
      height: 60,
      fill: 'var(--accent-green)',
      stroke: 'var(--accent-green)',
      strokeWidth: 2,
      zIndex: 1,
    },
  },

  // Load Balancer
  {
    id: 'cloud-computing-load-balancer',
    name: 'Load Balancer',
    category: 'cloud-computing',
    keywords: ['load balancer', 'lb', 'elb', 'alb', 'traffic', 'distribution'],
    thumbnail: 'hexagon',
    pathData: 'M 30 0 L 70 0 L 100 40 L 70 80 L 30 80 L 0 40 Z M 30 30 L 70 30 M 30 50 L 70 50',
    defaultProps: {
      type: 'shape',
      width: 100,
      height: 80,
      fill: 'transparent',
      stroke: 'var(--accent-purple)',
      strokeWidth: 2,
      zIndex: 1,
    },
  },

  // Storage Bucket
  {
    id: 'cloud-computing-storage',
    name: 'Storage',
    category: 'cloud-computing',
    keywords: ['storage', 'bucket', 's3', 'blob', 'object', 'file'],
    thumbnail: 'bucket',
    pathData: 'M 20 10 L 80 10 L 90 60 L 10 60 Z M 20 10 L 10 60',
    defaultProps: {
      type: 'shape',
      width: 100,
      height: 70,
      fill: 'var(--accent-yellow)',
      stroke: 'var(--accent-yellow)',
      strokeWidth: 2,
      zIndex: 1,
    },
  },

  // API Gateway
  {
    id: 'cloud-computing-api-gateway',
    name: 'API Gateway',
    category: 'cloud-computing',
    keywords: ['api', 'gateway', 'rest', 'graphql', 'endpoint', 'service'],
    thumbnail: 'rounded-rectangle',
    primitiveType: 'rectangle',
    defaultProps: {
      type: 'shape',
      width: 120,
      height: 60,
      fill: 'transparent',
      stroke: 'var(--accent-magenta)',
      strokeWidth: 2,
      cornerRadius: 10,
      zIndex: 1,
    },
  },
];

// ============================================================================
// PEOPLE & USER SHAPES
// ============================================================================

export const peopleShapes: ShapeDefinition[] = [
  // Person
  {
    id: 'people-person',
    name: 'Person',
    category: 'people',
    keywords: ['person', 'user', 'human', 'individual', 'avatar'],
    thumbnail: 'person',
    pathData: 'M 40 20 A 10 10 0 1 1 60 20 A 10 10 0 1 1 40 20 M 50 30 L 50 60 M 30 45 L 70 45 M 50 60 L 35 85 M 50 60 L 65 85',
    defaultProps: {
      type: 'shape',
      width: 100,
      height: 90,
      fill: 'transparent',
      stroke: 'var(--accent-blue)',
      strokeWidth: 2,
      zIndex: 1,
    },
  },

  // Group
  {
    id: 'people-group',
    name: 'Group',
    category: 'people',
    keywords: ['group', 'team', 'users', 'people', 'organization'],
    thumbnail: 'people-group',
    pathData: 'M 25 15 A 8 8 0 1 1 40 15 A 8 8 0 1 1 25 15 M 60 15 A 8 8 0 1 1 75 15 A 8 8 0 1 1 60 15 M 32.5 23 L 32.5 45 M 20 35 L 45 35 M 67.5 23 L 67.5 45 M 55 35 L 80 35',
    defaultProps: {
      type: 'shape',
      width: 100,
      height: 50,
      fill: 'transparent',
      stroke: 'var(--accent-purple)',
      strokeWidth: 2,
      zIndex: 1,
    },
  },

  // Profile Card
  {
    id: 'people-profile-card',
    name: 'Profile Card',
    category: 'people',
    keywords: ['profile', 'card', 'user card', 'identity', 'badge'],
    thumbnail: 'rounded-rectangle',
    primitiveType: 'rectangle',
    defaultProps: {
      type: 'shape',
      width: 120,
      height: 80,
      fill: 'var(--accent-cyan)',
      stroke: 'var(--accent-cyan)',
      strokeWidth: 2,
      cornerRadius: 8,
      zIndex: 1,
    },
  },

  // Avatar
  {
    id: 'people-avatar',
    name: 'Avatar',
    category: 'people',
    keywords: ['avatar', 'profile picture', 'photo', 'icon'],
    thumbnail: 'circle',
    primitiveType: 'circle',
    defaultProps: {
      type: 'shape',
      width: 60,
      height: 60,
      fill: 'var(--accent-green)',
      stroke: 'var(--accent-green)',
      strokeWidth: 2,
      zIndex: 1,
    },
  },
];

// ============================================================================
// NETWORK SHAPES (P2 - Populated)
// ============================================================================

export const networkShapesExtended: ShapeDefinition[] = [
  // Router
  {
    id: 'network-router',
    name: 'Router',
    category: 'network',
    keywords: ['router', 'gateway', 'network', 'routing'],
    thumbnail: 'rectangle',
    pathData: 'M 10 20 L 90 20 L 90 60 L 10 60 Z M 10 40 L 90 40 M 30 10 L 30 20 M 50 10 L 50 20 M 70 10 L 70 20',
    defaultProps: {
      type: 'shape',
      width: 100,
      height: 70,
      fill: 'transparent',
      stroke: 'var(--accent-blue)',
      strokeWidth: 2,
      zIndex: 1,
    },
  },

  // Switch
  {
    id: 'network-switch',
    name: 'Switch',
    category: 'network',
    keywords: ['switch', 'hub', 'ethernet', 'network'],
    thumbnail: 'rectangle',
    pathData: 'M 0 20 L 100 20 L 100 50 L 0 50 Z M 10 10 L 10 20 M 25 10 L 25 20 M 40 10 L 40 20 M 55 10 L 55 20 M 70 10 L 70 20 M 85 10 L 85 20',
    defaultProps: {
      type: 'shape',
      width: 100,
      height: 60,
      fill: 'transparent',
      stroke: 'var(--accent-green)',
      strokeWidth: 2,
      zIndex: 1,
    },
  },

  // Firewall
  {
    id: 'network-firewall',
    name: 'Firewall',
    category: 'network',
    keywords: ['firewall', 'security', 'protection', 'network security'],
    thumbnail: 'shield',
    pathData: 'M 50 10 L 20 25 L 20 50 Q 20 70 50 80 Q 80 70 80 50 L 80 25 Z M 35 40 L 45 50 L 65 30',
    defaultProps: {
      type: 'shape',
      width: 100,
      height: 90,
      fill: 'var(--accent-red)',
      stroke: 'var(--accent-red)',
      strokeWidth: 2,
      zIndex: 1,
    },
  },

  // Modem
  {
    id: 'network-modem',
    name: 'Modem',
    category: 'network',
    keywords: ['modem', 'internet', 'connection', 'isp'],
    thumbnail: 'rectangle',
    pathData: 'M 10 20 L 90 20 L 90 50 L 10 50 Z M 30 30 L 30 40 M 50 30 L 50 40 M 70 30 L 70 40',
    defaultProps: {
      type: 'shape',
      width: 100,
      height: 60,
      fill: 'transparent',
      stroke: 'var(--accent-purple)',
      strokeWidth: 2,
      zIndex: 1,
    },
  },

  // Network Node
  {
    id: 'network-node',
    name: 'Network Node',
    category: 'network',
    keywords: ['node', 'endpoint', 'device', 'network device'],
    thumbnail: 'circle',
    primitiveType: 'circle',
    defaultProps: {
      type: 'shape',
      width: 50,
      height: 50,
      fill: 'var(--accent-cyan)',
      stroke: 'var(--accent-cyan)',
      strokeWidth: 2,
      zIndex: 1,
    },
  },

  // Wi-Fi
  {
    id: 'network-wifi',
    name: 'Wi-Fi',
    category: 'network',
    keywords: ['wifi', 'wireless', 'signal', 'network'],
    thumbnail: 'wifi',
    pathData: 'M 50 60 A 5 5 0 1 1 50 60 M 35 45 Q 50 35 65 45 M 25 35 Q 50 20 75 35 M 15 25 Q 50 5 85 25',
    defaultProps: {
      type: 'shape',
      width: 100,
      height: 70,
      fill: 'transparent',
      stroke: 'var(--accent-magenta)',
      strokeWidth: 2,
      zIndex: 1,
    },
  },
];

// ============================================================================
// DATA FLOW SHAPES
// ============================================================================

export const dataFlowShapes: ShapeDefinition[] = [
  // Document
  {
    id: 'dataflow-document',
    name: 'Document',
    category: 'data-flow',
    keywords: ['document', 'file', 'data', 'record'],
    thumbnail: 'document',
    pathData: 'M 10 0 L 70 0 L 90 20 L 90 80 L 10 80 Z M 70 0 L 70 20 L 90 20',
    defaultProps: {
      type: 'shape',
      width: 100,
      height: 80,
      fill: 'var(--accent-cyan)',
      stroke: 'var(--accent-cyan)',
      strokeWidth: 2,
      zIndex: 1,
    },
  },

  // File
  {
    id: 'dataflow-file',
    name: 'File',
    category: 'data-flow',
    keywords: ['file', 'data file', 'attachment'],
    thumbnail: 'file',
    pathData: 'M 20 0 L 60 0 L 80 20 L 80 100 L 20 100 Z M 60 0 L 60 20 L 80 20',
    defaultProps: {
      type: 'shape',
      width: 100,
      height: 100,
      fill: 'transparent',
      stroke: 'var(--accent-blue)',
      strokeWidth: 2,
      zIndex: 1,
    },
  },

  // Queue
  {
    id: 'dataflow-queue',
    name: 'Queue',
    category: 'data-flow',
    keywords: ['queue', 'buffer', 'message queue', 'fifo'],
    thumbnail: 'rectangle',
    pathData: 'M 0 10 L 100 10 L 100 50 L 0 50 Z M 20 10 L 20 50 M 40 10 L 40 50 M 60 10 L 60 50 M 80 10 L 80 50',
    defaultProps: {
      type: 'shape',
      width: 100,
      height: 60,
      fill: 'transparent',
      stroke: 'var(--accent-yellow)',
      strokeWidth: 2,
      zIndex: 1,
    },
  },

  // Stream
  {
    id: 'dataflow-stream',
    name: 'Stream',
    category: 'data-flow',
    keywords: ['stream', 'data stream', 'flow', 'pipe'],
    thumbnail: 'wave',
    pathData: 'M 0 30 Q 15 10 30 30 Q 45 50 60 30 Q 75 10 90 30 Q 105 50 120 30',
    defaultProps: {
      type: 'shape',
      width: 120,
      height: 60,
      fill: 'transparent',
      stroke: 'var(--accent-purple)',
      strokeWidth: 2,
      zIndex: 1,
    },
  },

  // Cache
  {
    id: 'dataflow-cache',
    name: 'Cache',
    category: 'data-flow',
    keywords: ['cache', 'memory', 'temporary storage', 'redis'],
    thumbnail: 'hexagon',
    pathData: 'M 30 0 L 90 0 L 120 40 L 90 80 L 30 80 L 0 40 Z',
    defaultProps: {
      type: 'shape',
      width: 120,
      height: 80,
      fill: 'var(--accent-red)',
      stroke: 'var(--accent-red)',
      strokeWidth: 2,
      zIndex: 1,
    },
  },

  // Message
  {
    id: 'dataflow-message',
    name: 'Message',
    category: 'data-flow',
    keywords: ['message', 'event', 'notification', 'email'],
    thumbnail: 'envelope',
    pathData: 'M 0 20 L 0 70 L 100 70 L 100 20 Z M 0 20 L 50 50 L 100 20',
    defaultProps: {
      type: 'shape',
      width: 100,
      height: 70,
      fill: 'transparent',
      stroke: 'var(--accent-green)',
      strokeWidth: 2,
      zIndex: 1,
    },
  },
];

// ============================================================================
// CHART ELEMENT SHAPES
// ============================================================================

export const chartShapes: ShapeDefinition[] = [
  // Bar Chart
  {
    id: 'chart-bar',
    name: 'Bar Chart',
    category: 'charts',
    keywords: ['bar', 'chart', 'graph', 'analytics', 'data visualization'],
    thumbnail: 'bar-chart',
    pathData: 'M 0 80 L 0 0 M 0 80 L 100 80 M 10 80 L 10 50 L 20 50 L 20 80 M 30 80 L 30 30 L 40 30 L 40 80 M 50 80 L 50 60 L 60 60 L 60 80 M 70 80 L 70 20 L 80 20 L 80 80',
    defaultProps: {
      type: 'shape',
      width: 100,
      height: 80,
      fill: 'transparent',
      stroke: 'var(--accent-blue)',
      strokeWidth: 2,
      zIndex: 1,
    },
  },

  // Line Chart
  {
    id: 'chart-line',
    name: 'Line Chart',
    category: 'charts',
    keywords: ['line', 'chart', 'graph', 'trend', 'analytics'],
    thumbnail: 'line-chart',
    pathData: 'M 0 80 L 0 0 M 0 80 L 100 80 M 10 60 L 30 40 L 50 55 L 70 25 L 90 35',
    defaultProps: {
      type: 'shape',
      width: 100,
      height: 80,
      fill: 'transparent',
      stroke: 'var(--accent-green)',
      strokeWidth: 2,
      zIndex: 1,
    },
  },

  // Pie Chart
  {
    id: 'chart-pie',
    name: 'Pie Chart',
    category: 'charts',
    keywords: ['pie', 'chart', 'donut', 'circle', 'distribution'],
    thumbnail: 'pie-chart',
    pathData: 'M 50 50 L 50 10 A 40 40 0 0 1 78.28 71.72 Z M 50 50 L 78.28 71.72 A 40 40 0 0 1 21.72 71.72 Z M 50 50 L 21.72 71.72 A 40 40 0 0 1 50 10 Z',
    defaultProps: {
      type: 'shape',
      width: 100,
      height: 100,
      fill: 'transparent',
      stroke: 'var(--accent-purple)',
      strokeWidth: 2,
      zIndex: 1,
    },
  },

  // Gauge/Meter
  {
    id: 'chart-gauge',
    name: 'Gauge',
    category: 'charts',
    keywords: ['gauge', 'meter', 'speedometer', 'kpi', 'metric'],
    thumbnail: 'gauge',
    pathData: 'M 10 70 A 40 40 0 1 1 90 70 M 50 70 L 70 35',
    defaultProps: {
      type: 'shape',
      width: 100,
      height: 80,
      fill: 'transparent',
      stroke: 'var(--accent-cyan)',
      strokeWidth: 2,
      zIndex: 1,
    },
  },

  // Timeline Marker
  {
    id: 'chart-timeline',
    name: 'Timeline',
    category: 'charts',
    keywords: ['timeline', 'gantt', 'schedule', 'milestone', 'roadmap'],
    thumbnail: 'timeline',
    pathData: 'M 0 40 L 120 40 M 20 20 L 20 60 M 60 20 L 60 60 M 100 20 L 100 60',
    defaultProps: {
      type: 'shape',
      width: 120,
      height: 80,
      fill: 'transparent',
      stroke: 'var(--accent-magenta)',
      strokeWidth: 2,
      zIndex: 1,
    },
  },
];
