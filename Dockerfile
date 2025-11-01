# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build arguments for environment variables (seront fournis au build)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG SUPABASE_SERVICE_ROLE_KEY
ARG STRIPE_SECRET_KEY
ARG STRIPE_WEBHOOK_SECRET
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ARG N8N_WEBHOOK_NEW_ORDER_PROD
ARG N8N_WEBHOOK_NEW_ORDER_TEST

# Set environment variables for build (avec valeurs factices par défaut)
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL:-https://fake.supabase.co}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY:-fake-anon-key}
ENV SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY:-fake-service-key}
ENV STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY:-sk_test_fake}
ENV STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET:-whsec_fake}
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:-pk_test_fake}
ENV N8N_WEBHOOK_NEW_ORDER_PROD=${N8N_WEBHOOK_NEW_ORDER_PROD:-https://fake.n8n.io/webhook}
ENV N8N_WEBHOOK_NEW_ORDER_TEST=${N8N_WEBHOOK_NEW_ORDER_TEST:-https://fake.n8n.io/webhook-test}
ENV NODE_ENV=production

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

# Create app user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy next.config.js if it exists
COPY --from=builder /app/next.config.js ./

# Set environment variables (seront remplacées au runtime)
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Expose port
EXPOSE 3000

# Switch to non-root user
USER nextjs

# Start the application
CMD ["npm", "start"]