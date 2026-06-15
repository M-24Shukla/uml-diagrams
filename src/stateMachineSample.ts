import type { StateMachineModel } from './stateMachineTypes';

export const defaultStateMachineModel: StateMachineModel = {
  states: [
    { id: 'start', name: 'Start', kind: 'start', parentId: '' },
    { id: 'idle', name: 'Idle', kind: 'state', parentId: '' },
    { id: 'processing', name: 'Processing order', kind: 'state', parentId: '' },
    { id: 'payment_choice', name: 'Payment valid?', kind: 'choice', parentId: '' },
    { id: 'retrying', name: 'Retrying payment', kind: 'state', parentId: '' },
    { id: 'fulfilled', name: 'Fulfilled', kind: 'state', parentId: '' },
    { id: 'failed', name: 'Failed', kind: 'state', parentId: '' },
    { id: 'end', name: 'End', kind: 'end', parentId: '' },
  ],
  transitions: [
    { id: 't1', from: 'start', to: 'idle', label: '' },
    { id: 't2', from: 'idle', to: 'processing', label: 'checkout submitted' },
    { id: 't3', from: 'processing', to: 'payment_choice', label: 'authorize payment' },
    { id: 't4', from: 'payment_choice', to: 'fulfilled', label: 'approved' },
    { id: 't5', from: 'payment_choice', to: 'retrying', label: 'retryable failure' },
    { id: 't6', from: 'retrying', to: 'processing', label: 'retry' },
    { id: 't7', from: 'payment_choice', to: 'failed', label: 'declined' },
    { id: 't8', from: 'fulfilled', to: 'end', label: '' },
    { id: 't9', from: 'failed', to: 'end', label: '' },
  ],
};
