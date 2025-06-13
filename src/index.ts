import './styles.css';
import { DataFetcher } from './data-fetcher';
import { APKIndexParser } from './apkindex-parser';
import { DependencyVisualizer } from './visualization';
import { DependencyAnalyzer } from './dependency-analyzer';
import { Package } from './types';

class App {
    private dataFetcher: DataFetcher;
    private parser: APKIndexParser;
    private visualizer: DependencyVisualizer;
    private analyzer: DependencyAnalyzer | null = null;
    private packages: Package[] = [];

    constructor() {
        this.dataFetcher = new DataFetcher();
        this.parser = new APKIndexParser();
        this.visualizer = new DependencyVisualizer('visualization', this.showPackageDetails.bind(this));
        
        this.initializeEventListeners();
        this.loadData();
    }

    private initializeEventListeners() {
        const searchInput = document.getElementById('search') as HTMLInputElement;
        const refreshButton = document.getElementById('refresh') as HTMLButtonElement;
        const transitiveCheckbox = document.getElementById('show-transitive') as HTMLInputElement;

        searchInput.addEventListener('input', (e) => {
            const query = (e.target as HTMLInputElement).value;
            this.handleSearch(query);
        });

        refreshButton.addEventListener('click', () => {
            this.loadData();
        });

        transitiveCheckbox.addEventListener('change', () => {
            // Re-visualize current package with new setting
            const query = searchInput.value;
            if (query) {
                this.handleSearch(query);
            }
        });
        
        // Add handler for critical packages button
        const criticalButton = document.getElementById('show-top-packages');
        if (criticalButton) {
            criticalButton.addEventListener('click', () => {
                this.showCriticalPackages();
            });
        }
        
        // Modal close handler
        const closeModal = document.querySelector('.close');
        if (closeModal) {
            closeModal.addEventListener('click', () => {
                const modal = document.getElementById('critical-modal');
                if (modal) modal.classList.add('hidden');
            });
        }
    }

    private async loadData() {
        const loadingElement = document.getElementById('loading');
        const detailsElement = document.getElementById('details');
        
        if (loadingElement) loadingElement.style.display = 'block';
        if (detailsElement) detailsElement.classList.add('hidden');

        try {
            const apkindexContent = await this.dataFetcher.fetchAPKIndex();
            this.packages = this.parser.parse(apkindexContent);
            
            console.log(`Loaded ${this.packages.length} packages`);
            
            this.analyzer = new DependencyAnalyzer(this.packages);
            this.visualizer.setPackages(this.packages);
            
            // Visualize a popular package by default
            const defaultPackage = this.packages.find(p => p.name === 'busybox') || this.packages[0];
            if (defaultPackage) {
                const showTransitive = (document.getElementById('show-transitive') as HTMLInputElement).checked;
                this.visualizer.visualizePackage(defaultPackage.name, 2, showTransitive);
            }
        } catch (error) {
            console.error('Failed to load data:', error);
            alert('Failed to load package data. Please try again.');
        } finally {
            if (loadingElement) loadingElement.style.display = 'none';
        }
    }

    private handleSearch(query: string) {
        if (query.length < 2) return;

        const results = this.visualizer.search(query);
        if (results.length > 0) {
            // Visualize the first search result
            const showTransitive = (document.getElementById('show-transitive') as HTMLInputElement).checked;
            this.visualizer.visualizePackage(results[0].name, 2, showTransitive);
            this.showPackageDetails(results[0]);
        }
    }

    private showPackageDetails(pkg: Package) {
        const detailsElement = document.getElementById('details');
        const packageInfoElement = document.getElementById('package-info');
        
        if (detailsElement && packageInfoElement) {
            detailsElement.classList.remove('hidden');
            
            const dependencyList = pkg.dependencies.map(dep => `<li>${dep}</li>`).join('');
            const providesList = pkg.provides.map(prov => `<li>${prov}</li>`).join('');
            
            packageInfoElement.innerHTML = `
                <h3>${pkg.name} v${pkg.version}</h3>
                <p><strong>Description:</strong> ${pkg.description || 'No description available'}</p>
                <p><strong>Architecture:</strong> ${pkg.architecture}</p>
                <p><strong>Size:</strong> ${(pkg.size / 1024).toFixed(2)} KB</p>
                <p><strong>Installed Size:</strong> ${(pkg.installedSize / 1024).toFixed(2)} KB</p>
                <p><strong>Origin:</strong> ${pkg.origin || 'Unknown'}</p>
                <p><strong>Maintainer:</strong> ${pkg.maintainer || 'Unknown'}</p>
                <p><strong>License:</strong> ${pkg.license || 'Unknown'}</p>
                ${pkg.url ? `<p><strong>URL:</strong> <a href="${pkg.url}" target="_blank">${pkg.url}</a></p>` : ''}
                ${pkg.dependencies.length > 0 ? `
                    <h4>Dependencies (${pkg.dependencies.length}):</h4>
                    <ul>${dependencyList}</ul>
                ` : ''}
                ${pkg.provides.length > 0 ? `
                    <h4>Provides:</h4>
                    <ul>${providesList}</ul>
                ` : ''}
            `;
            
            // Show impressive stats
            this.showPackageStats(pkg);
        }
    }
    
