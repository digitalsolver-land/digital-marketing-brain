import React, { useState, useEffect } from 'react';
import { Database, Table, Plus, Edit, Trash2, Search, Filter, Download, Upload, RefreshCw, Eye, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DatabaseTable {
  name: string;
  schema: string;
  rows: number;
  size: string;
  lastModified: string;
  type: 'table' | 'view';
}

interface TableColumn {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey: boolean;
  foreignKey?: string;
}

interface QueryResult {
  columns: string[];
  rows: any[];
  executionTime: number;
  affectedRows?: number;
}

type TableMapping = {
  [key: string]: string;
};

export const DatabaseManager: React.FC = () => {
  const [tables, setTables] = useState<DatabaseTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<DatabaseTable | null>(null);
  const [tableColumns, setTableColumns] = useState<TableColumn[]>([]);
  const [tableData, setTableData] = useState<any[]>([]);
  const [sqlQuery, setSqlQuery] = useState('');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('tables');
  const { toast } = useToast();

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    setIsLoading(true);
    try {
      // Use known tables since information_schema is not directly accessible
      const knownTables: DatabaseTable[] = [
        {
          name: 'profiles',
          schema: 'public',
          rows: 0,
          size: '8 KB',
          lastModified: new Date().toISOString(),
          type: 'table'
        },
        {
          name: 'user_roles',
          schema: 'public',
          rows: 0,
          size: '4 KB',
          lastModified: new Date().toISOString(),
          type: 'table'
        },
        {
          name: 'app_settings',
          schema: 'public',
          rows: 0,
          size: '12 KB',
          lastModified: new Date().toISOString(),
          type: 'table'
        },
        {
          name: 'workflows',
          schema: 'public',
          rows: 0,
          size: '16 KB',
          lastModified: new Date().toISOString(),
          type: 'table'
        },
        {
          name: 'workflow_nodes',
          schema: 'public',
          rows: 0,
          size: '8 KB',
          lastModified: new Date().toISOString(),
          type: 'table'
        },
        {
          name: 'workflow_connections',
          schema: 'public',
          rows: 0,
          size: '6 KB',
          lastModified: new Date().toISOString(),
          type: 'table'
        },
        {
          name: 'workflow_executions',
          schema: 'public',
          rows: 0,
          size: '10 KB',
          lastModified: new Date().toISOString(),
          type: 'table'
        }
      ];
      setTables(knownTables);

      // Get row counts for each table
      await updateTableStats();
    } catch (error) {
      console.error('Error loading tables:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les tables de la base de données",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateTableStats = async () => {
    // Update table statistics by querying specific known tables
    const tableMap: TableMapping = {
      'profiles': 'profiles',
      'user_roles': 'user_roles', 
      'app_settings': 'app_settings',
      'workflows': 'workflows',
      'workflow_nodes': 'workflow_nodes',
      'workflow_connections': 'workflow_connections',
      'workflow_executions': 'workflow_executions'
    };

    const updatedTables = await Promise.all(
      tables.map(async (table) => {
        try {
          const tableName = tableMap[table.name];
          if (tableName) {
            const { count, error } = await supabase
              .from(tableName as any)
              .select('*', { count: 'exact', head: true });
            
            return {
              ...table,
              rows: count || 0
            };
          }
          return table;
        } catch (error) {
          return table;
        }
      })
    );
    setTables(updatedTables);
  };

  const loadTableDetails = async (table: DatabaseTable) => {
    setIsLoading(true);
    setSelectedTable(table);
    
    try {
      const tableMap: TableMapping = {
        'profiles': 'profiles',
        'user_roles': 'user_roles', 
        'app_settings': 'app_settings',
        'workflows': 'workflows',
        'workflow_nodes': 'workflow_nodes',
        'workflow_connections': 'workflow_connections',
        'workflow_executions': 'workflow_executions'
      };

      const tableName = tableMap[table.name];
      if (tableName) {
        const { data, error } = await supabase
          .from(tableName as any)
          .select('*')
          .limit(100);

        if (error) {
          console.error('Error loading table data:', error);
          toast({
            title: "Erreur",
            description: `Impossible de charger les données de la table ${table.name}`,
            variant: "destructive"
          });
        } else {
          setTableData(data || []);
          
          // Extract column information from the first row
          if (data && data.length > 0) {
            const columns: TableColumn[] = Object.keys(data[0]).map(key => ({
              name: key,
              type: typeof data[0][key] === 'string' ? 'text' : 
                    typeof data[0][key] === 'number' ? 'number' : 
                    typeof data[0][key] === 'boolean' ? 'boolean' : 'unknown',
              nullable: true,
              primaryKey: key === 'id',
              foreignKey: key.includes('_id') ? key : undefined
            }));
            setTableColumns(columns);
          }
        }
      }
    } catch (error) {
      console.error('Error loading table details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const executeQuery = async () => {
    if (!sqlQuery.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir une requête SQL",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    const startTime = Date.now();

    try {
      // Simulate query execution for demonstration
      toast({
        title: "Limitation",
        description: "L'exécution de requêtes SQL personnalisées nécessite des privilèges administrateur",
        variant: "destructive"
      });
    } catch (error: any) {
      console.error('Query execution error:', error);
      toast({
        title: "Erreur d'exécution",
        description: error.message || "Erreur lors de l'exécution de la requête",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTables = tables.filter(table =>
    table.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportTableData = async (table: DatabaseTable) => {
    try {
      const tableMap: TableMapping = {
        'profiles': 'profiles',
        'user_roles': 'user_roles', 
        'app_settings': 'app_settings',
        'workflows': 'workflows',
        'workflow_nodes': 'workflow_nodes',
        'workflow_connections': 'workflow_connections',
        'workflow_executions': 'workflow_executions'
      };

      const tableName = tableMap[table.name];
      if (tableName) {
        const { data, error } = await supabase
          .from(tableName as any)
          .select('*');

        if (error) throw error;

        const csvContent = convertToCSV(data || []);
        downloadCSV(csvContent, `${table.name}.csv`);
        
        toast({
          title: "Export réussi",
          description: `Table ${table.name} exportée en CSV`
        });
      }
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter la table",
        variant: "destructive"
      });
    }
  };

  const convertToCSV = (data: any[]): string => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    const csvRows = data.map(row =>
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
      }).join(',')
    );
    
    return [csvHeaders, ...csvRows].join('\n');
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Gestionnaire de Base de Données
        </h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={loadTables} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Configuration
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tables">Tables</TabsTrigger>
          <TabsTrigger value="query">Requêtes SQL</TabsTrigger>
          <TabsTrigger value="data">Données</TabsTrigger>
        </TabsList>

        <TabsContent value="tables" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Database className="w-5 h-5 text-blue-500" />
                  <span>Tables de la base de données</span>
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      placeholder="Rechercher une table..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                </div>
              </div>
              <CardDescription>
                Gérez et explorez vos tables de base de données Supabase
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {filteredTables.map((table) => (
                  <div
                    key={table.name}
                    className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <Table className="w-5 h-5 text-slate-500" />
                      <div>
                        <h3 className="font-medium text-slate-900 dark:text-slate-100">
                          {table.name}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-slate-500">
                          <span>{table.rows} lignes</span>
                          <span>{table.size}</span>
                          <Badge variant={table.type === 'table' ? 'default' : 'secondary'}>
                            {table.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => loadTableDetails(table)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Voir
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => exportTableData(table)}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Export
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="query" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-green-500" />
                <span>Éditeur SQL</span>
              </CardTitle>
              <CardDescription>
                Exécutez des requêtes SQL sur votre base de données
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="sql-query">Requête SQL</Label>
                  <Textarea
                    id="sql-query"
                    placeholder="SELECT * FROM profiles LIMIT 10;"
                    value={sqlQuery}
                    onChange={(e) => setSqlQuery(e.target.value)}
                    className="min-h-32 font-mono"
                  />
                </div>
                <Button onClick={executeQuery} disabled={isLoading}>
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Database className="w-4 h-4 mr-2" />
                  )}
                  Exécuter la requête
                </Button>
              </div>
            </CardContent>
          </Card>

          {queryResult && (
            <Card>
              <CardHeader>
                <CardTitle>Résultats</CardTitle>
                <CardDescription>
                  {queryResult.rows.length} lignes retournées en {queryResult.executionTime}ms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-slate-200 dark:border-slate-700">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800">
                        {queryResult.columns.map((column) => (
                          <th
                            key={column}
                            className="border border-slate-200 dark:border-slate-700 px-4 py-2 text-left font-medium"
                          >
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {queryResult.rows.map((row, index) => (
                        <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                          {queryResult.columns.map((column) => (
                            <td
                              key={column}
                              className="border border-slate-200 dark:border-slate-700 px-4 py-2"
                            >
                              {typeof row[column] === 'object' 
                                ? JSON.stringify(row[column]) 
                                : String(row[column] ?? '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          {selectedTable ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Table className="w-5 h-5 text-purple-500" />
                  <span>Table: {selectedTable.name}</span>
                </CardTitle>
                <CardDescription>
                  {tableData.length} lignes • {tableColumns.length} colonnes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Column information */}
                  <div>
                    <h3 className="font-medium mb-2">Structure de la table</h3>
                    <div className="grid gap-2">
                      {tableColumns.map((column) => (
                        <div
                          key={column.name}
                          className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-sm">{column.name}</span>
                            <Badge variant="outline">{column.type}</Badge>
                            {column.primaryKey && <Badge className="bg-yellow-500">PK</Badge>}
                            {column.foreignKey && <Badge variant="secondary">FK</Badge>}
                          </div>
                          <span className="text-sm text-slate-500">
                            {column.nullable ? 'Nullable' : 'Not null'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Table data */}
                  <div>
                    <h3 className="font-medium mb-2">Données</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-slate-200 dark:border-slate-700">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-800">
                            {tableColumns.map((column) => (
                              <th
                                key={column.name}
                                className="border border-slate-200 dark:border-slate-700 px-4 py-2 text-left font-medium"
                              >
                                {column.name}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {tableData.slice(0, 50).map((row, index) => (
                            <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                              {tableColumns.map((column) => (
                                <td
                                  key={column.name}
                                  className="border border-slate-200 dark:border-slate-700 px-4 py-2"
                                >
                                  {typeof row[column.name] === 'object'
                                    ? JSON.stringify(row[column.name])
                                    : String(row[column.name] ?? '')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {tableData.length > 50 && (
                      <p className="text-sm text-slate-500 mt-2">
                        Affichage des 50 premières lignes sur {tableData.length}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Table className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-600 mb-2">
                  Sélectionnez une table
                </h3>
                <p className="text-slate-500">
                  Choisissez une table dans l'onglet "Tables" pour voir ses données
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
