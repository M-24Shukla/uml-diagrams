import type { ClassDiagramModel } from './classTypes';

export const defaultClassDiagramModel: ClassDiagramModel = {
  classes: [
    {
      id: 'user',
      name: 'User',
      stereotype: 'class',
      fields: [
        { id: 'user-field-1', value: '+String name' },
        { id: 'user-field-2', value: '+String email' },
      ],
      methods: [
        { id: 'user-method-1', value: '+login()' },
        { id: 'user-method-2', value: '+logout()' },
      ],
    },
    {
      id: 'account',
      name: 'Account',
      stereotype: 'abstract',
      fields: [
        { id: 'account-field-1', value: '-String accountId' },
        { id: 'account-field-2', value: '#Boolean active' },
      ],
      methods: [
        { id: 'account-method-1', value: '+activate()' },
        { id: 'account-method-2', value: '+suspend()' },
      ],
    },
    {
      id: 'session',
      name: 'Session',
      stereotype: 'class',
      fields: [{ id: 'session-field-1', value: '-Date expiresAt' }],
      methods: [{ id: 'session-method-1', value: '+refresh()' }],
    },
  ],
  relationships: [
    {
      id: 'relationship-1',
      from: 'User',
      to: 'Account',
      kind: 'association',
      label: 'owns',
    },
    {
      id: 'relationship-2',
      from: 'User',
      to: 'Session',
      kind: 'composition',
      label: 'creates',
    },
  ],
};
