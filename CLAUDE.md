# CLAUDE.md - Project Context for AI Assistants

This document provides essential context for AI assistants (particularly Claude) to effectively work on the Wolfi APK Dependency Visualizer project.

## Project Overview

This is a web application that visualizes package dependencies in the Wolfi Linux distribution (NOT Alpine - this is important!). The app provides advanced analytics to help users understand package relationships, identify critical dependencies, and make informed decisions about their system architecture.

## Critical Context

### What This Project Does
1. **Visualizes Wolfi package dependencies** as an interactive force-directed graph
2. **Analyzes package criticality** - which packages are most depended upon
3. **Calculates size impact** - total disk space including all dependencies
4. **Shows both forward and reverse dependencies** - bidirectional analysis
5. **Provides system-wide insights** via the "Most Critical Packages" dashboard

### Key Technical Decisions
- Uses **D3.js force simulation** for graph layout
- **TypeScript** for type safety
- **Single-page application** with no backend required
- **APKINDEX file** (50MB) is pre-downloaded and served statically
- **GitHub Pages** deployment via GitHub Actions
- **Playwright** for automated browser testing

## Important Implementation Details

### Dependency Analysis Algorithm
The `DependencyAnalyzer` class provides several key metrics:
- **Criticality Score**: Direct dependents + (transitive dependents × 0.5)
- **Bus Factor**: Identifies packages that many others depend on
- **Total Size Impact**: Recursively calculates package + all dependencies size
- **Dependency Depth**: Maximum depth of the dependency tree

### Visualization Features
1. **Three types of dependencies rendered differently**:
   - Direct dependencies (solid lines)
   - Transitive dependencies (dashed lines)
   - Reverse dependencies (red lines, showing what depends on this package)

2. **Interactive navigation**:
   - Click any node to re-center the graph on that package
   - Search box updates to show current package
   - Package details panel shows analytics

3. **Performance considerations**:
   - Graph only shows dependencies to depth 2 by default
   - Transitive dependencies can be toggled on/off
   - Force simulation stops after stabilization

### Testing Infrastructure
- All Playwright test outputs go to `playwright-output/` (gitignored)
- Test files are prefixed with `test-` or `demo-`
- The `quick-debug.js` script provides fast screenshot/console capture

## Common Tasks

### Adding New Analytics
1. Add analysis methods to `src/dependency-analyzer.ts`
2. Update `showPackageStats()` in `src/index.ts` to display results
3. Add appropriate styling in `src/styles.css`

### Modifying the Visualization
1. Core D3 logic is in `src/visualization.ts`
2. Graph building logic in `buildDependencyGraph()` and `buildTransitiveDependencyGraph()`
3. Rendering logic in `renderGraph()`

### Updating Data
```bash
npm run fetch-data  # Downloads latest APKINDEX from Wolfi
```

### Deployment
Pushes to main branch automatically trigger GitHub Actions to:
1. Build the project
2. Deploy to GitHub Pages at https://imjasonh.github.io/apkviz/

## Known Issues & Gotchas

1. **APKINDEX size**: The 50MB file triggers GitHub warnings but works fine
2. **Base path**: Production uses `/apkviz/` base path, development uses `/`
3. **Tooltip cleanup**: Must properly manage D3 selections to avoid memory leaks
4. **Force simulation**: Can be CPU intensive with many nodes

## Future Enhancement Ideas

1. **Security analysis**:
   - Highlight packages with known vulnerabilities
   - Show security update paths

2. **Performance optimization**:
   - Implement virtualization for large graphs
   - Add WebGL rendering option

3. **Advanced features**:
   - Circular dependency detection
   - Diff between package versions
   - Export dependency graphs as DOT files

## Testing Approach

When testing changes:
1. Use `npm start` for development
2. Run `node quick-debug.js screenshot` for quick visual checks
3. Use `node demo-impressive.js` for full feature demonstration
4. Check console for errors with `node quick-debug.js console`

## Code Style Guidelines

1. **TypeScript**: Use proper types, avoid `any` when possible
2. **D3.js**: Chain method calls, use arrow functions
3. **CSS**: Use CSS classes over inline styles
4. **Comments**: Focus on WHY not WHAT
5. **Git commits**: Descriptive messages explaining the change

## Important Notes

- **This is for Wolfi, NOT Alpine Linux** - Never confuse the two
- The visualization should **impress friends and shame enemies**
- Focus on **actionable insights** not just pretty graphs
- Performance matters - the app should handle thousands of packages
- The goal is to make dependency management **understandable and fun**

## Contact & Context

This project was created to provide powerful dependency analysis for the Wolfi ecosystem. It should serve as both a practical tool and a showcase of what's possible with modern web technologies and thoughtful data visualization.

When in doubt, prioritize:
1. User experience
2. Actionable insights  
3. Performance
4. Visual appeal

Remember: Great tools make complex systems understandable!