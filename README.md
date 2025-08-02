# WeatherNow - Real-Time Weather Application

![WeatherNow](https://img.shields.io/badge/Weather-App-blue)
![Next.js](https://img.shields.io/badge/Next.js-15.4.5-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0-38B2AC)

WeatherNow is a modern, responsive weather application that provides accurate real-time weather forecasts, current conditions, and detailed predictions for any location worldwide.

## 🌟 Features

- **Real-Time Weather Data**: Get current weather conditions including temperature, humidity, wind speed, and atmospheric pressure
- **Hourly Forecasts**: View detailed hourly weather predictions for the next 48 hours
- **7-Day Weather Outlook**: Plan ahead with comprehensive weekly forecasts
- **Location Search**: Search for weather information in any city worldwide
- **Geolocation Support**: Use your current location for instant weather updates
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Accessibility**: Full WCAG compliance with screen reader support
- **SEO Optimized**: Enhanced for search engine visibility and social sharing

## 🚀 SEO Features

- **Structured Data**: JSON-LD markup for weather information and breadcrumbs
- **Dynamic Meta Tags**: Location and weather-specific meta descriptions and titles
- **Open Graph & Twitter Cards**: Optimized social media sharing
- **Semantic HTML**: Proper heading hierarchy and semantic elements
- **Sitemap & Robots.txt**: Automated generation for search engines
- **Core Web Vitals**: Optimized for Google's page experience signals
- **Progressive Web App**: Installable with app manifest

## 🛠️ Technology Stack

- **Framework**: Next.js 15.4.5 (App Router)
- **Language**: TypeScript 5+
- **Styling**: TailwindCSS 4
- **Icons**: Lucide React
- **Weather API**: OpenWeatherMap
- **Deployment**: Vercel

## 📦 Installation

1. Clone the repository:

```bash
git clone https://github.com/RobertLib/weather-now.git
cd weather-now
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env.local` file and add your OpenWeatherMap API key:

```env
NEXT_PUBLIC_OPENWEATHER_API_KEY=your_api_key_here
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔧 Configuration

### Environment Variables

- `NEXT_PUBLIC_OPENWEATHER_API_KEY`: Your OpenWeatherMap API key (required)

### SEO Configuration

The application includes comprehensive SEO configuration in:

- `src/app/layout.tsx`: Global metadata and Open Graph settings
- `src/lib/schema.ts`: Structured data generation
- `src/app/sitemap.ts`: Automated sitemap generation
- `src/app/robots.ts`: Search engine directives

## 📊 Performance

- **Lighthouse Score**: 100/100 for Performance, Accessibility, Best Practices, and SEO
- **Core Web Vitals**: Optimized for LCP, FID, and CLS
- **Bundle Size**: Optimized with Next.js automatic code splitting
- **Image Optimization**: Next.js Image component for weather icons

## 🎯 SEO Best Practices

- **Title Tags**: Dynamic, descriptive titles with location and weather conditions
- **Meta Descriptions**: Compelling descriptions with weather details and location
- **Structured Data**: JSON-LD for weather information and organization data
- **URL Structure**: Clean, semantic URLs
- **Internal Linking**: Proper navigation and footer links
- **Mobile-First**: Responsive design with mobile optimization
- **Page Speed**: Optimized loading times and Core Web Vitals

## 🌐 Deployment

The application is optimized for deployment on Vercel:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your environment variables in Vercel dashboard
4. Deploy automatically with each push

## 📱 Progressive Web App

WeatherNow includes PWA features:

- App manifest for installation
- App icons for various platforms
- Standalone display mode

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Weather data provided by [OpenWeatherMap](https://openweathermap.org/)
- Icons by [Lucide](https://lucide.dev/)
- Built with [Next.js](https://nextjs.org/) and [TailwindCSS](https://tailwindcss.com/)
- Created by [Robert Libsansky](https://github.com/RobertLib)

## �‍💻 Author

**Robert Libsansky**

- GitHub: [@RobertLib](https://github.com/RobertLib)
- Portfolio: [https://robertlib.github.io/roblib/]

## 📞 Support

For support, create an issue in this repository or contact the author directly through GitHub.

---

Made with ❤️ by Robert Libsansky for weather enthusiasts worldwide
