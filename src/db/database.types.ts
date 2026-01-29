export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  graphql_public: {
    Tables: Record<never, never>;
    Views: Record<never, never>;
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
  public: {
    Tables: {
      long_term_goals: {
        Row: {
          category: string | null;
          created_at: string;
          description: string | null;
          id: string;
          plan_id: string;
          position: number;
          progress_percentage: number;
          title: string;
          updated_at: string;
        };
        Insert: {
          category?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          plan_id: string;
          position?: number;
          progress_percentage?: number;
          title: string;
          updated_at?: string;
        };
        Update: {
          category?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          plan_id?: string;
          position?: number;
          progress_percentage?: number;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "long_term_goals_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "daily_task_summary";
            referencedColumns: ["plan_id"];
          },
          {
            foreignKeyName: "long_term_goals_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "plan_progress";
            referencedColumns: ["plan_id"];
          },
          {
            foreignKeyName: "long_term_goals_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "plans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "long_term_goals_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "weekly_review_completion";
            referencedColumns: ["plan_id"];
          },
          {
            foreignKeyName: "long_term_goals_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "weekly_task_summary";
            referencedColumns: ["plan_id"];
          },
        ];
      };
      milestones: {
        Row: {
          created_at: string;
          description: string | null;
          due_date: string | null;
          id: string;
          is_completed: boolean;
          long_term_goal_id: string;
          position: number;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          is_completed?: boolean;
          long_term_goal_id: string;
          position?: number;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          is_completed?: boolean;
          long_term_goal_id?: string;
          position?: number;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "milestones_long_term_goal_id_fkey";
            columns: ["long_term_goal_id"];
            isOneToOne: false;
            referencedRelation: "long_term_goals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "milestones_long_term_goal_id_fkey";
            columns: ["long_term_goal_id"];
            isOneToOne: false;
            referencedRelation: "milestone_progress";
            referencedColumns: ["goal_id"];
          },
        ];
      };
      plans: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          start_date: string;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          start_date: string;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          start_date?: string;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      task_history: {
        Row: {
          changed_at: string;
          due_day: number | null;
          id: string;
          status: string;
          task_id: string;
        };
        Insert: {
          changed_at?: string;
          due_day?: number | null;
          id?: string;
          status: string;
          task_id: string;
        };
        Update: {
          changed_at?: string;
          due_day?: number | null;
          id?: string;
          status?: string;
          task_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "task_history_task_id_fkey";
            columns: ["task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          },
        ];
      };
      tasks: {
        Row: {
          created_at: string;
          description: string | null;
          due_day: number | null;
          id: string;
          long_term_goal_id: string | null;
          milestone_id: string | null;
          plan_id: string;
          position: number;
          priority: string;
          status: string;
          task_type: string;
          title: string;
          updated_at: string;
          week_number: number | null;
          weekly_goal_id: string | null;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          due_day?: number | null;
          id?: string;
          long_term_goal_id?: string | null;
          milestone_id?: string | null;
          plan_id: string;
          position?: number;
          priority?: string;
          status?: string;
          task_type?: string;
          title: string;
          updated_at?: string;
          week_number?: number | null;
          weekly_goal_id?: string | null;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          due_day?: number | null;
          id?: string;
          long_term_goal_id?: string | null;
          milestone_id?: string | null;
          plan_id?: string;
          position?: number;
          priority?: string;
          status?: string;
          task_type?: string;
          title?: string;
          updated_at?: string;
          week_number?: number | null;
          weekly_goal_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_long_term_goal_id_fkey";
            columns: ["long_term_goal_id"];
            isOneToOne: false;
            referencedRelation: "long_term_goals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_long_term_goal_id_fkey";
            columns: ["long_term_goal_id"];
            isOneToOne: false;
            referencedRelation: "milestone_progress";
            referencedColumns: ["goal_id"];
          },
          {
            foreignKeyName: "tasks_milestone_id_fkey";
            columns: ["milestone_id"];
            isOneToOne: false;
            referencedRelation: "milestones";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "daily_task_summary";
            referencedColumns: ["plan_id"];
          },
          {
            foreignKeyName: "tasks_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "plan_progress";
            referencedColumns: ["plan_id"];
          },
          {
            foreignKeyName: "tasks_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "plans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "weekly_review_completion";
            referencedColumns: ["plan_id"];
          },
          {
            foreignKeyName: "tasks_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "weekly_task_summary";
            referencedColumns: ["plan_id"];
          },
          {
            foreignKeyName: "tasks_weekly_goal_id_fkey";
            columns: ["weekly_goal_id"];
            isOneToOne: false;
            referencedRelation: "weekly_goals";
            referencedColumns: ["id"];
          },
        ];
      };
      user_metrics: {
        Row: {
          created_at: string;
          first_planner_completed: boolean;
          first_planner_created: boolean;
          id: string;
          total_goals_completed: number;
          total_plans_created: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          first_planner_completed?: boolean;
          first_planner_created?: boolean;
          id?: string;
          total_goals_completed?: number;
          total_plans_created?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          first_planner_completed?: boolean;
          first_planner_created?: boolean;
          id?: string;
          total_goals_completed?: number;
          total_plans_created?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      weekly_goals: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          long_term_goal_id: string | null;
          milestone_id: string | null;
          plan_id: string;
          position: number;
          title: string;
          updated_at: string;
          week_number: number;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          long_term_goal_id?: string | null;
          milestone_id?: string | null;
          plan_id: string;
          position?: number;
          title: string;
          updated_at?: string;
          week_number: number;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          long_term_goal_id?: string | null;
          milestone_id?: string | null;
          plan_id?: string;
          position?: number;
          title?: string;
          updated_at?: string;
          week_number?: number;
        };
        Relationships: [
          {
            foreignKeyName: "weekly_goals_long_term_goal_id_fkey";
            columns: ["long_term_goal_id"];
            isOneToOne: false;
            referencedRelation: "long_term_goals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "weekly_goals_long_term_goal_id_fkey";
            columns: ["long_term_goal_id"];
            isOneToOne: false;
            referencedRelation: "milestone_progress";
            referencedColumns: ["goal_id"];
          },
          {
            foreignKeyName: "weekly_goals_milestone_id_fkey";
            columns: ["milestone_id"];
            isOneToOne: false;
            referencedRelation: "milestones";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "weekly_goals_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "daily_task_summary";
            referencedColumns: ["plan_id"];
          },
          {
            foreignKeyName: "weekly_goals_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "plan_progress";
            referencedColumns: ["plan_id"];
          },
          {
            foreignKeyName: "weekly_goals_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "plans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "weekly_goals_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "weekly_review_completion";
            referencedColumns: ["plan_id"];
          },
          {
            foreignKeyName: "weekly_goals_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "weekly_task_summary";
            referencedColumns: ["plan_id"];
          },
        ];
      };
      weekly_reviews: {
        Row: {
          created_at: string;
          id: string;
          is_completed: boolean;
          plan_id: string;
          updated_at: string;
          week_number: number;
          what_did_not_work: string | null;
          what_to_improve: string | null;
          what_worked: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_completed?: boolean;
          plan_id: string;
          updated_at?: string;
          week_number: number;
          what_did_not_work?: string | null;
          what_to_improve?: string | null;
          what_worked?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_completed?: boolean;
          plan_id?: string;
          updated_at?: string;
          week_number?: number;
          what_did_not_work?: string | null;
          what_to_improve?: string | null;
          what_worked?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "weekly_reviews_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "daily_task_summary";
            referencedColumns: ["plan_id"];
          },
          {
            foreignKeyName: "weekly_reviews_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "plan_progress";
            referencedColumns: ["plan_id"];
          },
          {
            foreignKeyName: "weekly_reviews_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "plans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "weekly_reviews_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "weekly_review_completion";
            referencedColumns: ["plan_id"];
          },
          {
            foreignKeyName: "weekly_reviews_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "weekly_task_summary";
            referencedColumns: ["plan_id"];
          },
        ];
      };
    };
    Views: {
      daily_task_summary: {
        Row: {
          completed_tasks: number | null;
          due_day: number | null;
          plan_id: string | null;
          priority_a_tasks: number | null;
          priority_b_tasks: number | null;
          priority_c_tasks: number | null;
          total_tasks: number | null;
          user_id: string | null;
          week_number: number | null;
        };
        Relationships: [];
      };
      milestone_progress: {
        Row: {
          completed_milestones: number | null;
          completion_percentage: number | null;
          goal_id: string | null;
          goal_title: string | null;
          plan_id: string | null;
          total_milestones: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "long_term_goals_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "daily_task_summary";
            referencedColumns: ["plan_id"];
          },
          {
            foreignKeyName: "long_term_goals_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "plan_progress";
            referencedColumns: ["plan_id"];
          },
          {
            foreignKeyName: "long_term_goals_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "plans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "long_term_goals_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "weekly_review_completion";
            referencedColumns: ["plan_id"];
          },
          {
            foreignKeyName: "long_term_goals_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "weekly_task_summary";
            referencedColumns: ["plan_id"];
          },
        ];
      };
      plan_progress: {
        Row: {
          average_progress: number | null;
          completed_goals: number | null;
          plan_id: string | null;
          plan_name: string | null;
          start_date: string | null;
          status: string | null;
          total_goals: number | null;
          user_id: string | null;
        };
        Relationships: [];
      };
      weekly_review_completion: {
        Row: {
          all_questions_answered: boolean | null;
          is_completed: boolean | null;
          plan_id: string | null;
          user_id: string | null;
          week_number: number | null;
        };
        Relationships: [];
      };
      weekly_task_summary: {
        Row: {
          cancelled_tasks: number | null;
          completed_tasks: number | null;
          completion_percentage: number | null;
          pending_tasks: number | null;
          plan_id: string | null;
          postponed_tasks: number | null;
          total_tasks: number | null;
          user_id: string | null;
          week_number: number | null;
        };
        Relationships: [];
      };
    };
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
