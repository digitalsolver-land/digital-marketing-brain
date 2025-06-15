
// Service unifié pour n8n - wrapper pour le nouveau service consolidé
export { n8nService as unifiedN8nService } from './n8nService';

// Réexport des types pour la compatibilité
export type {
  N8nWorkflow,
  N8nExecution,
  N8nUser,
  N8nProject,
  N8nCredential,
  N8nTag,
  N8nVariable,
  N8nAuditReport,
  PaginatedResponse,
  RequestOptions,
  ConnectionStatus
} from './n8nService';
