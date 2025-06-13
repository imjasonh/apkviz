# Wolfi APK Dependency Visualizer

An interactive web application for visualizing package dependencies in the [Wolfi](https://wolfi.dev) Linux distribution. Explore the intricate web of dependencies, identify critical packages, and analyze the impact of package choices on your system.

🌐 **Live Demo**: [https://imjasonh.github.io/apkviz/](https://imjasonh.github.io/apkviz/)

## Features

### 🔍 Interactive Dependency Exploration
- **Force-directed graph visualization** using D3.js
- **Bidirectional dependency analysis**: See both what a package depends on AND what depends on it
- **Click any node** to re-center the visualization on that package
- **Real-time search** with auto-complete functionality
- **Transitive dependencies toggle** to show direct vs. full dependency chains

### 📊 Advanced Analytics
- **Criticality Score**: Discover which packages are most depended upon
- **Size Impact Analysis**: Calculate total disk space including all dependencies
- **Dependency Depth**: Measure how deep the dependency tree goes
- **Bus Factor Warnings**: Identify single points of failure in your system

### 🏆 System-wide Insights
- **"Most Critical Packages" dashboard** showing the heavy hitters
- **Percentage of ecosystem** that depends on each package
- **Leaf package identification** (packages with no dependents)
- **Visual differentiation** between direct, transitive, and reverse dependencies

## Getting Started

### Prerequisites
- Node.js 20 or higher
- npm

### Installation
```bash
git clone https://github.com/imjasonh/apkviz.git
cd apkviz
npm install
```

### Development
```bash
# Start development server (opens at http://localhost:8081)
npm start

# Run type checking
npm run typecheck

# Build for production
npm run build

# Update APKINDEX data from Wolfi
npm run fetch-data
```

### Testing
The project includes Playwright-based testing infrastructure:

```bash
# Run browser automation tests
npm run debug  # Opens browser with DevTools
npm run browser-test  # Runs headless tests

# All test outputs are saved to playwright-output/ (gitignored)
```

## Architecture

### Tech Stack
- **TypeScript** for type safety
- **D3.js** for force-directed graph visualization
- **Webpack** for bundling and development server
- **Playwright** for automated testing
- **GitHub Actions** for CI/CD
- **GitHub Pages** for hosting

### Key Components
- `src/visualization.ts` - Core D3.js visualization logic
- `src/dependency-analyzer.ts` - Advanced dependency analysis algorithms
- `src/apkindex-parser.ts` - Parses Wolfi's APKINDEX format
- `src/index.ts` - Main application entry point

### Data Source
The app analyzes Wolfi's APKINDEX file (50MB) which contains metadata for all packages in the distribution. This file is fetched and stored locally in `public/APKINDEX`.

## Usage Tips

### Finding Critical Packages
1. Click the "🏆 Show Most Critical" button
2. See which packages affect the largest percentage of the ecosystem
3. Click any package to explore its dependency graph

### Analyzing Package Impact
1. Search for any package (e.g., "python", "gcc", "nodejs")
2. Check the Impact Analysis panel for:
   - Total size including dependencies
   - Number of packages that depend on it
   - Dependency depth score

### Navigation
- **Click nodes** to re-center on that package
- **Drag nodes** to rearrange the graph
- **Zoom** with mouse wheel or pinch gestures
- **Toggle transitive dependencies** to simplify/expand the view

## Visual Guide

### Arrow Colors
- **Dark blue arrows**: Direct dependencies
- **Light blue dashed arrows**: Transitive dependencies  
- **Red arrows**: Reverse dependencies (packages that depend on this)
- **Red dashed arrows**: Transitive reverse dependencies

### Node Information
- **Hover** over nodes to see version and size
- **Click** nodes to see full package details and analytics
- **Node colors** are automatically assigned for visual distinction

## Contributing

Contributions are welcome! The codebase is well-structured for adding new features:

1. Analytics algorithms go in `src/dependency-analyzer.ts`
2. Visualization enhancements in `src/visualization.ts`
3. New UI features in `src/index.ts` and `src/index.html`

### Pull Request Previews

Every pull request automatically gets a preview deployment! When you open a PR:

1. GitHub Actions builds your changes
2. Deploys to `https://imjasonh.github.io/apkviz/pr-{number}/`
3. Comments on your PR with the preview link
4. Updates the preview when you push new commits
5. Cleans up the preview when the PR is closed

This makes it easy to test changes and share them for review before merging.

## Future Enhancements

- Security vulnerability tracking
- Package freshness/staleness indicators
- Circular dependency detection and visualization
- Dependency conflict analysis
- Export capabilities (SVG, graph data)
- Package comparison tools

## License

This project is open source and available under the ISC License.

---

Built with ❤️ for the Wolfi community. Special thanks to the Wolfi maintainers for creating such a well-structured package ecosystem.