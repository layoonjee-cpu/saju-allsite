// Supabase 스키마와 동기화된 타입. supabase gen types로 자동 생성하는 것을 권장하지만,
// 보일러플레이트 1차 빌드는 수동 정의로 시작합니다. 스키마 변경 시 함께 업데이트하세요.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type OrderStatus = "pending" | "paid" | "failed";
export type CalendarKind = "solar" | "lunar";
export type GenderKind = "male" | "female";

type ProfileRow = {
  id: string;
  email: string;
  display_name: string | null;
  phone: string | null;
  is_admin: boolean;
  created_at: string;
};

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  display_order: number;
  is_active: boolean;
  created_at: string;
};

type OrderRow = {
  id: string;
  order_id: string;
  user_id: string | null;
  guest_email: string | null;
  product_id: string;
  amount: number;
  status: OrderStatus;
  toss_payment_key: string | null;
  paid_at: string | null;
  created_at: string;
};

type SajuInputRow = {
  id: string;
  order_id: string;
  name: string | null;
  birth_date: string | null;
  birth_time: string | null;
  time_unknown: boolean;
  gender: GenderKind;
  calendar: CalendarKind;
  concerns: string[];
  dream_content: string | null;
  customer_email: string | null;
  delivery_method: string;   // 'web' | 'email' | 'kakao'
  // 연인/궁합 전용
  partner_name: string | null;
  partner_birth_date: string | null;
  partner_birth_time: string | null;
  partner_time_unknown: boolean;
  partner_gender: string | null;
  partner_calendar: string | null;
  created_at: string;
};

type SajuResultRow = {
  id: string;
  order_id: string;
  myeongsik: Json;
  interpretation_md: string;
  llm_provider: string;
  llm_model: string;
  generation_status: string;   // 'complete' | 'generating' | 'failed'
  pdf_url: string | null;
  raw_saju_json: Json | null;  // 운세위키 API 16종 원본 응답
  email_sent_at: string | null; // 이메일 발송 시각 (7일 열람 만료 기준)
  extra_question: string | null;        // 후기 작성 후 1회 무료 추가 질문
  extra_question_answer: string | null; // 추가 질문 LLM 답변
  created_at: string;
};

type ReviewRow = {
  id: string;
  user_id: string;
  order_id: string;
  product_id: string;
  rating: number;
  content: string;
  is_public: boolean;
  status: string; // 'pending' | 'approved' | 'rejected'
  created_at: string;
};

type SajuApiCallRow = {
  id: string;
  called_at: string;
  success: boolean;
  source: string | null;
};

type TarotReadingRow = {
  id: string;
  order_id: string;
  name: string | null;
  category: "연애" | "금전" | "직업" | "기타" | null;
  question: string | null;
  card_1_id: number;
  card_1_reversed: boolean;
  card_2_id: number;
  card_2_reversed: boolean;
  card_3_id: number;
  card_3_reversed: boolean;
  reading_text: string | null;
  llm_model: string | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          phone?: string | null;
          is_admin?: boolean;
          created_at?: string;
        };
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      products: {
        Row: ProductRow;
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description: string;
          price: number;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<ProductRow>;
        Relationships: [];
      };
      orders: {
        Row: OrderRow;
        Insert: {
          id?: string;
          order_id: string;
          user_id?: string | null;
          guest_email?: string | null;
          customer_email?: string | null;
          delivery_method?: string;
          product_id: string;
          amount: number;
          status?: OrderStatus;
          toss_payment_key?: string | null;
          paid_at?: string | null;
          created_at?: string;
        };
        Update: Partial<OrderRow>;
        Relationships: [];
      };
      saju_inputs: {
        Row: SajuInputRow;
        Insert: {
          id?: string;
          order_id: string;
          name?: string | null;
          birth_date?: string | null;
          birth_time?: string | null;
          time_unknown?: boolean;
          gender?: GenderKind;
          calendar?: CalendarKind;
          concerns?: string[];
          dream_content?: string | null;
          customer_email?: string | null;
          delivery_method?: string;
          partner_name?: string | null;
          partner_birth_date?: string | null;
          partner_birth_time?: string | null;
          partner_time_unknown?: boolean;
          partner_gender?: string | null;
          partner_calendar?: string | null;
          created_at?: string;
        };
        Update: Partial<SajuInputRow>;
        Relationships: [];
      };
      saju_results: {
        Row: SajuResultRow;
        Insert: {
          id?: string;
          order_id: string;
          myeongsik: Json;
          interpretation_md: string;
          llm_provider: string;
          llm_model: string;
          generation_status?: string;
          pdf_url?: string | null;
          raw_saju_json?: Json | null;
          email_sent_at?: string | null;
          created_at?: string;
        };
        Update: Partial<SajuResultRow>;
        Relationships: [];
      };
      reviews: {
        Row: ReviewRow;
        Insert: {
          id?: string;
          user_id: string;
          order_id: string;
          product_id: string;
          rating: number;
          content: string;
          is_public?: boolean;
          status?: string;
          created_at?: string;
        };
        Update: Partial<ReviewRow>;
        Relationships: [];
      };
      saju_api_calls: {
        Row: SajuApiCallRow;
        Insert: {
          id?: string;
          called_at?: string;
          success: boolean;
          source?: string | null;
        };
        Update: Partial<SajuApiCallRow>;
        Relationships: [];
      };
      tarot_readings: {
        Row: TarotReadingRow;
        Insert: {
          id?: string;
          order_id: string;
          name?: string | null;
          category?: "연애" | "금전" | "직업" | "기타" | null;
          question?: string | null;
          card_1_id: number;
          card_1_reversed?: boolean;
          card_2_id: number;
          card_2_reversed?: boolean;
          card_3_id: number;
          card_3_reversed?: boolean;
          reading_text?: string | null;
          llm_model?: string | null;
          created_at?: string;
        };
        Update: Partial<TarotReadingRow>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      order_status: OrderStatus;
      calendar_kind: CalendarKind;
      gender_kind: GenderKind;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
