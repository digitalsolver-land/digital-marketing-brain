
import { n8nService } from './n8nService';

export class N8nTestService {
  static async testAllEndpoints() {
    const results = {
      connection: false,
      workflows: false,
      executions: false,
      tags: false,
      variables: false,
      projects: false,
      credentials: false,
      errors: [] as string[]
    };

    console.log('🧪 Démarrage des tests complets n8n...');

    // Diagnostic de configuration
    console.log('🔧 Diagnostic configuration...');
    try {
      const configResult = await n8nService.getN8nConfig();
      console.log('📋 Config récupérée:', {
        hasConfig: !!configResult,
        hasApiKey: !!(configResult?.apiKey),
        hasBaseUrl: !!(configResult?.baseUrl),
        apiKeyLength: configResult?.apiKey?.length || 0
      });
    } catch (error) {
      console.error('❌ Erreur diagnostic config:', error);
      results.errors.push(`Config: ${error}`);
    }

    // Test 1: Connexion
    try {
      console.log('🔍 Test connexion...');
      const connectionResult = await n8nService.checkConnection();
      results.connection = connectionResult.status === 'connected';
      if (!results.connection) {
        results.errors.push(`Connexion: ${connectionResult.error}`);
      }
    } catch (error) {
      results.errors.push(`Connexion: ${error}`);
    }

    // Test 2: Récupération des workflows
    try {
      console.log('📋 Test récupération workflows...');
      const workflowsResult = await n8nService.getWorkflows({ limit: 10 });
      results.workflows = Array.isArray(workflowsResult.data);
      console.log(`✅ ${workflowsResult.data.length} workflows trouvés:`, 
        workflowsResult.data.map(w => ({ id: w.id, name: w.name, active: w.active }))
      );
    } catch (error) {
      results.errors.push(`Workflows: ${error}`);
      console.error('❌ Erreur workflows:', error);
    }

    // Test 3: Récupération des exécutions
    try {
      console.log('⚡ Test récupération exécutions...');
      const executionsResult = await n8nService.getExecutions({ limit: 5 });
      results.executions = Array.isArray(executionsResult.data);
      console.log(`✅ ${executionsResult.data.length} exécutions trouvées`);
    } catch (error) {
      results.errors.push(`Executions: ${error}`);
      console.error('❌ Erreur exécutions:', error);
    }

    // Test 4: Récupération des tags
    try {
      console.log('🏷️ Test récupération tags...');
      const tagsResult = await n8nService.getTags({ limit: 10 });
      results.tags = Array.isArray(tagsResult.data);
      console.log(`✅ ${tagsResult.data.length} tags trouvés`);
    } catch (error) {
      results.errors.push(`Tags: ${error}`);
      console.error('❌ Erreur tags:', error);
    }

    // Test 5: Récupération des variables
    try {
      console.log('🔧 Test récupération variables...');
      const variablesResult = await n8nService.getVariables({ limit: 10 });
      results.variables = Array.isArray(variablesResult.data);
      console.log(`✅ ${variablesResult.data.length} variables trouvées`);
    } catch (error) {
      results.errors.push(`Variables: ${error}`);
      console.error('❌ Erreur variables:', error);
    }

    // Test 6: Récupération des projets
    try {
      console.log('📁 Test récupération projets...');
      const projectsResult = await n8nService.getProjects({ limit: 10 });
      results.projects = Array.isArray(projectsResult.data);
      console.log(`✅ ${projectsResult.data.length} projets trouvés`);
    } catch (error) {
      results.errors.push(`Projects: ${error}`);
      console.error('❌ Erreur projets:', error);
    }

    // Résumé des tests
    console.log('\n📊 RÉSULTATS DES TESTS:');
    console.log('======================');
    console.log(`🔌 Connexion: ${results.connection ? '✅' : '❌'}`);
    console.log(`📋 Workflows: ${results.workflows ? '✅' : '❌'}`);
    console.log(`⚡ Exécutions: ${results.executions ? '✅' : '❌'}`);
    console.log(`🏷️ Tags: ${results.tags ? '✅' : '❌'}`);
    console.log(`🔧 Variables: ${results.variables ? '✅' : '❌'}`);
    console.log(`📁 Projets: ${results.projects ? '✅' : '❌'}`);

    if (results.errors.length > 0) {
      console.log('\n❌ ERREURS DÉTECTÉES:');
      results.errors.forEach(error => console.log(`  - ${error}`));
    }

    return results;
  }

  static async testSpecificWorkflow(workflowId: string) {
    console.log(`🔍 Test détaillé du workflow: ${workflowId}`);
    
    try {
      // Récupérer le workflow
      const workflow = await n8nService.getWorkflow(workflowId);
      console.log('✅ Workflow récupéré:', {
        id: workflow.id,
        name: workflow.name,
        active: workflow.active,
        nodesCount: workflow.nodes?.length || 0
      });

      // Récupérer ses exécutions
      const executions = await n8nService.getExecutions({ 
        workflowId: workflowId, 
        limit: 5 
      });
      console.log(`✅ ${executions.data.length} exécutions trouvées pour ce workflow`);

      // Test activation/désactivation
      if (workflow.active) {
        console.log('🔄 Test désactivation...');
        await n8nService.deactivateWorkflow(workflowId);
        console.log('✅ Workflow désactivé');
        
        console.log('🔄 Test réactivation...');
        await n8nService.activateWorkflow(workflowId);
        console.log('✅ Workflow réactivé');
      } else {
        console.log('🔄 Test activation...');
        await n8nService.activateWorkflow(workflowId);
        console.log('✅ Workflow activé');
      }

      return true;
    } catch (error) {
      console.error('❌ Erreur test workflow:', error);
      return false;
    }
  }

  static async importAllWorkflows() {
    console.log('📥 Import complet des workflows...');
    
    try {
      const allWorkflows = await n8nService.importAllWorkflows();
      console.log(`✅ ${allWorkflows.length} workflows importés`);
      
      // Afficher les détails
      allWorkflows.forEach((workflow, index) => {
        console.log(`${index + 1}. ${workflow.name} (${workflow.id}) - ${workflow.active ? 'Actif' : 'Inactif'}`);
      });

      return allWorkflows;
    } catch (error) {
      console.error('❌ Erreur import workflows:', error);
      return [];
    }
  }
}

// Fonction globale pour les tests depuis la console
(window as any).testN8n = {
  all: () => N8nTestService.testAllEndpoints(),
  workflow: (id: string) => N8nTestService.testSpecificWorkflow(id),
  import: () => N8nTestService.importAllWorkflows(),
  connection: () => n8nService.checkConnection(),
  workflows: () => n8nService.getWorkflows({ limit: 50 })
};

export default N8nTestService;
