export interface Customer {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  created_at: string
}

export interface Order {
  id: string
  order_number: string
  customer_id: string
  shipping_address: string
  shipping_address_complement?: string
  shipping_postal_code: string
  shipping_city: string
  shipping_country: string
  subtotal_amount: number
  shipping_amount: number
  discount_amount: number
  total_amount: number
  discount_code?: string
  order_status: 'received' | 'payment_confirmed' | 'in_production' | 'quality_check' | 'packaging' | 'shipped' | 'in_transit' | 'delivered' | 'completed' | 'return_requested' | 'return_received' | 'refunded' | 'cancelled'
  payment_status: 'pending' | 'paid' | 'failed' | 'free'
  payment_intent_id?: string
  payment_method?: string
  message_name?: string
  message_text?: string
  message_signature?: string
  tracking_number?: string
  shipping_carrier?: string
  notes?: string
  admin_notes?: string
  created_at: string
  updated_at: string
  shipped_at?: string
  delivered_at?: string
}

export interface OrderItem {
  id: string
  order_id: string
  item_number: number
  photo_gcs_url: string
  video_gcs_url: string
  photo_filename: string
  video_filename: string
  photo_size_bytes?: number
  video_size_bytes?: number
  photo_mime_type?: string
  video_mime_type?: string
  unit_price: number
  gcs_upload_status: 'uploading' | 'uploaded' | 'verified' | 'missing' | 'error'
  message_text?: string
  message_signature?: string
  nfc_tag_id?: string
  is_printed?: boolean
  last_verified_at?: string
  created_at: string
  gift_address?: string
}

// Alias pour compatibilité
export interface Photo extends OrderItem {}

export interface CartItem {
  id: string
  photoFile?: File
  videoFile?: File
  photoPreview: string
  videoPreview: string
  message: string
  signature: string
  showMessage: boolean
  // Cadeau par item
  giftEnabled?: boolean
  giftRecipient?: string
  giftFirstName?: string
  giftLastName?: string
  giftAddress?: string
  giftPostalCode?: string
  giftCity?: string
  // Orientation de la photo pour l'aperçu et le recadrage
  orientation?: 'portrait' | 'landscape'
  // Source originale haute résolution pour permettre un re-recadrage propre
  photoOriginalUrl?: string
  // Options de photo
  photoSize?: '10x15' | '20x30' | '30x45'
  withFrame?: boolean
}

export const PRICING = {
  photos: {
    1: 9.50,
    2: 7.50, 
    3: 8.50,
    4: 8.50,
    5: 7.50
  },
  shipping: 2.99
}