import type { ActivityDiagramModel } from './activityTypes';

export const defaultActivityDiagramModel: ActivityDiagramModel = {
  swimlanes: [
    { id: 'lane-customer', name: 'Customer' },
    { id: 'lane-system', name: 'System' },
    { id: 'lane-payment', name: 'Payment Service' },
  ],
  nodes: [
    { id: 'start', kind: 'start', label: 'Start', laneId: 'lane-customer' },
    { id: 'browse', kind: 'action', label: 'Browse catalog', laneId: 'lane-customer' },
    { id: 'checkout', kind: 'action', label: 'Submit checkout', laneId: 'lane-customer' },
    { id: 'validate', kind: 'decision', label: 'Cart valid?', laneId: 'lane-system' },
    { id: 'fix_cart', kind: 'action', label: 'Fix cart details', laneId: 'lane-customer' },
    { id: 'fork_payment', kind: 'fork', label: 'Fork', laneId: 'lane-system' },
    { id: 'reserve', kind: 'action', label: 'Reserve inventory', laneId: 'lane-system' },
    { id: 'authorize', kind: 'action', label: 'Authorize payment', laneId: 'lane-payment' },
    { id: 'join_payment', kind: 'join', label: 'Join', laneId: 'lane-system' },
    { id: 'loop_confirm', kind: 'loop', label: 'Retry confirmation?', laneId: 'lane-system' },
    { id: 'send_confirmation', kind: 'action', label: 'Send confirmation', laneId: 'lane-system' },
    { id: 'stop', kind: 'end', label: 'End', laneId: 'lane-customer' },
  ],
  transitions: [
    { id: 't1', from: 'start', to: 'browse', label: '' },
    { id: 't2', from: 'browse', to: 'checkout', label: '' },
    { id: 't3', from: 'checkout', to: 'validate', label: '' },
    { id: 't4', from: 'validate', to: 'fix_cart', label: 'no' },
    { id: 't5', from: 'fix_cart', to: 'checkout', label: 'retry' },
    { id: 't6', from: 'validate', to: 'fork_payment', label: 'yes' },
    { id: 't7', from: 'fork_payment', to: 'reserve', label: '' },
    { id: 't8', from: 'fork_payment', to: 'authorize', label: '' },
    { id: 't9', from: 'reserve', to: 'join_payment', label: '' },
    { id: 't10', from: 'authorize', to: 'join_payment', label: '' },
    { id: 't11', from: 'join_payment', to: 'loop_confirm', label: '' },
    { id: 't12', from: 'loop_confirm', to: 'send_confirmation', label: 'confirmed' },
    { id: 't13', from: 'loop_confirm', to: 'authorize', label: 'retry payment' },
    { id: 't14', from: 'send_confirmation', to: 'stop', label: '' },
  ],
};
