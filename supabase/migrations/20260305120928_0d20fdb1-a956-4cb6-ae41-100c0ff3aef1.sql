
-- =============================================
-- ENUMS
-- =============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'user');
CREATE TYPE public.contact_type AS ENUM ('person', 'company');
CREATE TYPE public.lead_status AS ENUM ('new', 'contacted', 'qualified', 'unqualified');
CREATE TYPE public.meeting_status AS ENUM ('scheduled', 'completed', 'cancelled');
CREATE TYPE public.deal_status AS ENUM ('negotiation', 'proposal', 'won', 'lost');
CREATE TYPE public.contract_status AS ENUM ('draft', 'active', 'completed', 'cancelled');
CREATE TYPE public.payment_milestone AS ENUM ('act14', 'act15', 'act16');
CREATE TYPE public.payment_status AS ENUM ('planned', 'partially_paid', 'paid', 'overdue');
CREATE TYPE public.installment_status AS ENUM ('planned', 'paid', 'failed');
CREATE TYPE public.unit_type AS ENUM ('apartment', 'office', 'parking_inside', 'parking_outside', 'garage');
CREATE TYPE public.permission_scope AS ENUM ('self', 'team', 'all');
CREATE TYPE public.workflow_step_status AS ENUM ('pending', 'in_progress', 'completed', 'skipped');
CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE public.task_status AS ENUM ('todo', 'in_progress', 'done', 'cancelled');
CREATE TYPE public.project_status AS ENUM ('planning', 'in_progress', 'on_hold', 'completed', 'cancelled');
CREATE TYPE public.commission_status AS ENUM ('pending', 'approved', 'paid');
CREATE TYPE public.notification_type AS ENUM ('info', 'warning', 'action_required', 'reminder');
CREATE TYPE public.audit_action AS ENUM ('created', 'updated', 'deleted', 'status_changed', 'payment_received', 'assigned', 'linked', 'unlinked');

-- =============================================
-- HELPER FUNCTION: update_updated_at_column
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- =============================================
-- RBAC TABLES
-- =============================================

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  job_title_id UUID,
  manager_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Roles
CREATE TABLE public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name app_role NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default roles
INSERT INTO public.roles (name, description) VALUES
  ('admin', 'Full system access'),
  ('manager', 'Team management access'),
  ('user', 'Standard user access');

-- User Roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Job Titles
CREATE TABLE public.job_titles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add FK to profiles
ALTER TABLE public.profiles ADD CONSTRAINT fk_profiles_job_title FOREIGN KEY (job_title_id) REFERENCES public.job_titles(id);

-- Teams (Department Teams)
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Team Members
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Permissions
CREATE TABLE public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  UNIQUE(resource, action)
);

-- Role Permissions (with scope)
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE NOT NULL,
  scope permission_scope NOT NULL DEFAULT 'self',
  UNIQUE(role, permission_id)
);
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Seed default permissions
INSERT INTO public.permissions (resource, action, description) VALUES
  ('contacts', 'read', 'View contacts'),
  ('contacts', 'create', 'Create contacts'),
  ('contacts', 'update', 'Edit contacts'),
  ('contacts', 'delete', 'Delete contacts'),
  ('leads', 'read', 'View leads'),
  ('leads', 'create', 'Create leads'),
  ('leads', 'update', 'Edit leads'),
  ('leads', 'delete', 'Delete leads'),
  ('meetings', 'read', 'View meetings'),
  ('meetings', 'create', 'Create meetings'),
  ('meetings', 'update', 'Edit meetings'),
  ('meetings', 'delete', 'Delete meetings'),
  ('deals', 'read', 'View deals'),
  ('deals', 'create', 'Create deals'),
  ('deals', 'update', 'Edit deals'),
  ('deals', 'delete', 'Delete deals'),
  ('contracts', 'read', 'View contracts'),
  ('contracts', 'create', 'Create contracts'),
  ('contracts', 'update', 'Edit contracts'),
  ('contracts', 'delete', 'Delete contracts'),
  ('documents', 'read', 'View documents'),
  ('documents', 'create', 'Upload documents'),
  ('documents', 'update', 'Edit documents'),
  ('documents', 'delete', 'Delete documents'),
  ('inventory', 'read', 'View real estate inventory'),
  ('inventory', 'create', 'Create inventory items'),
  ('inventory', 'update', 'Edit inventory items'),
  ('inventory', 'delete', 'Delete inventory items'),
  ('tasks', 'read', 'View tasks'),
  ('tasks', 'create', 'Create tasks'),
  ('tasks', 'update', 'Edit tasks'),
  ('tasks', 'delete', 'Delete tasks'),
  ('projects', 'read', 'View projects'),
  ('projects', 'create', 'Create projects'),
  ('projects', 'update', 'Edit projects'),
  ('projects', 'delete', 'Delete projects'),
  ('workflows', 'read', 'View workflows'),
  ('workflows', 'create', 'Create workflows'),
  ('workflows', 'update', 'Edit workflows'),
  ('workflows', 'delete', 'Delete workflows'),
  ('budgets', 'read', 'View budgets'),
  ('budgets', 'create', 'Create budgets'),
  ('budgets', 'update', 'Edit budgets'),
  ('commissions', 'read', 'View commissions'),
  ('commissions', 'create', 'Create commissions'),
  ('commissions', 'update', 'Edit commissions'),
  ('settings', 'read', 'View settings'),
  ('settings', 'update', 'Edit settings');

