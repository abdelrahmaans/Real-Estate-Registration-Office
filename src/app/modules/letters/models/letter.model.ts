export type LetterType = 'incoming' | 'outgoing';

export interface Letter {
    id: string;
    letter_number: string;
    serial_number: string;
    type: LetterType;
    category: string;
    letter_date: string;
    sender?: string | null;
    receiver?: string | null;
    subject: string;
    summary?: string | null;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    status?: string;
    attachments_count?: number;
    notes?: string | null;
    created_at: string;
    updated_at: string;
    deleted_at?: string | null;
    created_by?: string | null;
}

export type LetterCreatePayload = Omit<Letter, 'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'attachments_count'>;
