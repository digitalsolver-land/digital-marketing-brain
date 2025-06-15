
-- Table pour stocker les workflows
CREATE TABLE public.workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  n8n_workflow_id TEXT,
  json_data JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'draft')),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour stocker les nœuds de workflow (pour faciliter les requêtes)
CREATE TABLE public.workflow_nodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID REFERENCES public.workflows(id) ON DELETE CASCADE NOT NULL,
  node_id TEXT NOT NULL,
  node_type TEXT NOT NULL,
  name TEXT NOT NULL,
  position_x FLOAT NOT NULL,
  position_y FLOAT NOT NULL,
  parameters JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour stocker les connexions entre nœuds
CREATE TABLE public.workflow_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID REFERENCES public.workflows(id) ON DELETE CASCADE NOT NULL,
  source_node_id TEXT NOT NULL,
  target_node_id TEXT NOT NULL,
  source_index INTEGER DEFAULT 0,
  target_index INTEGER DEFAULT 0,
  connection_type TEXT DEFAULT 'main',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour stocker les exécutions de workflows
CREATE TABLE public.workflow_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID REFERENCES public.workflows(id) ON DELETE CASCADE NOT NULL,
  n8n_execution_id INTEGER,
  status TEXT NOT NULL CHECK (status IN ('running', 'success', 'error', 'waiting')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  finished_at TIMESTAMP WITH TIME ZONE,
  execution_data JSONB,
  error_message TEXT
);

-- Activer RLS sur toutes les tables
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour workflows
CREATE POLICY "Users can view their own workflows" 
  ON public.workflows 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workflows" 
  ON public.workflows 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workflows" 
  ON public.workflows 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workflows" 
  ON public.workflows 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Politiques RLS pour workflow_nodes
CREATE POLICY "Users can view nodes of their workflows" 
  ON public.workflow_nodes 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.workflows 
    WHERE workflows.id = workflow_nodes.workflow_id 
    AND workflows.user_id = auth.uid()
  ));

CREATE POLICY "Users can create nodes for their workflows" 
  ON public.workflow_nodes 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.workflows 
    WHERE workflows.id = workflow_nodes.workflow_id 
    AND workflows.user_id = auth.uid()
  ));

CREATE POLICY "Users can update nodes of their workflows" 
  ON public.workflow_nodes 
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.workflows 
    WHERE workflows.id = workflow_nodes.workflow_id 
    AND workflows.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete nodes of their workflows" 
  ON public.workflow_nodes 
  FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.workflows 
    WHERE workflows.id = workflow_nodes.workflow_id 
    AND workflows.user_id = auth.uid()
  ));

-- Politiques RLS pour workflow_connections
CREATE POLICY "Users can view connections of their workflows" 
  ON public.workflow_connections 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.workflows 
    WHERE workflows.id = workflow_connections.workflow_id 
    AND workflows.user_id = auth.uid()
  ));

CREATE POLICY "Users can create connections for their workflows" 
  ON public.workflow_connections 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.workflows 
    WHERE workflows.id = workflow_connections.workflow_id 
    AND workflows.user_id = auth.uid()
  ));

CREATE POLICY "Users can update connections of their workflows" 
  ON public.workflow_connections 
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.workflows 
    WHERE workflows.id = workflow_connections.workflow_id 
    AND workflows.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete connections of their workflows" 
  ON public.workflow_connections 
  FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.workflows 
    WHERE workflows.id = workflow_connections.workflow_id 
    AND workflows.user_id = auth.uid()
  ));

-- Politiques RLS pour workflow_executions
CREATE POLICY "Users can view executions of their workflows" 
  ON public.workflow_executions 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.workflows 
    WHERE workflows.id = workflow_executions.workflow_id 
    AND workflows.user_id = auth.uid()
  ));

CREATE POLICY "Users can create executions for their workflows" 
  ON public.workflow_executions 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.workflows 
    WHERE workflows.id = workflow_executions.workflow_id 
    AND workflows.user_id = auth.uid()
  ));

CREATE POLICY "Users can update executions of their workflows" 
  ON public.workflow_executions 
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.workflows 
    WHERE workflows.id = workflow_executions.workflow_id 
    AND workflows.user_id = auth.uid()
  ));

-- Index pour améliorer les performances
CREATE INDEX idx_workflows_user_id ON public.workflows(user_id);
CREATE INDEX idx_workflow_nodes_workflow_id ON public.workflow_nodes(workflow_id);
CREATE INDEX idx_workflow_connections_workflow_id ON public.workflow_connections(workflow_id);
CREATE INDEX idx_workflow_executions_workflow_id ON public.workflow_executions(workflow_id);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_workflows_updated_at 
    BEFORE UPDATE ON public.workflows 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