-- =============================================
-- CRM PIPELINE TABLES
-- =============================================

-- Contacts
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type contact_type NOT NULL DEFAULT 'person',
  first_name TEXT,
  last_name TEXT,
  company_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  notes TEXT,
  owner_id UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  team_id UUID REFERENCES public.teams(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Leads
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  status lead_status NOT NULL DEFAULT 'new',
  source TEXT,
  estimated_value NUMERIC(12,2),
  notes TEXT,
  owner_id UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  team_id UUID REFERENCES public.teams(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Meetings
CREATE TABLE public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status meeting_status NOT NULL DEFAULT 'scheduled',
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INT DEFAULT 60,
  location TEXT,
  attendees TEXT[],
  external_calendar_id TEXT,
  external_calendar_provider TEXT,
  notes TEXT,
  owner_id UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  team_id UUID REFERENCES public.teams(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON public.meetings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Deals
CREATE TABLE public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID REFERENCES public.meetings(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id),
  title TEXT NOT NULL,
  status deal_status NOT NULL DEFAULT 'negotiation',
  value NUMERIC(12,2),
  notes TEXT,
  owner_id UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  team_id UUID REFERENCES public.teams(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Contracts
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id),
  contract_number TEXT UNIQUE,
  title TEXT NOT NULL,
  status contract_status NOT NULL DEFAULT 'draft',
  total_value NUMERIC(12,2),
  signed_at TIMESTAMPTZ,
  notes TEXT,
  owner_id UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  team_id UUID REFERENCES public.teams(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- CONTRACT PAYMENTS (Act 14/15/16)
-- =============================================

CREATE TABLE public.contract_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE NOT NULL,
  milestone payment_milestone NOT NULL,
  planned_amount NUMERIC(12,2) NOT NULL,
  due_date DATE NOT NULL,
  status payment_status NOT NULL DEFAULT 'planned',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contract_payments ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_contract_payments_updated_at BEFORE UPDATE ON public.contract_payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.payment_installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_payment_id UUID REFERENCES public.contract_payments(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  paid_at TIMESTAMPTZ,
  status installment_status NOT NULL DEFAULT 'planned',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_installments ENABLE ROW LEVEL SECURITY;

-- =============================================
-- REAL ESTATE INVENTORY
-- =============================================

CREATE TABLE public.complexes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  description TEXT,
  total_buildings INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.complexes ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_complexes_updated_at BEFORE UPDATE ON public.complexes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complex_id UUID REFERENCES public.complexes(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  floors INT,
  total_units INT DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_buildings_updated_at BEFORE UPDATE ON public.buildings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID REFERENCES public.buildings(id) ON DELETE CASCADE NOT NULL,
  unit_number TEXT NOT NULL,
  type unit_type NOT NULL DEFAULT 'apartment',
  floor INT,
  rooms INT,
  area_sqm NUMERIC(8,2),
  price NUMERIC(12,2),
  status TEXT NOT NULL DEFAULT 'available',
  specs JSONB DEFAULT '{}',
  contact_id UUID REFERENCES public.contacts(id),
  deal_id UUID REFERENCES public.deals(id),
  contract_id UUID REFERENCES public.contracts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON public.units FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- DOCUMENT REPOSITORY
-- =============================================

CREATE TABLE public.document_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.document_folders(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.document_folders ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID REFERENCES public.document_folders(id),
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT,
  file_size BIGINT,
  mime_type TEXT,
  version INT NOT NULL DEFAULT 1,
  tags TEXT[],
  entity_type TEXT,
  entity_id UUID,
  created_by UUID REFERENCES auth.users(id),
  team_id UUID REFERENCES public.teams(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  version INT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- WORKFLOW ENGINE
-- =============================================

CREATE TABLE public.workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON public.workflows FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES public.workflows(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  step_order INT NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  conditions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.workflow_steps ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.workflow_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES public.workflows(id) ON DELETE CASCADE NOT NULL,
  entity_id UUID NOT NULL,
  current_step_id UUID REFERENCES public.workflow_steps(id),
  status TEXT NOT NULL DEFAULT 'active',
  started_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.workflow_runs ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_workflow_runs_updated_at BEFORE UPDATE ON public.workflow_runs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.workflow_run_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_run_id UUID REFERENCES public.workflow_runs(id) ON DELETE CASCADE NOT NULL,
  workflow_step_id UUID REFERENCES public.workflow_steps(id) NOT NULL,
  status workflow_step_status NOT NULL DEFAULT 'pending',
  completed_by UUID REFERENCES auth.users(id),
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.workflow_run_steps ENABLE ROW LEVEL SECURITY;

-- =============================================
-- TASK MANAGEMENT (separate from projects)
-- =============================================

CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  priority task_priority NOT NULL DEFAULT 'medium',
  status task_status NOT NULL DEFAULT 'todo',
  due_date TIMESTAMPTZ,
  assignee_id UUID REFERENCES auth.users(id),
  owner_id UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  team_id UUID REFERENCES public.teams(id),
  entity_type TEXT,
  entity_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- PROJECT MANAGEMENT (separate from tasks)
-- =============================================

CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status project_status NOT NULL DEFAULT 'planning',
  start_date DATE,
  end_date DATE,
  budget NUMERIC(14,2),
  owner_id UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  team_id UUID REFERENCES public.teams(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- BUDGET VS ACTUAL
-- =============================================

CREATE TABLE public.budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  description TEXT,
  budgeted_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  actual_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_budget_items_updated_at BEFORE UPDATE ON public.budget_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- COMMISSIONS
-- =============================================

CREATE TABLE public.commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES public.deals(id),
  contract_id UUID REFERENCES public.contracts(id),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  rate NUMERIC(5,2),
  amount NUMERIC(12,2) NOT NULL,
  status commission_status NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_commissions_updated_at BEFORE UPDATE ON public.commissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- NOTIFICATIONS
-- =============================================

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type notification_type NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  entity_type TEXT,
  entity_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- =============================================
-- AUTOMATION RULES
-- =============================================

CREATE TABLE public.automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  trigger_entity TEXT NOT NULL,
  trigger_event TEXT NOT NULL,
  conditions JSONB DEFAULT '{}',
  actions JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_automation_rules_updated_at BEFORE UPDATE ON public.automation_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- AUDIT TRAIL
-- =============================================

CREATE TABLE public.audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action audit_action NOT NULL,
  old_data JSONB,
  new_data JSONB,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_trail ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_audit_trail_entity ON public.audit_trail (entity_type, entity_id);
CREATE INDEX idx_audit_trail_user ON public.audit_trail (user_id);

-- =============================================
-- STORAGE BUCKET
-- =============================================

INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- =============================================
-- RLS POLICIES
-- =============================================

-- Profiles: everyone can read, users update own
CREATE POLICY "Profiles viewable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- User Roles: admins manage, users read own
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Teams: authenticated can read
CREATE POLICY "Teams viewable by authenticated" ON public.teams FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage teams" ON public.teams FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Team Members
CREATE POLICY "Team members viewable by authenticated" ON public.team_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage team members" ON public.team_members FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Role Permissions
CREATE POLICY "Role permissions viewable by authenticated" ON public.role_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage role permissions" ON public.role_permissions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- CRM tables: authenticated users can CRUD (fine-grained RBAC via app logic initially)
CREATE POLICY "Contacts access" ON public.contacts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Leads access" ON public.leads FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Meetings access" ON public.meetings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Deals access" ON public.deals FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Contracts access" ON public.contracts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Payments
CREATE POLICY "Contract payments access" ON public.contract_payments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Payment installments access" ON public.payment_installments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Inventory
CREATE POLICY "Complexes access" ON public.complexes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Buildings access" ON public.buildings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Units access" ON public.units FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Documents
CREATE POLICY "Document folders access" ON public.document_folders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Documents access" ON public.documents FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Document versions access" ON public.document_versions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Workflows
CREATE POLICY "Workflows access" ON public.workflows FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Workflow steps access" ON public.workflow_steps FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Workflow runs access" ON public.workflow_runs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Workflow run steps access" ON public.workflow_run_steps FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Tasks & Projects
CREATE POLICY "Tasks access" ON public.tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Projects access" ON public.projects FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Budget, Commissions
CREATE POLICY "Budget items access" ON public.budget_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Commissions access" ON public.commissions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Notifications: users see own
CREATE POLICY "Users see own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System inserts notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Automation Rules
CREATE POLICY "Automation rules access" ON public.automation_rules FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Audit Trail: authenticated can read
CREATE POLICY "Audit trail readable" ON public.audit_trail FOR SELECT TO authenticated USING (true);
CREATE POLICY "Audit trail insertable" ON public.audit_trail FOR INSERT TO authenticated WITH CHECK (true);

-- Storage policies
CREATE POLICY "Authenticated users can read documents" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'documents');
CREATE POLICY "Authenticated users can upload documents" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documents');
CREATE POLICY "Authenticated users can update documents" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'documents');
CREATE POLICY "Authenticated users can delete documents" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'documents');

-- =============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
