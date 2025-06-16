
// Service unifié pour n8n - réexporte le service principal consolidé
export { n8nService as unifiedN8nService } from './n8nService';

// Réexport des types pour la compatibilité
export type {
  N8nWorkflow,
  N8nExecution,
  PaginatedResponse,
  RequestOptions,
  ConnectionStatus
} from './n8nService';
