# robopost.ai

AI-powered content automation platform. A Next.js control plane that delegates all AI processing to n8n workflows via webhooks.

## Architecture

This application follows a **control plane pattern**:
- **Next.js App**: User interface, configuration management, webhook triggering, result display
- **n8n Workflows**: All AI processing, content synthesis, RSS fetching, and orchestration

**Critical Rule**: No AI models run in this application. All intelligence is handled externally in n8n.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS (global CSS only)
- **Database/Auth**: Supabase (Phase 2+)
- **Hosting**: Vercel
- **AI/Automation**: n8n (external, via webhooks)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Build

```bash
npm run build
npm start
```

## Project Structure

```
robopost.ai/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Landing page
│   └── globals.css        # Global CSS (Tailwind)
├── components/            # React components
│   └── landing/          # Landing page components
├── lib/                   # Utilities (Phase 2+)
├── types/                 # TypeScript types (Phase 2+)
└── public/                # Static assets
```

## Environment Variables

Copy `env.example` to `.env.local` and fill in the values:

- **EARLY_ACCESS_WEBHOOK_URL**: Webhook URL for early access form submissions (required for early access functionality)
- Phase 2+: Supabase and n8n configuration (see `.env.local.example`)

## Phase Roadmap

### Phase 1: Landing Page ✅
- Next.js setup with TypeScript
- Tailwind CSS configuration
- Landing page with tech-forward bold design
- Feature sections and CTA

### Phase 2: Authentication & Core Setup
- Supabase integration
- User authentication
- Dashboard routes
- RSS source management

### Phase 3: Webhook Integration
- Outbound webhook triggers
- Inbound webhook callbacks
- Agent run tracking
- Result storage

### Phase 4: Advanced Features
- Scheduling UI
- Custom prompts
- Output destinations
- Run history

## Key Architectural Principles

1. **No AI in Next.js**: All AI processing happens in n8n
2. **Stateless & Serverless**: Designed for Vercel deployment
3. **Global CSS Only**: Single `globals.css` file, no CSS modules
4. **Webhook-Based**: Communication with n8n via structured webhooks
5. **Versioned Payloads**: All webhook payloads include version field

## License

ISC

