# IoTrace

<div align="center">

![IoTrace Logo](public/cidecode_logo.png)

A powerful IoT evidence extraction and management system specifically designed for WearOS smartwatches.

[![Next.js](https://img.shields.io/badge/Next.js-13.0-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-green?logo=supabase)](https://supabase.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini%20AI-1.5-orange?logo=google)](https://ai.google.dev/)

</div>

## Team Members

- **Pranav Hemanth** - PES1UG23CS433 [GitHub](https://github.com/Pranavh-2004)
- **Pranavjeet Naidu** - PES1UG23CS586 [GitHub](https://github.com/Pranavjeet-Naidu)
- **Shailja Shaktawat** - PES1UG23CS534 [GitHub](https://github.com/euphoricair7)
- **Nishant K Holla** - PES1UG23CS401 [GitHub](https://github.com/nishantHolla)

## Overview

IoTrace is a specialized platform designed for extracting, analyzing, and managing evidence from IoT devices, with a particular focus on WearOS smartwatches. The platform leverages advanced AI capabilities to provide detailed insights into device behavior and patterns.

### Key Features

- 🔍 **Smart Log Extraction**: Automated extraction of logs from WearOS devices
- 📊 **Interactive Visualization**: Real-time data visualization with charts and graphs
- 🤖 **AI-Powered Analysis**: Intelligent log analysis using Google's Gemini AI
- 📄 **Evidence Reports**: Generate comprehensive PDF reports for legal documentation
- 🔒 **Secure Storage**: Enterprise-grade security with Supabase
- 📱 **Responsive Design**: Mobile-first interface for easy access

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn
- Supabase account
- Google Cloud account (for Gemini AI)
- WearOS device (tested with Samsung Watch5 Pro)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/IoTrace.git
cd IoTrace
```

2. Install dependencies:

```bash
cd frontend
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
```

4. Configure your environment variables in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

5. Start the development server:

```bash
npm run dev
```

## Project Structure

```
IoTrace/
├── frontend/                    # Next.js frontend application
│   ├── app/                    # Next.js app directory (pages and routes)
│   │   ├── cases/             # Case management pages
│   │   ├── dashboard/         # Dashboard pages
│   │   ├── login/             # Authentication pages
│   │   └── signup/            # User registration pages
│   ├── components/            # Reusable UI components
│   │   └── ui/                # Base UI components
│   ├── lib/                   # Utility functions and services
│   │   ├── supabase.ts        # Supabase client configuration
│   │   ├── gemini.ts          # Gemini AI integration
│   │   └── pdf-generator.ts   # PDF report generation
│   └── public/                # Static assets
├── backend/                    # Backend services
│   ├── api/                   # API endpoints
│   │   ├── auth/             # Authentication endpoints
│   │   ├── cases/            # Case management endpoints
│   │   └── logs/             # Log processing endpoints
│   ├── services/             # Business logic services
│   │   ├── log-extractor/    # Log extraction service
│   │   ├── data-processor/   # Data processing service
│   │   └── report-generator/ # Report generation service
│   └── utils/                # Utility functions
├── supabase/                  # Supabase configuration
│   ├── migrations/           # Database migrations
│   ├── seed/                 # Seed data
│   └── types/                # TypeScript types
├── scripts/                   # Utility scripts
│   ├── setup.sh              # Project setup script
│   └── deploy.sh             # Deployment script
├── docs/                      # Documentation
│   ├── api/                  # API documentation
│   └── setup/                # Setup guides
├── tests/                     # Test files
│   ├── unit/                 # Unit tests
│   ├── integration/          # Integration tests
│   └── e2e/                  # End-to-end tests
├── .env.example              # Example environment variables
├── package.json              # Project dependencies
├── tsconfig.json             # TypeScript configuration
└── README.md                 # Project documentation
```

## Features in Detail

### Log Extraction

- Automated extraction of system logs from WearOS devices
- Support for multiple log types and formats
- Real-time log streaming and processing

### Data Visualization

- Interactive time-series charts
- Component distribution analysis
- Customizable data views
- Export capabilities

### AI Analysis

- Pattern recognition in device behavior
- Anomaly detection
- Component interaction analysis
- Time-based pattern analysis

### Evidence Reports

- Professional PDF report generation
- AI-enhanced insights
- Customizable report templates
- Secure storage and sharing

## Security

- End-to-end encryption for sensitive data
- Role-based access control
- Secure file storage
- Audit logging

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/) for the React framework
- [Supabase](https://supabase.com/) for the backend infrastructure
- [Google Gemini AI](https://ai.google.dev/) for the AI capabilities
- [Recharts](https://recharts.org/) for the visualization components

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.

---

<div align="center">
Made with ❤️ by the IoTrace Team
</div>
