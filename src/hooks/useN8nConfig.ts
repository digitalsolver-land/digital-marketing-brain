
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { n8nApi, ConnectionStatus } from '@/services/n8nApi';

export const useN8nConfig = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState({
    apiKey: '',
    baseUrl: 'https://n8n.srv860213.hstgr.cloud/api/v1'
  });
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');

  // Tester la connexion
  const testConnection = async () => {
    if (!config.apiKey.trim()) {
      toast({
        variant: "destructive",
        title: "Clé API requise",
        description: "Veuillez saisir votre clé API n8n",
      });
      return false;
    }

    setTesting(true);
    try {
      // Sauvegarder temporairement pour le test
      await n8nApi.saveConfig(config);
      
      const result = await n8nApi.checkConnection();
      setConnectionStatus(result.status);

      if (result.status === 'connected') {
        toast({
          title: "Connexion réussie ✅",
          description: "n8n est accessible",
        });
        return true;
      } else {
        toast({
          variant: "destructive",
          title: "Échec connexion ❌",
          description: result.error || "Test échoué",
        });
        return false;
      }
    } catch (error) {
      console.error('Erreur test:', error);
      toast({
        variant: "destructive",
        title: "Erreur de test",
        description: "Erreur lors du test de connexion",
      });
      return false;
    } finally {
      setTesting(false);
    }
  };

  // Sauvegarder la configuration
  const saveConfig = async () => {
    if (!config.apiKey.trim()) {
      toast({
        variant: "destructive",
        title: "Configuration incomplète",
        description: "La clé API est requise",
      });
      return false;
    }

    setSaving(true);
    try {
      await n8nApi.saveConfig(config);
      const success = await testConnection();
      
      if (success) {
        toast({
          title: "Configuration sauvegardée ✅",
          description: "Paramètres n8n enregistrés",
        });
      }
      
      return success;
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      toast({
        variant: "destructive",
        title: "Erreur de sauvegarde",
        description: "Impossible de sauvegarder",
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    config,
    setConfig,
    testing,
    saving,
    connectionStatus,
    testConnection,
    saveConfig
  };
};
