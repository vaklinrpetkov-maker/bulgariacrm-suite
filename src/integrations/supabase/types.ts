export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_trail: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"]
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          new_data: Json | null
          old_data: Json | null
          user_id: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action"]
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action"]
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      automation_rules: {
        Row: {
          actions: Json
          conditions: Json | null
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          name: string
          trigger_entity: string
          trigger_event: string
          updated_at: string
        }
        Insert: {
          actions?: Json
          conditions?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name: string
          trigger_entity: string
          trigger_event: string
          updated_at?: string
        }
        Update: {
          actions?: Json
          conditions?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name?: string
          trigger_entity?: string
          trigger_event?: string
          updated_at?: string
        }
        Relationships: []
      }
      budget_items: {
        Row: {
          actual_amount: number
          budgeted_amount: number
          category: string
          contract_id: string | null
          created_at: string
          description: string | null
          id: string
          project_id: string | null
          updated_at: string
        }
        Insert: {
          actual_amount?: number
          budgeted_amount?: number
          category: string
          contract_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          project_id?: string | null
          updated_at?: string
        }
        Update: {
          actual_amount?: number
          budgeted_amount?: number
          category?: string
          contract_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          project_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_items_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      buildings: {
        Row: {
          complex_id: string
          created_at: string
          description: string | null
          floors: number | null
          id: string
          name: string
          total_units: number | null
          updated_at: string
        }
        Insert: {
          complex_id: string
          created_at?: string
          description?: string | null
          floors?: number | null
          id?: string
          name: string
          total_units?: number | null
          updated_at?: string
        }
        Update: {
          complex_id?: string
          created_at?: string
          description?: string | null
          floors?: number | null
          id?: string
          name?: string
          total_units?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "buildings_complex_id_fkey"
            columns: ["complex_id"]
            isOneToOne: false
            referencedRelation: "complexes"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          amount: number
          contract_id: string | null
          created_at: string
          deal_id: string | null
          id: string
          notes: string | null
          paid_at: string | null
          rate: number | null
          status: Database["public"]["Enums"]["commission_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          contract_id?: string | null
          created_at?: string
          deal_id?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          rate?: number | null
          status?: Database["public"]["Enums"]["commission_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          contract_id?: string | null
          created_at?: string
          deal_id?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          rate?: number | null
          status?: Database["public"]["Enums"]["commission_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      complexes: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          total_buildings: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          total_buildings?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          total_buildings?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          address: string | null
          city: string | null
          company_name: string | null
          created_at: string
          created_by: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          notes: string | null
          owner_id: string | null
          phone: string | null
          team_id: string | null
          type: Database["public"]["Enums"]["contact_type"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          company_name?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          notes?: string | null
          owner_id?: string | null
          phone?: string | null
          team_id?: string | null
          type?: Database["public"]["Enums"]["contact_type"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          company_name?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          notes?: string | null
          owner_id?: string | null
          phone?: string | null
          team_id?: string | null
          type?: Database["public"]["Enums"]["contact_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_payments: {
        Row: {
          contract_id: string
          created_at: string
          due_date: string
          id: string
          milestone: Database["public"]["Enums"]["payment_milestone"]
          notes: string | null
          planned_amount: number
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          contract_id: string
          created_at?: string
          due_date: string
          id?: string
          milestone: Database["public"]["Enums"]["payment_milestone"]
          notes?: string | null
          planned_amount: number
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          contract_id?: string
          created_at?: string
          due_date?: string
          id?: string
          milestone?: Database["public"]["Enums"]["payment_milestone"]
          notes?: string | null
          planned_amount?: number
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_payments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          contact_id: string | null
          contract_number: string | null
          created_at: string
          created_by: string | null
          deal_id: string | null
          id: string
          notes: string | null
          owner_id: string | null
          signed_at: string | null
          status: Database["public"]["Enums"]["contract_status"]
          team_id: string | null
          title: string
          total_value: number | null
          updated_at: string
        }
        Insert: {
          contact_id?: string | null
          contract_number?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          id?: string
          notes?: string | null
          owner_id?: string | null
          signed_at?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          team_id?: string | null
          title: string
          total_value?: number | null
          updated_at?: string
        }
        Update: {
          contact_id?: string | null
          contract_number?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          id?: string
          notes?: string | null
          owner_id?: string | null
          signed_at?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          team_id?: string | null
          title?: string
          total_value?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          contact_id: string | null
          created_at: string
          created_by: string | null
          id: string
          meeting_id: string | null
          notes: string | null
          owner_id: string | null
          status: Database["public"]["Enums"]["deal_status"]
          team_id: string | null
          title: string
          updated_at: string
          value: number | null
        }
        Insert: {
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          meeting_id?: string | null
          notes?: string | null
          owner_id?: string | null
          status?: Database["public"]["Enums"]["deal_status"]
          team_id?: string | null
          title: string
          updated_at?: string
          value?: number | null
        }
        Update: {
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          meeting_id?: string | null
          notes?: string | null
          owner_id?: string | null
          status?: Database["public"]["Enums"]["deal_status"]
          team_id?: string | null
          title?: string
          updated_at?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      document_folders: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          parent_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          parent_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "document_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      document_versions: {
        Row: {
          created_at: string
          created_by: string | null
          document_id: string
          file_path: string
          file_size: number | null
          id: string
          notes: string | null
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          document_id: string
          file_path: string
          file_size?: number | null
          id?: string
          notes?: string | null
          version: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          document_id?: string
          file_path?: string
          file_size?: number | null
          id?: string
          notes?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          entity_id: string | null
          entity_type: string | null
          file_path: string | null
          file_size: number | null
          folder_id: string | null
          id: string
          mime_type: string | null
          tags: string[] | null
          team_id: string | null
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          file_path?: string | null
          file_size?: number | null
          folder_id?: string | null
          id?: string
          mime_type?: string | null
          tags?: string[] | null
          team_id?: string | null
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          file_path?: string | null
          file_size?: number | null
          folder_id?: string | null
          id?: string
          mime_type?: string | null
          tags?: string[] | null
          team_id?: string | null
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "documents_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "document_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      job_titles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          contact_id: string
          created_at: string
          created_by: string | null
          estimated_value: number | null
          id: string
          notes: string | null
          owner_id: string | null
          source: string | null
          status: Database["public"]["Enums"]["lead_status"]
          team_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          created_by?: string | null
          estimated_value?: number | null
          id?: string
          notes?: string | null
          owner_id?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          team_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          created_by?: string | null
          estimated_value?: number | null
          id?: string
          notes?: string | null
          owner_id?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          team_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          attendees: string[] | null
          created_at: string
          created_by: string | null
          description: string | null
          duration_minutes: number | null
          external_calendar_id: string | null
          external_calendar_provider: string | null
          id: string
          lead_id: string | null
          location: string | null
          notes: string | null
          owner_id: string | null
          scheduled_at: string
          status: Database["public"]["Enums"]["meeting_status"]
          team_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          attendees?: string[] | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          external_calendar_id?: string | null
          external_calendar_provider?: string | null
          id?: string
          lead_id?: string | null
          location?: string | null
          notes?: string | null
          owner_id?: string | null
          scheduled_at: string
          status?: Database["public"]["Enums"]["meeting_status"]
          team_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          attendees?: string[] | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          external_calendar_id?: string | null
          external_calendar_provider?: string | null
          id?: string
          lead_id?: string | null
          location?: string | null
          notes?: string | null
          owner_id?: string | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["meeting_status"]
          team_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean
          message: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          message?: string | null
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          message?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      payment_installments: {
        Row: {
          amount: number
          contract_payment_id: string
          created_at: string
          id: string
          note: string | null
          paid_at: string | null
          status: Database["public"]["Enums"]["installment_status"]
        }
        Insert: {
          amount: number
          contract_payment_id: string
          created_at?: string
          id?: string
          note?: string | null
          paid_at?: string | null
          status?: Database["public"]["Enums"]["installment_status"]
        }
        Update: {
          amount?: number
          contract_payment_id?: string
          created_at?: string
          id?: string
          note?: string | null
          paid_at?: string | null
          status?: Database["public"]["Enums"]["installment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "payment_installments_contract_payment_id_fkey"
            columns: ["contract_payment_id"]
            isOneToOne: false
            referencedRelation: "contract_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          action: string
          description: string | null
          id: string
          resource: string
        }
        Insert: {
          action: string
          description?: string | null
          id?: string
          resource: string
        }
        Update: {
          action?: string
          description?: string | null
          id?: string
          resource?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          job_title_id: string | null
          manager_id: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          job_title_id?: string | null
          manager_id?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          job_title_id?: string | null
          manager_id?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_profiles_job_title"
            columns: ["job_title_id"]
            isOneToOne: false
            referencedRelation: "job_titles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          budget: number | null
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          name: string
          owner_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          team_id: string | null
          updated_at: string
        }
        Insert: {
          budget?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          owner_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          budget?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          id: string
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
          scope: Database["public"]["Enums"]["permission_scope"]
        }
        Insert: {
          id?: string
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
          scope?: Database["public"]["Enums"]["permission_scope"]
        }
        Update: {
          id?: string
          permission_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          scope?: Database["public"]["Enums"]["permission_scope"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assignee_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          owner_id: string | null
          priority: Database["public"]["Enums"]["task_priority"]
          status: Database["public"]["Enums"]["task_status"]
          team_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          owner_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          team_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          owner_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          team_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string
          id: string
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      units: {
        Row: {
          area_sqm: number | null
          building_id: string
          contact_id: string | null
          contract_id: string | null
          created_at: string
          deal_id: string | null
          floor: number | null
          id: string
          price: number | null
          rooms: number | null
          specs: Json | null
          status: string
          type: Database["public"]["Enums"]["unit_type"]
          unit_number: string
          updated_at: string
        }
        Insert: {
          area_sqm?: number | null
          building_id: string
          contact_id?: string | null
          contract_id?: string | null
          created_at?: string
          deal_id?: string | null
          floor?: number | null
          id?: string
          price?: number | null
          rooms?: number | null
          specs?: Json | null
          status?: string
          type?: Database["public"]["Enums"]["unit_type"]
          unit_number: string
          updated_at?: string
        }
        Update: {
          area_sqm?: number | null
          building_id?: string
          contact_id?: string | null
          contract_id?: string | null
          created_at?: string
          deal_id?: string | null
          floor?: number | null
          id?: string
          price?: number | null
          rooms?: number | null
          specs?: Json | null
          status?: string
          type?: Database["public"]["Enums"]["unit_type"]
          unit_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workflow_run_steps: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["workflow_step_status"]
          workflow_run_id: string
          workflow_step_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["workflow_step_status"]
          workflow_run_id: string
          workflow_step_id: string
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["workflow_step_status"]
          workflow_run_id?: string
          workflow_step_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_run_steps_workflow_run_id_fkey"
            columns: ["workflow_run_id"]
            isOneToOne: false
            referencedRelation: "workflow_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_run_steps_workflow_step_id_fkey"
            columns: ["workflow_step_id"]
            isOneToOne: false
            referencedRelation: "workflow_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_runs: {
        Row: {
          created_at: string
          current_step_id: string | null
          entity_id: string
          id: string
          started_by: string | null
          status: string
          updated_at: string
          workflow_id: string
        }
        Insert: {
          created_at?: string
          current_step_id?: string | null
          entity_id: string
          id?: string
          started_by?: string | null
          status?: string
          updated_at?: string
          workflow_id: string
        }
        Update: {
          created_at?: string
          current_step_id?: string | null
          entity_id?: string
          id?: string
          started_by?: string | null
          status?: string
          updated_at?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_runs_current_step_id_fkey"
            columns: ["current_step_id"]
            isOneToOne: false
            referencedRelation: "workflow_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_runs_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_steps: {
        Row: {
          conditions: Json | null
          created_at: string
          description: string | null
          id: string
          is_required: boolean
          name: string
          step_order: number
          workflow_id: string
        }
        Insert: {
          conditions?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_required?: boolean
          name: string
          step_order: number
          workflow_id: string
        }
        Update: {
          conditions?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_required?: boolean
          name?: string
          step_order?: number
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_steps_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflows: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          entity_type: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          entity_type: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          entity_type?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "user"
      audit_action:
        | "created"
        | "updated"
        | "deleted"
        | "status_changed"
        | "payment_received"
        | "assigned"
        | "linked"
        | "unlinked"
      commission_status: "pending" | "approved" | "paid"
      contact_type: "person" | "company"
      contract_status: "draft" | "active" | "completed" | "cancelled"
      deal_status: "negotiation" | "proposal" | "won" | "lost"
      installment_status: "planned" | "paid" | "failed"
      lead_status: "new" | "contacted" | "qualified" | "unqualified"
      meeting_status: "scheduled" | "completed" | "cancelled"
      notification_type: "info" | "warning" | "action_required" | "reminder"
      payment_milestone: "act14" | "act15" | "act16"
      payment_status: "planned" | "partially_paid" | "paid" | "overdue"
      permission_scope: "self" | "team" | "all"
      project_status:
        | "planning"
        | "in_progress"
        | "on_hold"
        | "completed"
        | "cancelled"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status: "todo" | "in_progress" | "done" | "cancelled"
      unit_type:
        | "apartment"
        | "office"
        | "parking_inside"
        | "parking_outside"
        | "garage"
      workflow_step_status: "pending" | "in_progress" | "completed" | "skipped"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "manager", "user"],
      audit_action: [
        "created",
        "updated",
        "deleted",
        "status_changed",
        "payment_received",
        "assigned",
        "linked",
        "unlinked",
      ],
      commission_status: ["pending", "approved", "paid"],
      contact_type: ["person", "company"],
      contract_status: ["draft", "active", "completed", "cancelled"],
      deal_status: ["negotiation", "proposal", "won", "lost"],
      installment_status: ["planned", "paid", "failed"],
      lead_status: ["new", "contacted", "qualified", "unqualified"],
      meeting_status: ["scheduled", "completed", "cancelled"],
      notification_type: ["info", "warning", "action_required", "reminder"],
      payment_milestone: ["act14", "act15", "act16"],
      payment_status: ["planned", "partially_paid", "paid", "overdue"],
      permission_scope: ["self", "team", "all"],
      project_status: [
        "planning",
        "in_progress",
        "on_hold",
        "completed",
        "cancelled",
      ],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: ["todo", "in_progress", "done", "cancelled"],
      unit_type: [
        "apartment",
        "office",
        "parking_inside",
        "parking_outside",
        "garage",
      ],
      workflow_step_status: ["pending", "in_progress", "completed", "skipped"],
    },
  },
} as const
