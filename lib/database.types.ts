export type WaitlistType = 'founder' | 'notify';

export type WaitlistRow = {
  id: string;
  email: string;
  type: WaitlistType;
  confirm_token: string | null;
  confirmed_at: string | null;
  created_at: string;
  ip: string | null;
  user_agent: string | null;
};

export type WaitlistInsert = {
  id?: string;
  email: string;
  type: WaitlistType;
  confirm_token?: string | null;
  confirmed_at?: string | null;
  created_at?: string;
  ip?: string | null;
  user_agent?: string | null;
};

export type WaitlistUpdate = Partial<WaitlistInsert>;

export type Database = {
  public: {
    Tables: {
      waitlist: {
        Row: WaitlistRow;
        Insert: WaitlistInsert;
        Update: WaitlistUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
