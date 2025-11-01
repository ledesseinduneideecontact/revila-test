-- Table pour tracker les webhooks traités et éviter les doublons
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  event_type VARCHAR(50) NOT NULL, -- 'stripe_webhook' ou 'confirm_route'
  stripe_event_id VARCHAR(100), -- evt_xxx pour Stripe uniquement
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  n8n_triggered_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contrainte unique pour éviter les doublons par ordre et type
  UNIQUE(order_id, event_type),
  -- Index unique pour Stripe event_id (évite les replay attacks)
  UNIQUE(stripe_event_id) WHERE stripe_event_id IS NOT NULL
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_webhook_events_order_status ON webhook_events(order_id, status);
CREATE INDEX idx_webhook_events_stripe_id ON webhook_events(stripe_event_id) WHERE stripe_event_id IS NOT NULL;

-- Commentaires
COMMENT ON TABLE webhook_events IS 'Table de déduplication des webhooks - évite les doubles déclenchements N8N';
COMMENT ON COLUMN webhook_events.event_type IS 'Type de webhook: stripe_webhook (checkout.session.completed) ou confirm_route (/api/orders/confirm)';
COMMENT ON COLUMN webhook_events.stripe_event_id IS 'ID unique Stripe (evt_xxx) - permet détecter les rejeux';
COMMENT ON COLUMN webhook_events.status IS 'État: pending → processing → completed/failed';
COMMENT ON COLUMN webhook_events.n8n_triggered_at IS 'Timestamp du déclenchement N8N réussi';