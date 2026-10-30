// Generated from the database schema by `npm run db:types` (supabase gen types). Do not edit by hand.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "admin_tasks": {
                  Row: {
                    "assigned_to_id": string | null,"created_at": string | null,"due_date": string | null,"id": string,"notes": string | null,"status": string | null,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "assigned_to_id"?: string | null,"created_at"?: string | null,"due_date"?: string | null,"id"?: string,"notes"?: string | null,"status"?: string | null,"title": string
                  }
                  Update: {
                    "assigned_to_id"?: string | null,"created_at"?: string | null,"due_date"?: string | null,"id"?: string,"notes"?: string | null,"status"?: string | null,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "admin_tasks_assigned_to_id_fkey"
      columns: ["assigned_to_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"analytics_events": {
                  Row: {
                    "created_at": string | null,"entity_id": string | null,"entity_type": string | null,"event_date": string | null,"event_type": string,"id": string,"metadata": Json | null,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"entity_id"?: string | null,"entity_type"?: string | null,"event_date"?: string | null,"event_type": string,"id"?: string,"metadata"?: Json | null,"user_id"?: string | null
                  }
                  Update: {
                    "created_at"?: string | null,"entity_id"?: string | null,"entity_type"?: string | null,"event_date"?: string | null,"event_type"?: string,"id"?: string,"metadata"?: Json | null,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "analytics_events_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"announcements": {
                  Row: {
                    "author_id": string | null,"author_name": string | null,"channels": (string)[] | null,"content": string,"created_at": string | null,"id": string,"recipients": string | null,"status": string | null,"title": string,"updated_at": string | null,"views": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id"?: string | null,"author_name"?: string | null,"channels"?: (string)[] | null,"content": string,"created_at"?: string | null,"id"?: string,"recipients"?: string | null,"status"?: string | null,"title": string,"updated_at"?: string | null,"views"?: number | null
                  }
                  Update: {
                    "author_id"?: string | null,"author_name"?: string | null,"channels"?: (string)[] | null,"content"?: string,"created_at"?: string | null,"id"?: string,"recipients"?: string | null,"status"?: string | null,"title"?: string,"updated_at"?: string | null,"views"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "announcements_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"attendance_records": {
                  Row: {
                    "attendance_date": string,"created_at": string | null,"event_id": string | null,"event_type": string,"id": string,"member_id": string,"notes": string | null,"recorded_by_id": string,"status": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "attendance_date": string,"created_at"?: string | null,"event_id"?: string | null,"event_type": string,"id"?: string,"member_id": string,"notes"?: string | null,"recorded_by_id"?: string,"status"?: string | null
                  }
                  Update: {
                    "attendance_date"?: string,"created_at"?: string | null,"event_id"?: string | null,"event_type"?: string,"id"?: string,"member_id"?: string,"notes"?: string | null,"recorded_by_id"?: string,"status"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "attendance_records_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "events"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "attendance_records_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "attendance_records_recorded_by_id_fkey"
      columns: ["recorded_by_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"audit_log": {
                  Row: {
                    "action": string,"created_at": string | null,"details": Json | null,"id": string,"ip_address": string | null,"resource_id": string | null,"resource_type": string,"user_email": string | null,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"created_at"?: string | null,"details"?: Json | null,"id"?: string,"ip_address"?: string | null,"resource_id"?: string | null,"resource_type": string,"user_email"?: string | null,"user_id"?: string | null
                  }
                  Update: {
                    "action"?: string,"created_at"?: string | null,"details"?: Json | null,"id"?: string,"ip_address"?: string | null,"resource_id"?: string | null,"resource_type"?: string,"user_email"?: string | null,"user_id"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"baptisms": {
                  Row: {
                    "baptism_date": string,"created_at": string | null,"id": string,"location": string | null,"member_id": string,"notes": string | null,"officiating_elder_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "baptism_date": string,"created_at"?: string | null,"id"?: string,"location"?: string | null,"member_id": string,"notes"?: string | null,"officiating_elder_id"?: string | null
                  }
                  Update: {
                    "baptism_date"?: string,"created_at"?: string | null,"id"?: string,"location"?: string | null,"member_id"?: string,"notes"?: string | null,"officiating_elder_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "baptisms_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "baptisms_officiating_elder_id_fkey"
      columns: ["officiating_elder_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"charity_aid_requests": {
                  Row: {
                    "amount_requested": number | null,"created_at": string | null,"id": string,"member_id": string,"reason": string | null,"request_date": string | null,"reviewed_at": string | null,"reviewed_by_id": string | null,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount_requested"?: number | null,"created_at"?: string | null,"id"?: string,"member_id": string,"reason"?: string | null,"request_date"?: string | null,"reviewed_at"?: string | null,"reviewed_by_id"?: string | null,"status"?: string
                  }
                  Update: {
                    "amount_requested"?: number | null,"created_at"?: string | null,"id"?: string,"member_id"?: string,"reason"?: string | null,"request_date"?: string | null,"reviewed_at"?: string | null,"reviewed_by_id"?: string | null,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "charity_aid_requests_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "charity_aid_requests_reviewed_by_id_fkey"
      columns: ["reviewed_by_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"charity_distributions": {
                  Row: {
                    "amount": number,"created_at": string | null,"distributed_date": string,"id": string,"notes": string | null,"request_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount": number,"created_at"?: string | null,"distributed_date": string,"id"?: string,"notes"?: string | null,"request_id": string
                  }
                  Update: {
                    "amount"?: number,"created_at"?: string | null,"distributed_date"?: string,"id"?: string,"notes"?: string | null,"request_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "charity_distributions_request_id_fkey"
      columns: ["request_id"]
isOneToOne: false
      referencedRelation: "charity_aid_requests"
      referencedColumns: ["id"]
    }
                  ]
                },"children_attendance": {
                  Row: {
                    "attendance_date": string,"class_id": string,"id": string,"member_id": string,"status": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "attendance_date": string,"class_id": string,"id"?: string,"member_id": string,"status"?: string | null
                  }
                  Update: {
                    "attendance_date"?: string,"class_id"?: string,"id"?: string,"member_id"?: string,"status"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "children_attendance_class_id_fkey"
      columns: ["class_id"]
isOneToOne: false
      referencedRelation: "children_classes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "children_attendance_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"children_class_teachers": {
                  Row: {
                    "class_id": string,"id": string,"member_id": string,"role": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "class_id": string,"id"?: string,"member_id": string,"role"?: string | null
                  }
                  Update: {
                    "class_id"?: string,"id"?: string,"member_id"?: string,"role"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "children_class_teachers_class_id_fkey"
      columns: ["class_id"]
isOneToOne: false
      referencedRelation: "children_classes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "children_class_teachers_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"children_classes": {
                  Row: {
                    "age_group": string | null,"created_at": string | null,"id": string,"location": string | null,"name": string,"schedule_text": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "age_group"?: string | null,"created_at"?: string | null,"id"?: string,"location"?: string | null,"name": string,"schedule_text"?: string | null
                  }
                  Update: {
                    "age_group"?: string | null,"created_at"?: string | null,"id"?: string,"location"?: string | null,"name"?: string,"schedule_text"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"children_curriculum": {
                  Row: {
                    "class_id": string | null,"created_at": string | null,"description": string | null,"id": string,"title": string,"url": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "class_id"?: string | null,"created_at"?: string | null,"description"?: string | null,"id"?: string,"title": string,"url"?: string | null
                  }
                  Update: {
                    "class_id"?: string | null,"created_at"?: string | null,"description"?: string | null,"id"?: string,"title"?: string,"url"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "children_curriculum_class_id_fkey"
      columns: ["class_id"]
isOneToOne: false
      referencedRelation: "children_classes"
      referencedColumns: ["id"]
    }
                  ]
                },"choir_members": {
                  Row: {
                    "created_at": string | null,"id": string,"is_active": boolean | null,"join_date": string | null,"member_id": string,"voice_part": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"id"?: string,"is_active"?: boolean | null,"join_date"?: string | null,"member_id": string,"voice_part"?: string | null
                  }
                  Update: {
                    "created_at"?: string | null,"id"?: string,"is_active"?: boolean | null,"join_date"?: string | null,"member_id"?: string,"voice_part"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "choir_members_member_id_fkey"
      columns: ["member_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"choir_schedule": {
                  Row: {
                    "created_at": string | null,"event_date": string,"event_type": string | null,"id": string,"location": string | null,"notes": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"event_date": string,"event_type"?: string | null,"id"?: string,"location"?: string | null,"notes"?: string | null
                  }
                  Update: {
                    "created_at"?: string | null,"event_date"?: string,"event_type"?: string | null,"id"?: string,"location"?: string | null,"notes"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"choir_songs": {
                  Row: {
                    "composer": string | null,"created_at": string | null,"id": string,"lyrics_url": string | null,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "composer"?: string | null,"created_at"?: string | null,"id"?: string,"lyrics_url"?: string | null,"title": string
                  }
                  Update: {
                    "composer"?: string | null,"created_at"?: string | null,"id"?: string,"lyrics_url"?: string | null,"title"?: string
                  }
                  Relationships: [
                    
                  ]
                },"church_settings": {
                  Row: {
                    "key": string,"updated_at": string,"value": string
                  }
                  ComputedFields: never
                  Insert: {
                    "key": string,"updated_at"?: string,"value"?: string
                  }
                  Update: {
                    "key"?: string,"updated_at"?: string,"value"?: string
                  }
                  Relationships: [
                    
                  ]
                },"committee_meetings": {
                  Row: {
                    "agenda": string | null,"attendees_count": number | null,"committee_id": string,"created_at": string | null,"id": string,"location": string | null,"meeting_date": string,"minutes": string | null,"updated_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "agenda"?: string | null,"attendees_count"?: number | null,"committee_id": string,"created_at"?: string | null,"id"?: string,"location"?: string | null,"meeting_date": string,"minutes"?: string | null,"updated_at"?: string | null
                  }
                  Update: {
                    "agenda"?: string | null,"attendees_count"?: number | null,"committee_id"?: string,"created_at"?: string | null,"id"?: string,"location"?: string | null,"meeting_date"?: string,"minutes"?: string | null,"updated_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "committee_meetings_committee_id_fkey"
      columns: ["committee_id"]
isOneToOne: false
      referencedRelation: "committees"
      referencedColumns: ["id"]
    }
                  ]
                },"committee_members": {
                  Row: {
                    "committee_id": string,"created_at": string | null,"id": string,"is_active": boolean | null,"joined_date": string | null,"member_id": string,"position": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "committee_id": string,"created_at"?: string | null,"id"?: string,"is_active"?: boolean | null,"joined_date"?: string | null,"member_id": string,"position"?: string | null
                  }
                  Update: {
                    "committee_id"?: string,"created_at"?: string | null,"id"?: string,"is_active"?: boolean | null,"joined_date"?: string | null,"member_id"?: string,"position"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "committee_members_committee_id_fkey"
      columns: ["committee_id"]
isOneToOne: false
      referencedRelation: "committees"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "committee_members_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"committees": {
                  Row: {
                    "chairman_id": string | null,"created_at": string | null,"description": string | null,"established_date": string | null,"id": string,"is_active": boolean | null,"name": string,"secretary_id": string | null,"updated_at": string | null,"vice_chairman_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "chairman_id"?: string | null,"created_at"?: string | null,"description"?: string | null,"established_date"?: string | null,"id"?: string,"is_active"?: boolean | null,"name": string,"secretary_id"?: string | null,"updated_at"?: string | null,"vice_chairman_id"?: string | null
                  }
                  Update: {
                    "chairman_id"?: string | null,"created_at"?: string | null,"description"?: string | null,"established_date"?: string | null,"id"?: string,"is_active"?: boolean | null,"name"?: string,"secretary_id"?: string | null,"updated_at"?: string | null,"vice_chairman_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "committees_chairman_id_fkey"
      columns: ["chairman_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "committees_secretary_id_fkey"
      columns: ["secretary_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "committees_vice_chairman_id_fkey"
      columns: ["vice_chairman_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"community_projects": {
                  Row: {
                    "budget": number | null,"coordinator_id": string | null,"created_at": string | null,"description": string | null,"end_date": string | null,"id": string,"is_active": boolean | null,"location": string | null,"project_status": string | null,"start_date": string,"target_beneficiaries": number | null,"title": string,"updated_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "budget"?: number | null,"coordinator_id"?: string | null,"created_at"?: string | null,"description"?: string | null,"end_date"?: string | null,"id"?: string,"is_active"?: boolean | null,"location"?: string | null,"project_status"?: string | null,"start_date": string,"target_beneficiaries"?: number | null,"title": string,"updated_at"?: string | null
                  }
                  Update: {
                    "budget"?: number | null,"coordinator_id"?: string | null,"created_at"?: string | null,"description"?: string | null,"end_date"?: string | null,"id"?: string,"is_active"?: boolean | null,"location"?: string | null,"project_status"?: string | null,"start_date"?: string,"target_beneficiaries"?: number | null,"title"?: string,"updated_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "community_projects_coordinator_id_fkey"
      columns: ["coordinator_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"community_volunteers": {
                  Row: {
                    "created_at": string | null,"hours_contributed": number | null,"id": string,"member_id": string,"project_id": string,"role": string | null,"volunteer_date": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"hours_contributed"?: number | null,"id"?: string,"member_id": string,"project_id": string,"role"?: string | null,"volunteer_date"?: string | null
                  }
                  Update: {
                    "created_at"?: string | null,"hours_contributed"?: number | null,"id"?: string,"member_id"?: string,"project_id"?: string,"role"?: string | null,"volunteer_date"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "community_volunteers_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "community_volunteers_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "community_projects"
      referencedColumns: ["id"]
    }
                  ]
                },"counseling_services": {
                  Row: {
                    "counselor_id": string,"created_at": string | null,"duration_minutes": number | null,"follow_up_date": string | null,"id": string,"member_id": string,"session_date": string,"session_notes": string | null,"session_type": string,"status": string | null,"updated_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "counselor_id": string,"created_at"?: string | null,"duration_minutes"?: number | null,"follow_up_date"?: string | null,"id"?: string,"member_id": string,"session_date": string,"session_notes"?: string | null,"session_type": string,"status"?: string | null,"updated_at"?: string | null
                  }
                  Update: {
                    "counselor_id"?: string,"created_at"?: string | null,"duration_minutes"?: number | null,"follow_up_date"?: string | null,"id"?: string,"member_id"?: string,"session_date"?: string,"session_notes"?: string | null,"session_type"?: string,"status"?: string | null,"updated_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "counseling_services_counselor_id_fkey"
      columns: ["counselor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "counseling_services_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"custom_reports": {
                  Row: {
                    "created_at": string | null,"created_by_id": string,"description": string | null,"file_url": string | null,"filters": Json | null,"generated_date": string | null,"id": string,"is_scheduled": boolean | null,"report_type": string,"schedule_frequency": string | null,"title": string,"updated_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"created_by_id": string,"description"?: string | null,"file_url"?: string | null,"filters"?: Json | null,"generated_date"?: string | null,"id"?: string,"is_scheduled"?: boolean | null,"report_type": string,"schedule_frequency"?: string | null,"title": string,"updated_at"?: string | null
                  }
                  Update: {
                    "created_at"?: string | null,"created_by_id"?: string,"description"?: string | null,"file_url"?: string | null,"filters"?: Json | null,"generated_date"?: string | null,"id"?: string,"is_scheduled"?: boolean | null,"report_type"?: string,"schedule_frequency"?: string | null,"title"?: string,"updated_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "custom_reports_created_by_id_fkey"
      columns: ["created_by_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"deacon_care_visits": {
                  Row: {
                    "created_at": string | null,"id": string,"member_id": string,"notes": string | null,"visit_date": string,"visitor_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"id"?: string,"member_id": string,"notes"?: string | null,"visit_date": string,"visitor_id": string
                  }
                  Update: {
                    "created_at"?: string | null,"id"?: string,"member_id"?: string,"notes"?: string | null,"visit_date"?: string,"visitor_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "deacon_care_visits_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "deacon_care_visits_visitor_id_fkey"
      columns: ["visitor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"deacon_support_cases": {
                  Row: {
                    "assigned_deacon_id": string | null,"case_type": string | null,"created_at": string | null,"description": string,"id": string,"member_id": string,"status": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "assigned_deacon_id"?: string | null,"case_type"?: string | null,"created_at"?: string | null,"description": string,"id"?: string,"member_id": string,"status"?: string | null
                  }
                  Update: {
                    "assigned_deacon_id"?: string | null,"case_type"?: string | null,"created_at"?: string | null,"description"?: string,"id"?: string,"member_id"?: string,"status"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "deacon_support_cases_assigned_deacon_id_fkey"
      columns: ["assigned_deacon_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "deacon_support_cases_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"documents": {
                  Row: {
                    "access_level": string | null,"category": string | null,"content_type": string | null,"created_at": string | null,"file_path": string,"file_size_bytes": number | null,"id": string,"name": string,"updated_at": string | null,"uploaded_by_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "access_level"?: string | null,"category"?: string | null,"content_type"?: string | null,"created_at"?: string | null,"file_path": string,"file_size_bytes"?: number | null,"id"?: string,"name": string,"updated_at"?: string | null,"uploaded_by_id"?: string | null
                  }
                  Update: {
                    "access_level"?: string | null,"category"?: string | null,"content_type"?: string | null,"created_at"?: string | null,"file_path"?: string,"file_size_bytes"?: number | null,"id"?: string,"name"?: string,"updated_at"?: string | null,"uploaded_by_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "documents_uploaded_by_id_fkey"
      columns: ["uploaded_by_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"education_enrollments": {
                  Row: {
                    "completion_date": string | null,"created_at": string | null,"enrollment_date": string | null,"grade": string | null,"id": string,"member_id": string,"program_id": string,"status": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "completion_date"?: string | null,"created_at"?: string | null,"enrollment_date"?: string | null,"grade"?: string | null,"id"?: string,"member_id": string,"program_id": string,"status"?: string | null
                  }
                  Update: {
                    "completion_date"?: string | null,"created_at"?: string | null,"enrollment_date"?: string | null,"grade"?: string | null,"id"?: string,"member_id"?: string,"program_id"?: string,"status"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "education_enrollments_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "education_enrollments_program_id_fkey"
      columns: ["program_id"]
isOneToOne: false
      referencedRelation: "education_programs"
      referencedColumns: ["id"]
    }
                  ]
                },"education_programs": {
                  Row: {
                    "created_at": string | null,"curriculum_url": string | null,"description": string | null,"duration_weeks": number | null,"end_date": string | null,"id": string,"instructor_id": string | null,"is_active": boolean | null,"location": string | null,"max_capacity": number | null,"program_type": string | null,"start_date": string,"title": string,"updated_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"curriculum_url"?: string | null,"description"?: string | null,"duration_weeks"?: number | null,"end_date"?: string | null,"id"?: string,"instructor_id"?: string | null,"is_active"?: boolean | null,"location"?: string | null,"max_capacity"?: number | null,"program_type"?: string | null,"start_date": string,"title": string,"updated_at"?: string | null
                  }
                  Update: {
                    "created_at"?: string | null,"curriculum_url"?: string | null,"description"?: string | null,"duration_weeks"?: number | null,"end_date"?: string | null,"id"?: string,"instructor_id"?: string | null,"is_active"?: boolean | null,"location"?: string | null,"max_capacity"?: number | null,"program_type"?: string | null,"start_date"?: string,"title"?: string,"updated_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "education_programs_instructor_id_fkey"
      columns: ["instructor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"events": {
                  Row: {
                    "created_at": string | null,"description": string | null,"end_date": string | null,"event_date": string | null,"event_time": string | null,"event_type": string,"id": string,"is_active": boolean | null,"location": string | null,"max_attendees": number | null,"ministry_id": string | null,"organizer_id": string,"start_date": string,"title": string,"updated_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"description"?: string | null,"end_date"?: string | null,"event_date"?: string | null,"event_time"?: string | null,"event_type": string,"id"?: string,"is_active"?: boolean | null,"location"?: string | null,"max_attendees"?: number | null,"ministry_id"?: string | null,"organizer_id"?: string,"start_date": string,"title": string,"updated_at"?: string | null
                  }
                  Update: {
                    "created_at"?: string | null,"description"?: string | null,"end_date"?: string | null,"event_date"?: string | null,"event_time"?: string | null,"event_type"?: string,"id"?: string,"is_active"?: boolean | null,"location"?: string | null,"max_attendees"?: number | null,"ministry_id"?: string | null,"organizer_id"?: string,"start_date"?: string,"title"?: string,"updated_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "events_ministry_id_fkey"
      columns: ["ministry_id"]
isOneToOne: false
      referencedRelation: "ministries"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "events_organizer_id_fkey"
      columns: ["organizer_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"facilities": {
                  Row: {
                    "building_number": string | null,"capacity": number | null,"created_at": string | null,"description": string | null,"id": string,"is_active": boolean | null,"location": string | null,"manager_id": string | null,"name": string,"updated_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "building_number"?: string | null,"capacity"?: number | null,"created_at"?: string | null,"description"?: string | null,"id"?: string,"is_active"?: boolean | null,"location"?: string | null,"manager_id"?: string | null,"name": string,"updated_at"?: string | null
                  }
                  Update: {
                    "building_number"?: string | null,"capacity"?: number | null,"created_at"?: string | null,"description"?: string | null,"id"?: string,"is_active"?: boolean | null,"location"?: string | null,"manager_id"?: string | null,"name"?: string,"updated_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "facilities_manager_id_fkey"
      columns: ["manager_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"facility_bookings": {
                  Row: {
                    "booked_by_id": string,"booking_date": string,"created_at": string | null,"end_time": string | null,"expected_attendees": number | null,"facility_id": string,"id": string,"purpose": string | null,"start_time": string | null,"status": string | null,"updated_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "booked_by_id": string,"booking_date": string,"created_at"?: string | null,"end_time"?: string | null,"expected_attendees"?: number | null,"facility_id": string,"id"?: string,"purpose"?: string | null,"start_time"?: string | null,"status"?: string | null,"updated_at"?: string | null
                  }
                  Update: {
                    "booked_by_id"?: string,"booking_date"?: string,"created_at"?: string | null,"end_time"?: string | null,"expected_attendees"?: number | null,"facility_id"?: string,"id"?: string,"purpose"?: string | null,"start_time"?: string | null,"status"?: string | null,"updated_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "facility_bookings_booked_by_id_fkey"
      columns: ["booked_by_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "facility_bookings_facility_id_fkey"
      columns: ["facility_id"]
isOneToOne: false
      referencedRelation: "facilities"
      referencedColumns: ["id"]
    }
                  ]
                },"facility_maintenance": {
                  Row: {
                    "completed_date": string | null,"contractor_name": string | null,"cost": number | null,"created_at": string | null,"description": string | null,"facility_id": string,"id": string,"maintenance_type": string,"scheduled_date": string | null,"status": string | null,"updated_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "completed_date"?: string | null,"contractor_name"?: string | null,"cost"?: number | null,"created_at"?: string | null,"description"?: string | null,"facility_id": string,"id"?: string,"maintenance_type": string,"scheduled_date"?: string | null,"status"?: string | null,"updated_at"?: string | null
                  }
                  Update: {
                    "completed_date"?: string | null,"contractor_name"?: string | null,"cost"?: number | null,"created_at"?: string | null,"description"?: string | null,"facility_id"?: string,"id"?: string,"maintenance_type"?: string,"scheduled_date"?: string | null,"status"?: string | null,"updated_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "facility_maintenance_facility_id_fkey"
      columns: ["facility_id"]
isOneToOne: false
      referencedRelation: "facilities"
      referencedColumns: ["id"]
    }
                  ]
                },"financial_transactions": {
                  Row: {
                    "amount": number,"category": string | null,"created_at": string | null,"currency": string | null,"description": string | null,"id": string,"member_id": string | null,"notes": string | null,"receipt_url": string | null,"recorded_by_id": string,"transaction_date": string | null,"transaction_type": string,"updated_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "amount": number,"category"?: string | null,"created_at"?: string | null,"currency"?: string | null,"description"?: string | null,"id"?: string,"member_id"?: string | null,"notes"?: string | null,"receipt_url"?: string | null,"recorded_by_id"?: string,"transaction_date"?: string | null,"transaction_type": string,"updated_at"?: string | null
                  }
                  Update: {
                    "amount"?: number,"category"?: string | null,"created_at"?: string | null,"currency"?: string | null,"description"?: string | null,"id"?: string,"member_id"?: string | null,"notes"?: string | null,"receipt_url"?: string | null,"recorded_by_id"?: string,"transaction_date"?: string | null,"transaction_type"?: string,"updated_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "financial_transactions_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "financial_transactions_recorded_by_id_fkey"
      columns: ["recorded_by_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"health_programs": {
                  Row: {
                    "coordinator_id": string | null,"created_at": string | null,"description": string | null,"id": string,"is_active": boolean | null,"location": string | null,"max_participants": number | null,"participants_count": number | null,"program_date": string,"program_type": string | null,"title": string,"updated_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "coordinator_id"?: string | null,"created_at"?: string | null,"description"?: string | null,"id"?: string,"is_active"?: boolean | null,"location"?: string | null,"max_participants"?: number | null,"participants_count"?: number | null,"program_date": string,"program_type"?: string | null,"title": string,"updated_at"?: string | null
                  }
                  Update: {
                    "coordinator_id"?: string | null,"created_at"?: string | null,"description"?: string | null,"id"?: string,"is_active"?: boolean | null,"location"?: string | null,"max_participants"?: number | null,"participants_count"?: number | null,"program_date"?: string,"program_type"?: string | null,"title"?: string,"updated_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "health_programs_coordinator_id_fkey"
      columns: ["coordinator_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"marriage_seminars": {
                  Row: {
                    "created_at": string | null,"facilitator_id": string | null,"id": string,"location": string | null,"seminar_date": string | null,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"facilitator_id"?: string | null,"id"?: string,"location"?: string | null,"seminar_date"?: string | null,"title": string
                  }
                  Update: {
                    "created_at"?: string | null,"facilitator_id"?: string | null,"id"?: string,"location"?: string | null,"seminar_date"?: string | null,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "marriage_seminars_facilitator_id_fkey"
      columns: ["facilitator_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"media_content": {
                  Row: {
                    "content_type": string,"created_at": string | null,"created_by_id": string,"description": string | null,"id": string,"is_published": boolean | null,"media_url": string | null,"published_date": string | null,"thumbnail_url": string | null,"title": string,"updated_at": string | null,"views_count": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "content_type": string,"created_at"?: string | null,"created_by_id": string,"description"?: string | null,"id"?: string,"is_published"?: boolean | null,"media_url"?: string | null,"published_date"?: string | null,"thumbnail_url"?: string | null,"title": string,"updated_at"?: string | null,"views_count"?: number | null
                  }
                  Update: {
                    "content_type"?: string,"created_at"?: string | null,"created_by_id"?: string,"description"?: string | null,"id"?: string,"is_published"?: boolean | null,"media_url"?: string | null,"published_date"?: string | null,"thumbnail_url"?: string | null,"title"?: string,"updated_at"?: string | null,"views_count"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "media_content_created_by_id_fkey"
      columns: ["created_by_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"member_details": {
                  Row: {
                    "area": string | null,"baptism_date": string | null,"baptized": boolean | null,"blood_group": string | null,"children": NonNullable<Json>,"children_count": number | null,"church_standing": string,"created_at": string,"created_by": string | null,"departments": (string)[],"education_level": string | null,"emergency_name": string | null,"emergency_phone": string | null,"emergency_relationship": string | null,"grandfather_name": string | null,"house_number": string | null,"household": NonNullable<Json>,"marital_status": string | null,"member_id": string,"member_number": string,"member_since": string | null,"membership_status": string,"notes": string | null,"occupation": string | null,"phone2": string | null,"photo_path": string | null,"previous_church": string | null,"spouse_age": number | null,"spouse_member_id": string | null,"spouse_name": string | null,"spouse_phone": string | null,"subcity": string | null,"updated_at": string,"wants_department": string | null,"woreda": string | null,"workplace": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "area"?: string | null,"baptism_date"?: string | null,"baptized"?: boolean | null,"blood_group"?: string | null,"children"?: NonNullable<Json>,"children_count"?: number | null,"church_standing"?: string,"created_at"?: string,"created_by"?: string | null,"departments"?: (string)[],"education_level"?: string | null,"emergency_name"?: string | null,"emergency_phone"?: string | null,"emergency_relationship"?: string | null,"grandfather_name"?: string | null,"house_number"?: string | null,"household"?: NonNullable<Json>,"marital_status"?: string | null,"member_id": string,"member_number"?: string,"member_since"?: string | null,"membership_status"?: string,"notes"?: string | null,"occupation"?: string | null,"phone2"?: string | null,"photo_path"?: string | null,"previous_church"?: string | null,"spouse_age"?: number | null,"spouse_member_id"?: string | null,"spouse_name"?: string | null,"spouse_phone"?: string | null,"subcity"?: string | null,"updated_at"?: string,"wants_department"?: string | null,"woreda"?: string | null,"workplace"?: string | null
                  }
                  Update: {
                    "area"?: string | null,"baptism_date"?: string | null,"baptized"?: boolean | null,"blood_group"?: string | null,"children"?: NonNullable<Json>,"children_count"?: number | null,"church_standing"?: string,"created_at"?: string,"created_by"?: string | null,"departments"?: (string)[],"education_level"?: string | null,"emergency_name"?: string | null,"emergency_phone"?: string | null,"emergency_relationship"?: string | null,"grandfather_name"?: string | null,"house_number"?: string | null,"household"?: NonNullable<Json>,"marital_status"?: string | null,"member_id"?: string,"member_number"?: string,"member_since"?: string | null,"membership_status"?: string,"notes"?: string | null,"occupation"?: string | null,"phone2"?: string | null,"photo_path"?: string | null,"previous_church"?: string | null,"spouse_age"?: number | null,"spouse_member_id"?: string | null,"spouse_name"?: string | null,"spouse_phone"?: string | null,"subcity"?: string | null,"updated_at"?: string,"wants_department"?: string | null,"woreda"?: string | null,"workplace"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "member_details_member_id_fkey"
      columns: ["member_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "member_details_spouse_member_id_fkey"
      columns: ["spouse_member_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"message_templates": {
                  Row: {
                    "body": string,"created_at": string | null,"id": string,"name": string,"title": string | null,"updated_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"created_at"?: string | null,"id"?: string,"name": string,"title"?: string | null,"updated_at"?: string | null
                  }
                  Update: {
                    "body"?: string,"created_at"?: string | null,"id"?: string,"name"?: string,"title"?: string | null,"updated_at"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"ministries": {
                  Row: {
                    "created_at": string | null,"description": string | null,"id": string,"is_active": boolean | null,"leader_id": string | null,"location": string | null,"meeting_day": string | null,"meeting_time": string | null,"name": string,"updated_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"description"?: string | null,"id"?: string,"is_active"?: boolean | null,"leader_id"?: string | null,"location"?: string | null,"meeting_day"?: string | null,"meeting_time"?: string | null,"name": string,"updated_at"?: string | null
                  }
                  Update: {
                    "created_at"?: string | null,"description"?: string | null,"id"?: string,"is_active"?: boolean | null,"leader_id"?: string | null,"location"?: string | null,"meeting_day"?: string | null,"meeting_time"?: string | null,"name"?: string,"updated_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "ministries_leader_id_fkey"
      columns: ["leader_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"ministry_members": {
                  Row: {
                    "created_at": string | null,"id": string,"is_active": boolean | null,"joined_date": string | null,"member_id": string,"ministry_id": string,"role": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"id"?: string,"is_active"?: boolean | null,"joined_date"?: string | null,"member_id": string,"ministry_id": string,"role"?: string | null
                  }
                  Update: {
                    "created_at"?: string | null,"id"?: string,"is_active"?: boolean | null,"joined_date"?: string | null,"member_id"?: string,"ministry_id"?: string,"role"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "ministry_members_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ministry_members_ministry_id_fkey"
      columns: ["ministry_id"]
isOneToOne: false
      referencedRelation: "ministries"
      referencedColumns: ["id"]
    }
                  ]
                },"mission_reports": {
                  Row: {
                    "created_at": string | null,"created_by_id": string | null,"id": string,"report_date": string | null,"report_text": string,"trip_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"created_by_id"?: string | null,"id"?: string,"report_date"?: string | null,"report_text": string,"trip_id": string
                  }
                  Update: {
                    "created_at"?: string | null,"created_by_id"?: string | null,"id"?: string,"report_date"?: string | null,"report_text"?: string,"trip_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "mission_reports_created_by_id_fkey"
      columns: ["created_by_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "mission_reports_trip_id_fkey"
      columns: ["trip_id"]
isOneToOne: false
      referencedRelation: "mission_trips"
      referencedColumns: ["id"]
    }
                  ]
                },"mission_trip_participants": {
                  Row: {
                    "id": string,"member_id": string,"role": string | null,"trip_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"member_id": string,"role"?: string | null,"trip_id": string
                  }
                  Update: {
                    "id"?: string,"member_id"?: string,"role"?: string | null,"trip_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "mission_trip_participants_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "mission_trip_participants_trip_id_fkey"
      columns: ["trip_id"]
isOneToOne: false
      referencedRelation: "mission_trips"
      referencedColumns: ["id"]
    }
                  ]
                },"mission_trips": {
                  Row: {
                    "created_at": string | null,"description": string | null,"id": string,"location": string | null,"status": string | null,"title": string,"trip_date": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"description"?: string | null,"id"?: string,"location"?: string | null,"status"?: string | null,"title": string,"trip_date"?: string | null
                  }
                  Update: {
                    "created_at"?: string | null,"description"?: string | null,"id"?: string,"location"?: string | null,"status"?: string | null,"title"?: string,"trip_date"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"monthly_statistics": {
                  Row: {
                    "active_members": number | null,"average_attendance": number | null,"created_at": string | null,"events_held": number | null,"id": string,"month": number,"new_members_count": number | null,"total_donations": number | null,"total_expenses": number | null,"total_members": number | null,"year": number
                  }
                  ComputedFields: never
                  Insert: {
                    "active_members"?: number | null,"average_attendance"?: number | null,"created_at"?: string | null,"events_held"?: number | null,"id"?: string,"month": number,"new_members_count"?: number | null,"total_donations"?: number | null,"total_expenses"?: number | null,"total_members"?: number | null,"year": number
                  }
                  Update: {
                    "active_members"?: number | null,"average_attendance"?: number | null,"created_at"?: string | null,"events_held"?: number | null,"id"?: string,"month"?: number,"new_members_count"?: number | null,"total_donations"?: number | null,"total_expenses"?: number | null,"total_members"?: number | null,"year"?: number
                  }
                  Relationships: [
                    
                  ]
                },"music_team_members": {
                  Row: {
                    "created_at": string | null,"id": string,"instrument": string,"is_active": boolean | null,"joined_date": string | null,"member_id": string,"skill_level": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"id"?: string,"instrument": string,"is_active"?: boolean | null,"joined_date"?: string | null,"member_id": string,"skill_level"?: string | null
                  }
                  Update: {
                    "created_at"?: string | null,"id"?: string,"instrument"?: string,"is_active"?: boolean | null,"joined_date"?: string | null,"member_id"?: string,"skill_level"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "music_team_members_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"prayer_groups": {
                  Row: {
                    "created_at": string | null,"description": string | null,"id": string,"meeting_schedule": string | null,"name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"description"?: string | null,"id"?: string,"meeting_schedule"?: string | null,"name": string
                  }
                  Update: {
                    "created_at"?: string | null,"description"?: string | null,"id"?: string,"meeting_schedule"?: string | null,"name"?: string
                  }
                  Relationships: [
                    
                  ]
                },"prayer_requests": {
                  Row: {
                    "created_at": string | null,"group_id": string | null,"id": string,"request_text": string,"requested_by_id": string | null,"status": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"group_id"?: string | null,"id"?: string,"request_text": string,"requested_by_id"?: string | null,"status"?: string | null
                  }
                  Update: {
                    "created_at"?: string | null,"group_id"?: string | null,"id"?: string,"request_text"?: string,"requested_by_id"?: string | null,"status"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "prayer_requests_group_id_fkey"
      columns: ["group_id"]
isOneToOne: false
      referencedRelation: "prayer_groups"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "prayer_requests_requested_by_id_fkey"
      columns: ["requested_by_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "address": string | null,"city": string | null,"country": string | null,"created_at": string | null,"date_of_birth": string | null,"email": string | null,"first_name": string,"gender": string | null,"id": string,"is_active": boolean | null,"is_admin": boolean | null,"last_name": string,"phone": string | null,"profile_photo_url": string | null,"role": string,"updated_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "address"?: string | null,"city"?: string | null,"country"?: string | null,"created_at"?: string | null,"date_of_birth"?: string | null,"email"?: string | null,"first_name": string,"gender"?: string | null,"id"?: string,"is_active"?: boolean | null,"is_admin"?: boolean | null,"last_name": string,"phone"?: string | null,"profile_photo_url"?: string | null,"role"?: string,"updated_at"?: string | null
                  }
                  Update: {
                    "address"?: string | null,"city"?: string | null,"country"?: string | null,"created_at"?: string | null,"date_of_birth"?: string | null,"email"?: string | null,"first_name"?: string,"gender"?: string | null,"id"?: string,"is_active"?: boolean | null,"is_admin"?: boolean | null,"last_name"?: string,"phone"?: string | null,"profile_photo_url"?: string | null,"role"?: string,"updated_at"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"spiritual_candidates": {
                  Row: {
                    "baptism_date": string | null,"created_at": string | null,"id": string,"joined_date": string | null,"member_id": string,"mentor_id": string | null,"progress_notes": string | null,"status": string,"updated_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "baptism_date"?: string | null,"created_at"?: string | null,"id"?: string,"joined_date"?: string | null,"member_id": string,"mentor_id"?: string | null,"progress_notes"?: string | null,"status"?: string,"updated_at"?: string | null
                  }
                  Update: {
                    "baptism_date"?: string | null,"created_at"?: string | null,"id"?: string,"joined_date"?: string | null,"member_id"?: string,"mentor_id"?: string | null,"progress_notes"?: string | null,"status"?: string,"updated_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "spiritual_candidates_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "spiritual_candidates_mentor_id_fkey"
      columns: ["mentor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"spiritual_class_attendance": {
                  Row: {
                    "attended": boolean | null,"class_id": string,"id": string,"member_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "attended"?: boolean | null,"class_id": string,"id"?: string,"member_id": string
                  }
                  Update: {
                    "attended"?: boolean | null,"class_id"?: string,"id"?: string,"member_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "spiritual_class_attendance_class_id_fkey"
      columns: ["class_id"]
isOneToOne: false
      referencedRelation: "spiritual_classes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "spiritual_class_attendance_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"spiritual_classes": {
                  Row: {
                    "class_date": string,"created_at": string | null,"id": string,"instructor_id": string | null,"location": string | null,"max_attendees": number | null,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "class_date": string,"created_at"?: string | null,"id"?: string,"instructor_id"?: string | null,"location"?: string | null,"max_attendees"?: number | null,"title": string
                  }
                  Update: {
                    "class_date"?: string,"created_at"?: string | null,"id"?: string,"instructor_id"?: string | null,"location"?: string | null,"max_attendees"?: number | null,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "spiritual_classes_instructor_id_fkey"
      columns: ["instructor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"spiritual_follow_ups": {
                  Row: {
                    "created_at": string | null,"follow_up_type": string,"id": string,"last_contact_date": string | null,"member_id": string,"notes": string | null,"status": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"follow_up_type": string,"id"?: string,"last_contact_date"?: string | null,"member_id": string,"notes"?: string | null,"status"?: string | null
                  }
                  Update: {
                    "created_at"?: string | null,"follow_up_type"?: string,"id"?: string,"last_contact_date"?: string | null,"member_id"?: string,"notes"?: string | null,"status"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "spiritual_follow_ups_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"spiritual_services": {
                  Row: {
                    "attendees_count": number | null,"created_at": string | null,"description": string | null,"duration_minutes": number | null,"id": string,"location": string | null,"pastor_id": string | null,"recording_url": string | null,"sermon_notes": string | null,"sermon_topic": string | null,"service_date": string,"service_type": string,"title": string,"updated_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "attendees_count"?: number | null,"created_at"?: string | null,"description"?: string | null,"duration_minutes"?: number | null,"id"?: string,"location"?: string | null,"pastor_id"?: string | null,"recording_url"?: string | null,"sermon_notes"?: string | null,"sermon_topic"?: string | null,"service_date": string,"service_type": string,"title": string,"updated_at"?: string | null
                  }
                  Update: {
                    "attendees_count"?: number | null,"created_at"?: string | null,"description"?: string | null,"duration_minutes"?: number | null,"id"?: string,"location"?: string | null,"pastor_id"?: string | null,"recording_url"?: string | null,"sermon_notes"?: string | null,"sermon_topic"?: string | null,"service_date"?: string,"service_type"?: string,"title"?: string,"updated_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "spiritual_services_pastor_id_fkey"
      columns: ["pastor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"teaching_materials": {
                  Row: {
                    "created_at": string | null,"id": string,"material_type": string | null,"program_id": string,"title": string,"url": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"id"?: string,"material_type"?: string | null,"program_id": string,"title": string,"url"?: string | null
                  }
                  Update: {
                    "created_at"?: string | null,"id"?: string,"material_type"?: string | null,"program_id"?: string,"title"?: string,"url"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "teaching_materials_program_id_fkey"
      columns: ["program_id"]
isOneToOne: false
      referencedRelation: "education_programs"
      referencedColumns: ["id"]
    }
                  ]
                },"translations": {
                  Row: {
                    "created_at": string | null,"created_by_id": string | null,"id": string,"is_approved": boolean | null,"key": string,"language_code": string,"module_type": string,"translation_text": string,"updated_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"created_by_id"?: string | null,"id"?: string,"is_approved"?: boolean | null,"key": string,"language_code": string,"module_type": string,"translation_text": string,"updated_at"?: string | null
                  }
                  Update: {
                    "created_at"?: string | null,"created_by_id"?: string | null,"id"?: string,"is_approved"?: boolean | null,"key"?: string,"language_code"?: string,"module_type"?: string,"translation_text"?: string,"updated_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "translations_created_by_id_fkey"
      columns: ["created_by_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"user_preferences": {
                  Row: {
                    "created_at": string | null,"email_notifications": boolean | null,"id": string,"notifications_enabled": boolean | null,"preferred_language": string | null,"sms_notifications": boolean | null,"theme": string | null,"updated_at": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"email_notifications"?: boolean | null,"id"?: string,"notifications_enabled"?: boolean | null,"preferred_language"?: string | null,"sms_notifications"?: boolean | null,"theme"?: string | null,"updated_at"?: string | null,"user_id": string
                  }
                  Update: {
                    "created_at"?: string | null,"email_notifications"?: boolean | null,"id"?: string,"notifications_enabled"?: boolean | null,"preferred_language"?: string | null,"sms_notifications"?: boolean | null,"theme"?: string | null,"updated_at"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "user_preferences_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"women_activities": {
                  Row: {
                    "activity_date": string | null,"created_at": string | null,"id": string,"status": string | null,"title": string,"volunteers_count": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "activity_date"?: string | null,"created_at"?: string | null,"id"?: string,"status"?: string | null,"title": string,"volunteers_count"?: number | null
                  }
                  Update: {
                    "activity_date"?: string | null,"created_at"?: string | null,"id"?: string,"status"?: string | null,"title"?: string,"volunteers_count"?: number | null
                  }
                  Relationships: [
                    
                  ]
                },"women_meetings": {
                  Row: {
                    "attendees_count": number | null,"created_at": string | null,"id": string,"location": string | null,"meeting_date": string,"meeting_time": string | null,"minutes_text": string | null,"title": string,"updated_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "attendees_count"?: number | null,"created_at"?: string | null,"id"?: string,"location"?: string | null,"meeting_date": string,"meeting_time"?: string | null,"minutes_text"?: string | null,"title": string,"updated_at"?: string | null
                  }
                  Update: {
                    "attendees_count"?: number | null,"created_at"?: string | null,"id"?: string,"location"?: string | null,"meeting_date"?: string,"meeting_time"?: string | null,"minutes_text"?: string | null,"title"?: string,"updated_at"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"women_trainings": {
                  Row: {
                    "created_at": string | null,"description": string | null,"id": string,"instructor_name": string | null,"registered_count": number | null,"title": string,"training_date": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"description"?: string | null,"id"?: string,"instructor_name"?: string | null,"registered_count"?: number | null,"title": string,"training_date"?: string | null
                  }
                  Update: {
                    "created_at"?: string | null,"description"?: string | null,"id"?: string,"instructor_name"?: string | null,"registered_count"?: number | null,"title"?: string,"training_date"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"workers_aid_beneficiaries": {
                  Row: {
                    "created_at": string | null,"id": string,"member_id": string,"monthly_amount": number,"notes": string | null,"start_date": string,"status": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"id"?: string,"member_id": string,"monthly_amount": number,"notes"?: string | null,"start_date"?: string,"status"?: string | null
                  }
                  Update: {
                    "created_at"?: string | null,"id"?: string,"member_id"?: string,"monthly_amount"?: number,"notes"?: string | null,"start_date"?: string,"status"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "workers_aid_beneficiaries_member_id_fkey"
      columns: ["member_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"workers_aid_disbursements": {
                  Row: {
                    "amount": number,"beneficiary_id": string,"created_at": string | null,"disbursement_date": string,"id": string,"notes": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "amount": number,"beneficiary_id": string,"created_at"?: string | null,"disbursement_date": string,"id"?: string,"notes"?: string | null
                  }
                  Update: {
                    "amount"?: number,"beneficiary_id"?: string,"created_at"?: string | null,"disbursement_date"?: string,"id"?: string,"notes"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "workers_aid_disbursements_beneficiary_id_fkey"
      columns: ["beneficiary_id"]
isOneToOne: false
      referencedRelation: "workers_aid_beneficiaries"
      referencedColumns: ["id"]
    }
                  ]
                },"worship_equipment": {
                  Row: {
                    "created_at": string | null,"description": string | null,"id": string,"name": string,"status": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"description"?: string | null,"id"?: string,"name": string,"status"?: string | null
                  }
                  Update: {
                    "created_at"?: string | null,"description"?: string | null,"id"?: string,"name"?: string,"status"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"worship_events": {
                  Row: {
                    "created_at": string | null,"description": string | null,"event_date": string,"id": string,"location": string | null,"notes": string | null,"songs_list": string | null,"title": string,"updated_at": string | null,"worship_leader_id": string | null,"worship_type": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"description"?: string | null,"event_date": string,"id"?: string,"location"?: string | null,"notes"?: string | null,"songs_list"?: string | null,"title": string,"updated_at"?: string | null,"worship_leader_id"?: string | null,"worship_type"?: string | null
                  }
                  Update: {
                    "created_at"?: string | null,"description"?: string | null,"event_date"?: string,"id"?: string,"location"?: string | null,"notes"?: string | null,"songs_list"?: string | null,"title"?: string,"updated_at"?: string | null,"worship_leader_id"?: string | null,"worship_type"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "worship_events_worship_leader_id_fkey"
      columns: ["worship_leader_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"worship_rehearsals": {
                  Row: {
                    "created_at": string | null,"event_id": string | null,"id": string,"notes": string | null,"rehearsal_date": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"event_id"?: string | null,"id"?: string,"notes"?: string | null,"rehearsal_date": string
                  }
                  Update: {
                    "created_at"?: string | null,"event_id"?: string | null,"id"?: string,"notes"?: string | null,"rehearsal_date"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "worship_rehearsals_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "worship_events"
      referencedColumns: ["id"]
    }
                  ]
                },"worship_team_members": {
                  Row: {
                    "id": string,"member_id": string,"role": string | null,"team_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"member_id": string,"role"?: string | null,"team_id": string
                  }
                  Update: {
                    "id"?: string,"member_id"?: string,"role"?: string | null,"team_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "worship_team_members_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "worship_team_members_team_id_fkey"
      columns: ["team_id"]
isOneToOne: false
      referencedRelation: "worship_teams"
      referencedColumns: ["id"]
    }
                  ]
                },"worship_teams": {
                  Row: {
                    "created_at": string | null,"description": string | null,"id": string,"name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"description"?: string | null,"id"?: string,"name": string
                  }
                  Update: {
                    "created_at"?: string | null,"description"?: string | null,"id"?: string,"name"?: string
                  }
                  Relationships: [
                    
                  ]
                },"youth_mentorship": {
                  Row: {
                    "created_at": string | null,"id": string,"is_active": boolean | null,"mentee_id": string,"mentor_id": string,"notes": string | null,"start_date": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"id"?: string,"is_active"?: boolean | null,"mentee_id": string,"mentor_id": string,"notes"?: string | null,"start_date"?: string | null
                  }
                  Update: {
                    "created_at"?: string | null,"id"?: string,"is_active"?: boolean | null,"mentee_id"?: string,"mentor_id"?: string,"notes"?: string | null,"start_date"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "youth_mentorship_mentee_id_fkey"
      columns: ["mentee_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "youth_mentorship_mentor_id_fkey"
      columns: ["mentor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"youth_programs": {
                  Row: {
                    "age_range": string | null,"created_at": string | null,"description": string | null,"id": string,"is_active": boolean | null,"leader_id": string | null,"location": string | null,"max_participants": number | null,"name": string,"participants_count": number | null,"program_date": string,"program_type": string | null,"updated_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "age_range"?: string | null,"created_at"?: string | null,"description"?: string | null,"id"?: string,"is_active"?: boolean | null,"leader_id"?: string | null,"location"?: string | null,"max_participants"?: number | null,"name": string,"participants_count"?: number | null,"program_date": string,"program_type"?: string | null,"updated_at"?: string | null
                  }
                  Update: {
                    "age_range"?: string | null,"created_at"?: string | null,"description"?: string | null,"id"?: string,"is_active"?: boolean | null,"leader_id"?: string | null,"location"?: string | null,"max_participants"?: number | null,"name"?: string,"participants_count"?: number | null,"program_date"?: string,"program_type"?: string | null,"updated_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "youth_programs_leader_id_fkey"
      columns: ["leader_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "current_app_role":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"has_role":
{ Args: { "allowed": (string)[] }; Returns: boolean
                           },
"keepalive":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"next_member_number":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"peek_next_member_number":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"register_member":
{ Args: { "payload": Json }; Returns: Json
                           },
"sync_member_number_seq":
{ Args: Record<PropertyKey, never>; Returns: number
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            
          }
        }
} as const