    private showPackageStats(pkg: Package) {
        const statsElement = document.getElementById('package-stats');
        if (!statsElement || !this.analyzer) return;
        
        // Calculate various impressive metrics
        const sizeImpact = this.analyzer.calculateTotalSizeImpact(pkg.name);
        const busFactor = this.analyzer.calculateBusFactor(pkg.name);
        const depthScore = this.analyzer.calculateDependencyDepth(pkg.name);
        
        // Format size nicely
        const formatSize = (bytes: number) => {
            if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
            return `${(bytes / 1024).toFixed(2)} KB`;
        };
        
        // Create impressive visualizations
        statsElement.innerHTML = `
            <div class="stats-section">
                <h4>📊 Impact Analysis</h4>
                
                <div class="stat-item critical">
                    <div class="stat-label">🎯 Criticality Score</div>
                    <div class="stat-value">${busFactor.criticalityScore}</div>
                    <div class="stat-detail">${busFactor.dependentCount} packages directly depend on this</div>
                </div>
                
                <div class="stat-item size">
                    <div class="stat-label">💾 Total Size Impact</div>
                    <div class="stat-value">${formatSize(sizeImpact.totalSize)}</div>
                    <div class="stat-detail">
                        Direct: ${formatSize(sizeImpact.directSize)} + 
                        ${sizeImpact.dependencyCount} dependencies
                    </div>
                </div>
                
                <div class="stat-item depth">
                    <div class="stat-label">🌳 Dependency Depth</div>
                    <div class="stat-value">${depthScore}</div>
                    <div class="stat-detail">${depthScore > 5 ? 'Deep dependency tree!' : 'Shallow dependencies'}</div>
                </div>
                
                ${busFactor.isCommon ? `
                <div class="stat-item warning">
                    <div class="stat-label">⚠️ Common Dependency</div>
                    <div class="stat-detail">This package is a critical infrastructure component!</div>
                </div>
                ` : ''}
                
                ${busFactor.topDependents.length > 0 ? `
                <div class="stat-item">
                    <div class="stat-label">🔝 Top Dependents</div>
                    <ul class="top-dependents">
                        ${busFactor.topDependents.map(d => `<li>${d}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
            </div>
            
            <div class="fun-facts">
                ${sizeImpact.totalSize > 50 * 1024 * 1024 ? 
                    '<p class="fact">💣 This package brings in over 50MB of dependencies!</p>' : ''}
                ${busFactor.criticalityScore > 100 ? 
                    '<p class="fact">🏆 This is a VIP package - handle with care!</p>' : ''}
                ${depthScore > 10 ? 
                    '<p class="fact">🕸️ Dependency inception - we need to go deeper!</p>' : ''}
            </div>
        `;
    }
    
    private showCriticalPackages() {
        if (!this.analyzer) return;
        
        const modal = document.getElementById('critical-modal');
        const contentDiv = document.getElementById('critical-packages');
        if (!modal || !contentDiv) return;
        
        // Get critical packages
        const critical = this.analyzer.findCriticalPackages(20);
        
        // Get some fun stats
        const totalPackages = this.packages.length;
        const leafPackages = this.analyzer.findLeafPackages();
        
        contentDiv.innerHTML = `
            <div class="critical-stats">
                <div class="overview-stat">
                    <div class="big-number">${totalPackages}</div>
                    <div class="stat-desc">Total Packages</div>
                </div>
                <div class="overview-stat">
                    <div class="big-number">${leafPackages.length}</div>
                    <div class="stat-desc">Leaf Packages</div>
                </div>
                <div class="overview-stat">
                    <div class="big-number">${critical[0]?.dependentCount || 0}</div>
                    <div class="stat-desc">Max Dependencies</div>
                </div>
            </div>
            
            <h3>🔥 The Heavy Hitters</h3>
            <div class="critical-list">
                ${critical.map((pkg, index) => `
                    <div class="critical-package" data-package="${pkg.name}">
                        <div class="rank">#${index + 1}</div>
                        <div class="package-name">${pkg.name}</div>
                        <div class="dependent-bar">
                            <div class="bar-fill" style="width: ${pkg.percentage}%"></div>
                        </div>
                        <div class="stats">
                            <span class="dependent-count">${pkg.dependentCount} packages</span>
                            <span class="percentage">${pkg.percentage.toFixed(1)}%</span>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="insights">
                <h4>💡 Insights</h4>
                <p>• <strong>${critical[0]?.name}</strong> is the most critical package - ${critical[0]?.percentage.toFixed(1)}% of all packages depend on it!</p>
                <p>• The top 5 packages affect ${critical.slice(0, 5).reduce((sum, p) => sum + p.percentage, 0).toFixed(1)}% of the ecosystem</p>
                <p>• There are ${leafPackages.length} packages with no dependents (${(leafPackages.length / totalPackages * 100).toFixed(1)}%)</p>
            </div>
        `;
        
        // Add click handlers to critical packages
        modal.classList.remove('hidden');
        
        document.querySelectorAll('.critical-package').forEach(el => {
            el.addEventListener('click', (e) => {
                const pkgName = (e.currentTarget as HTMLElement).dataset.package;
                if (pkgName) {
                    modal.classList.add('hidden');
                    const searchInput = document.getElementById('search') as HTMLInputElement;
                    if (searchInput) {
                        searchInput.value = pkgName;
                        this.handleSearch(pkgName);
                    }
                }
            });
        });
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new App();
});