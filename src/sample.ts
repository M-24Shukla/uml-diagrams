import type { DiagramModel } from './types';

export const defaultModel: DiagramModel = {
  participants: [
    { id: 'user', name: 'User', color: '#e0f2fe', type: 'actor' },
    { id: 'app', name: 'App', color: '#ede9fe', type: 'participant' },
    { id: 'api', name: 'API', color: '#dcfce7', type: 'participant' },
    { id: 'db', name: 'DB', color: '#fef3c7', type: 'participant' },
    { id: 'session', name: 'Session', color: '#fce7f3', type: 'participant' },
  ],
  steps: [
    {
      id: 'submit',
      kind: 'message',
      from: 'user',
      to: 'app',
      arrow: 'sync',
      label: 'submitForm(name, email)',
    },
    {
      id: 'post-users',
      kind: 'message',
      from: 'app',
      to: 'api',
      arrow: 'sync',
      label: 'POST /users { name, email }',
    },
    {
      id: 'validation',
      kind: 'alt',
      branches: [
        {
          id: 'valid-input',
          label: 'valid input',
          steps: [
            {
              id: 'create-user',
              kind: 'message',
              from: 'api',
              to: 'db',
              arrow: 'sync',
              label: 'createUser(name, email)',
            },
            {
              id: 'db-user-id',
              kind: 'message',
              from: 'db',
              to: 'api',
              arrow: 'response',
              label: 'userId',
            },
            {
              id: 'created',
              kind: 'message',
              from: 'api',
              to: 'app',
              arrow: 'response',
              label: '201 Created { userId }',
            },
          ],
        },
        {
          id: 'missing-email',
          label: 'missing email',
          steps: [
            {
              id: 'bad-request',
              kind: 'message',
              from: 'api',
              to: 'app',
              arrow: 'response',
              label: '400 Bad Request { error: "email required" }',
            },
          ],
        },
        {
          id: 'exists',
          label: 'user already exists',
          steps: [
            {
              id: 'conflict',
              kind: 'message',
              from: 'api',
              to: 'app',
              arrow: 'response',
              label: '409 Conflict { error: "user exists" }',
            },
          ],
        },
      ],
    },
    {
      id: 'welcome-loop',
      kind: 'loop',
      label: 'For each welcome task',
      steps: [
        {
          id: 'run-task',
          kind: 'message',
          from: 'app',
          to: 'api',
          arrow: 'sync',
          label: 'runWelcomeTask(userId, taskName)',
        },
        {
          id: 'task-status',
          kind: 'message',
          from: 'api',
          to: 'app',
          arrow: 'response',
          label: 'taskStatus',
        },
      ],
    },
    {
      id: 'optional-session',
      kind: 'opt',
      label: 'remember me selected',
      steps: [
        {
          id: 'create-session',
          kind: 'message',
          from: 'app',
          to: 'session',
          arrow: 'create',
          label: 'new Session(userId)',
        },
      ],
    },
    {
      id: 'parallel-notify',
      kind: 'par',
      branches: [
        {
          id: 'send-email',
          label: 'email notification',
          steps: [
            {
              id: 'email-task',
              kind: 'message',
              from: 'app',
              to: 'api',
              arrow: 'async',
              label: 'sendWelcomeEmail(userId)',
            },
          ],
        },
        {
          id: 'audit-log',
          label: 'audit log',
          steps: [
            {
              id: 'audit-task',
              kind: 'message',
              from: 'api',
              to: 'db',
              arrow: 'async',
              label: 'insertAuditEvent(userId)',
            },
          ],
        },
      ],
    },
    {
      id: 'logout',
      kind: 'message',
      from: 'app',
      to: 'api',
      arrow: 'sync',
      label: 'logout(userId)',
    },
    {
      id: 'destroy-session',
      kind: 'message',
      from: 'app',
      to: 'session',
      arrow: 'destroy',
      label: 'destroy()',
    },
  ],
};
