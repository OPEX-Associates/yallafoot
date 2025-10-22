# YallaFoot - Football Streaming Links Curation Platform

A modern, SEO-optimized web application for curating and reviewing football streaming links with excellent user experience and community features.

## 🚀 Features

- **Link Curation System**: Community-driven platform for football streaming links
- **User Reviews & Ratings**: Real user feedback on stream quality and reliability
- **SEO Optimized**: Built with Next.js for excellent search engine visibility
- **Responsive Design**: Mobile-first design that works on all devices
- **Legal Compliance**: Proper disclaimers and legal notices
- **Fast Performance**: Static site generation for optimal loading speeds

## 🛠️ Technology Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Deployment**: Netlify (optimized for static export)
- **SEO**: Built-in Next.js SEO optimization with meta tags

## 🏗️ Project Structure

```
YallaFoot/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with SEO meta tags
│   │   ├── page.tsx            # Homepage with hero and featured matches
│   │   ├── matches/            # Live matches page
│   │   └── about/              # About page
│   └── components/
│       ├── Header.tsx          # Navigation header
│       ├── Hero.tsx            # Homepage hero section
│       ├── FeaturedMatches.tsx # Featured matches display
│       ├── Disclaimer.tsx      # Legal disclaimer
│       └── Footer.tsx          # Site footer
├── .github/
│   └── copilot-instructions.md # Project guidelines
├── netlify.toml                # Netlify deployment config
├── next.config.mjs            # Next.js configuration
└── tailwind.config.ts         # Tailwind CSS configuration
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. **Clone the repository** (or use the existing project):
   ```bash
   cd "YallaFoot"
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser** and navigate to `http://localhost:3000`

### Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## 🌐 Deployment on Netlify

This project is optimized for Netlify deployment with static export:

### Automatic Deployment

1. **Connect to Netlify**:
   - Push your code to GitHub/GitLab
   - Connect your repository to Netlify
   - Netlify will automatically detect the build settings

2. **Build Configuration** (already configured in `netlify.toml`):
   - Build command: `npm run build`
   - Publish directory: `out`
   - Node version: 18

### Manual Deployment

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Deploy the `out` folder** to Netlify via drag-and-drop or CLI

### Environment Variables (if needed)

Add these in Netlify dashboard under Site Settings > Environment Variables:
```
NODE_VERSION=18
```

## 📊 SEO Features

- **Optimized Meta Tags**: Comprehensive meta tags for each page
- **Structured Data**: JSON-LD structured data for better search visibility
- **Semantic HTML**: Proper HTML5 semantic elements
- **Performance**: Static generation for fast loading
- **Mobile-First**: Responsive design for mobile search rankings

## ⚖️ Legal Compliance

The platform includes comprehensive legal disclaimers:

- Clear statements about third-party content
- User responsibility notices
- Copyright compliance guidelines
- DMCA procedures
- Privacy and terms of service links

## 🔧 Customization

### Adding New Pages

1. Create a new folder in `src/app/`
2. Add a `page.tsx` file with your component
3. Include proper SEO metadata

### Styling

- Modify `tailwind.config.ts` for custom colors and themes
- Update `src/app/globals.css` for global styles
- Use Tailwind classes throughout components

### Data Sources

Currently uses static data. To integrate with APIs:

1. Create API routes in `src/app/api/`
2. Update components to fetch from your endpoints
3. Consider ISR (Incremental Static Regeneration) for dynamic content

## 🚨 Important Notes

- **Content Responsibility**: This platform curates links but does not host content
- **Legal Compliance**: Users must comply with local laws and regulations
- **Official Sources**: Encourage use of official broadcasters when available
- **Community Guidelines**: Implement proper moderation for user-generated content

## 📈 Performance Optimization

- Static export for maximum speed
- Image optimization (configure in `next.config.mjs`)
- CSS and JS minification
- Caching headers configured in `netlify.toml`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is for educational and demonstration purposes. Ensure compliance with all applicable laws and regulations when deploying.

---

**YallaFoot** - Your ultimate football streaming destination! ⚽