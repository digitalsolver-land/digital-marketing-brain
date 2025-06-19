import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Database, 
  Table as TableIcon, 
  RefreshCw, 
  Eye, 
  Plus,
  Trash2,
  Edit
} from 'lucide-react';

interface TableInfo {
  table_name: string;
  column_count: number;
  row_count: number;
  table_size: string;
}

interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

// Available public tables from our schema
const PUBLIC_TABLES = [
  'workflows',
  'workflow_nodes', 
  'workflow_connections',
  'workflow_executions',
  'profiles',
  'user_roles',
  'user_secrets',
  'app_settings'
];

export const DatabaseManager: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [tableData, setTableData] = useState<any[]>([]);

  const loadTables = async () => {
    setLoading(true);
    try {
      const tableInfoPromises = PUBLIC_TABLES.map(async (tableName) => {
        try {
          // Get row count for each table
          const { count } = await supabase
            .from(tableName as any)
            .select('*', { count: 'exact', head: true });

          return {
            table_name: tableName,
            column_count: 0, // We'll get this when table is selected
            row_count: count || 0,
            table_size: 'N/A'
          };
        } catch (error) {
          console.warn(`Could not access table ${tableName}:`, error);
          return {
            table_name: tableName,
            column_count: 0,
            row_count: 0,
            table_size: 'N/A'
          };
        }
      });

      const tableInfoResults = await Promise.all(tableInfoPromises);
      setTables(tableInfoResults);

    } catch (error) {
      console.error('Erreur:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Erreur lors du chargement des tables",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTableDetails = async (tableName: string) => {
    setLoading(true);
    setSelectedTable(tableName);
    
    try {
      // Get sample data first to infer column structure
      const { data: sampleData, error: dataError } = await supabase
        .from(tableName as any)
        .select('*')
        .limit(1);

      if (dataError) {
        console.error('Erreur données:', dataError);
        setTableData([]);
        setColumns([]);
        toast({
          variant: "destructive",
          title: "Accès restreint",
          description: `Impossible d'accéder aux données de la table ${tableName}`,
        });
        return;
      }

      // Infer columns from sample data
      if (sampleData && sampleData.length > 0) {
        const sampleRow = sampleData[0];
        const inferredColumns: ColumnInfo[] = Object.keys(sampleRow).map(key => ({
          column_name: key,
          data_type: typeof sampleRow[key as keyof typeof sampleRow] === 'number' ? 'number' : 
                     typeof sampleRow[key as keyof typeof sampleRow] === 'boolean' ? 'boolean' :
                     Array.isArray(sampleRow[key as keyof typeof sampleRow]) ? 'array' :
                     typeof sampleRow[key as keyof typeof sampleRow] === 'object' ? 'jsonb' : 'text',
          is_nullable: sampleRow[key as keyof typeof sampleRow] === null ? 'YES' : 'NO',
          column_default: null
        }));
        
        setColumns(inferredColumns);
        
        // Get more sample data
        const { data: moreData } = await supabase
          .from(tableName as any)
          .select('*')
          .limit(10);
          
        setTableData(moreData || []);
      } else {
        setColumns([]);
        setTableData([]);
      }

    } catch (error) {
      console.error('Erreur:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Erreur lors du chargement des détails",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  const renderTableData = () => {
    if (tableData.length === 0) {
      return (
        <div className="text-center py-8 text-slate-600">
          <TableIcon className="w-12 h-12 mx-auto mb-4 text-slate-400" />
          <p>Aucune donnée disponible ou accès restreint</p>
        </div>
      );
    }

    const sampleRow = tableData[0];
    const columnKeys = Object.keys(sampleRow);

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columnKeys.map((key) => (
                <TableHead key={key}>{key}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {columnKeys.map((key) => (
                  <TableCell key={key}>
                    {row[key] !== null && row[key] !== undefined 
                      ? String(row[key]).substring(0, 100) 
                      : 'NULL'}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center space-x-2 mb-8">
        <Database className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Gestionnaire de Base de Données</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Tables</CardTitle>
              <Button onClick={loadTables} disabled={loading} size="sm">
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
            </div>
            <CardDescription>
              Tables disponibles dans la base de données
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-2">
              {loading && tables.length === 0 ? (
                <div className="text-center py-4">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-slate-600">Chargement...</p>
                </div>
              ) : tables.length === 0 ? (
                <div className="text-center py-4 text-slate-600">
                  <TableIcon className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                  <p>Aucune table trouvée</p>
                </div>
              ) : (
                tables.map((table) => (
                  <div 
                    key={table.table_name}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedTable === table.table_name 
                        ? 'bg-blue-50 border-blue-200' 
                        : 'hover:bg-slate-50'
                    }`}
                    onClick={() => loadTableDetails(table.table_name)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{table.table_name}</span>
                      <Badge variant="outline">{table.row_count}</Badge>
                    </div>
                    <div className="text-sm text-slate-600 mt-1">
                      {columns.length > 0 && selectedTable === table.table_name 
                        ? `${columns.length} colonnes`
                        : 'Cliquez pour voir les détails'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedTable ? `Table: ${selectedTable}` : 'Sélectionnez une table'}
            </CardTitle>
            <CardDescription>
              Structure et données de la table sélectionnée
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {!selectedTable ? (
              <div className="text-center py-8 text-slate-600">
                <Eye className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                <p>Cliquez sur une table pour voir ses détails</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Structure</h3>
                  {columns.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Colonne</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Nullable</TableHead>
                            <TableHead>Défaut</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {columns.map((column) => (
                            <TableRow key={column.column_name}>
                              <TableCell className="font-medium">
                                {column.column_name}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{column.data_type}</Badge>
                              </TableCell>
                              <TableCell>
                                {column.is_nullable === 'YES' ? 'Oui' : 'Non'}
                              </TableCell>
                              <TableCell>
                                {column.column_default || 'Aucun'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-slate-600">Aucune information de colonne disponible</p>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Données (10 premiers enregistrements)
                  </h3>
                  {renderTableData()}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
