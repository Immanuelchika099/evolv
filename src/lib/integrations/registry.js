/**
 * EVOLV integrations registry.
 * Metadata only: connectors are not usable until server-side OAuth/API handlers
 * and permission-scoped sync implementations are configured.
 * Never put provider client secrets or service-role keys in browser code.
 */
export const integrationRegistry = [
  { id: 'google-calendar', name: 'Google Calendar', category: 'Planning', description: 'Understand upcoming commitments and help plan realistic routines.', status: 'planned', auth: 'oauth', scopes: ['calendar.events.readonly'] },
  { id: 'tasks', name: 'Task manager', category: 'Productivity', description: 'Turn goals into actionable tasks and review progress.', status: 'planned', auth: 'provider-api', scopes: ['tasks.read', 'tasks.write'] },
  { id: 'health-data', name: 'Health data', category: 'Wellbeing', description: 'Use opted-in sleep, activity and wellbeing summaries where device and provider APIs allow it.', status: 'planned', auth: 'platform-permission', scopes: ['health.read'] },
  { id: 'web-search', name: 'Web search', category: 'AI tools', description: 'Let EVOLV AI retrieve current public information when needed.', status: 'planned', auth: 'server-tool', scopes: ['web.search'] },
]

export function getIntegrationById(id) {
  return integrationRegistry.find((integration) => integration.id === id) || null
}
