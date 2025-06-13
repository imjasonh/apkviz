import * as d3 from 'd3';
import { Package, DependencyGraph, DependencyNode, DependencyLink } from './types';
import { APKIndexParser } from './apkindex-parser';

interface D3Node extends DependencyNode, d3.SimulationNodeDatum {
    x?: number;
    y?: number;
    fx?: number | null;
    fy?: number | null;
}

export class DependencyVisualizer {
    private svg!: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>;
    private simulation!: d3.Simulation<D3Node, DependencyLink>;
    private packages: Package[] = [];
    private reverseDependencies: Map<string, Set<string>> = new Map();
    private parser: APKIndexParser;
    private onPackageSelect: (pkg: Package) => void;

    constructor(containerId: string, onPackageSelect: (pkg: Package) => void) {
        this.parser = new APKIndexParser();
        this.onPackageSelect = onPackageSelect;
        this.initializeSVG(containerId);
    }

    private initializeSVG(containerId: string) {
        const container = d3.select(`#${containerId}`);
        const containerNode = container.node() as HTMLElement;
        if (!containerNode) return;
        const width = containerNode.getBoundingClientRect().width;
        const height = 600;

        this.svg = container
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        // Add zoom behavior
        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => {
                this.svg.select('g').attr('transform', event.transform);
            });

        this.svg.call(zoom);
        this.svg.append('g');
    }

    setPackages(packages: Package[]) {
        this.packages = packages;
        this.buildReverseDependencyIndex();
    }
    
    private buildReverseDependencyIndex() {
        this.reverseDependencies.clear();
        
        for (const pkg of this.packages) {
            for (const dep of pkg.dependencies) {
                const depName = this.parser.extractPackageName(dep);
                if (depName && !depName.startsWith('so:')) {
                    if (!this.reverseDependencies.has(depName)) {
                        this.reverseDependencies.set(depName, new Set());
                    }
                    this.reverseDependencies.get(depName)!.add(pkg.name);
                }
            }
        }
    }

    visualizePackage(packageName: string, depth: number = 2, showTransitive: boolean = true) {
        const graph = showTransitive 
            ? this.buildTransitiveDependencyGraph(packageName)
            : this.buildDependencyGraph(packageName, depth);
        this.renderGraph(graph);
    }

    private buildDependencyGraph(rootPackageName: string, maxDepth: number): { nodes: D3Node[], links: DependencyLink[] } {
        const nodes = new Map<string, D3Node>();
        const links: DependencyLink[] = [];
        const visited = new Set<string>();

        const traverse = (pkgName: string, currentDepth: number) => {
            if (currentDepth > maxDepth || visited.has(pkgName)) return;
            visited.add(pkgName);

            const pkg = this.packages.find(p => p.name === pkgName);
            if (!pkg) return;

            if (!nodes.has(pkgName)) {
                nodes.set(pkgName, {
                    id: pkgName,
                    name: pkg.name,
                    version: pkg.version,
                    size: pkg.size,
                    dependencies: pkg.dependencies
                });
            }

            for (const dep of pkg.dependencies) {
                const depName = this.parser.extractPackageName(dep);
                if (depName) {
                    // Only add links if the target package exists
                    const targetExists = this.packages.some(p => p.name === depName);
                    if (targetExists) {
                        links.push({ source: pkgName, target: depName });
                        traverse(depName, currentDepth + 1);
                    } else if (!depName.startsWith('so:')) {
                        // Create a placeholder node for missing packages (but not for .so libs)
                        if (!nodes.has(depName)) {
                            nodes.set(depName, {
                                id: depName,
                                name: depName,
                                version: 'unknown',
                                size: 0,
                                dependencies: []
                            });
                        }
                        links.push({ source: pkgName, target: depName });
                    }
                }
            }
        };

        traverse(rootPackageName, 0);

        // Ensure all link targets have corresponding nodes
        const validLinks = links.filter(link => {
            const sourceExists = nodes.has(link.source);
            const targetExists = nodes.has(link.target);
            
            if (!targetExists && !link.target.startsWith('so:')) {
                // Create placeholder node for missing target
                nodes.set(link.target, {
                    id: link.target,
                    name: link.target,
                    version: 'external',
                    size: 0,
                    dependencies: []
                });
                return true;
            }
            
            return sourceExists && targetExists;
        });

        return {
            nodes: Array.from(nodes.values()),
            links: validLinks
        };
    }

    private buildTransitiveDependencyGraph(rootPackageName: string): { nodes: D3Node[], links: DependencyLink[] } {
        const nodes = new Map<string, D3Node>();
        const directLinks = new Set<string>();
        const reverseDirectLinks = new Set<string>();
        const allLinks: DependencyLink[] = [];
        
        // First, get all dependencies recursively
        const getAllDependencies = (pkgName: string, visited = new Set<string>()): Set<string> => {
            if (visited.has(pkgName)) return new Set();
            visited.add(pkgName);
            
            const pkg = this.packages.find(p => p.name === pkgName);
            if (!pkg) return new Set();
            
            const dependencies = new Set<string>();
            
            for (const dep of pkg.dependencies) {
                const depName = this.parser.extractPackageName(dep);
                if (depName && !depName.startsWith('so:')) {
                    dependencies.add(depName);
                    // Record direct dependencies
                    directLinks.add(`${pkgName}->${depName}`);
                    
                    // Get transitive dependencies
                    const transitive = getAllDependencies(depName, visited);
                    transitive.forEach(t => dependencies.add(t));
                }
            }
            
            return dependencies;
        };
        
        // Get all reverse dependencies (packages that depend on this one)
        const getAllReverseDependencies = (pkgName: string, visited = new Set<string>()): Set<string> => {
            if (visited.has(pkgName)) return new Set();
            visited.add(pkgName);
            
            const reverseDeps = new Set<string>();
            const directReverseDeps = this.reverseDependencies.get(pkgName) || new Set();
            
            directReverseDeps.forEach(depName => {
                reverseDeps.add(depName);
                reverseDirectLinks.add(`${depName}->${pkgName}`);
                
                // Get transitive reverse dependencies
                const transitive = getAllReverseDependencies(depName, visited);
                transitive.forEach(t => reverseDeps.add(t));
            });
            
            return reverseDeps;
        };
        
        // Get the root package
        const rootPkg = this.packages.find(p => p.name === rootPackageName);
        if (!rootPkg) return { nodes: [], links: [] };
        
        // Add root node
        nodes.set(rootPackageName, {
            id: rootPackageName,
            name: rootPkg.name,
            version: rootPkg.version,
            size: rootPkg.size,
            dependencies: rootPkg.dependencies
        });
        
        // Get all forward dependencies
        const allDeps = getAllDependencies(rootPackageName);
        
        // Get all reverse dependencies
        const allReverseDeps = getAllReverseDependencies(rootPackageName);
        
        // Add nodes for all dependencies
        [...allDeps, ...allReverseDeps].forEach(depName => {
            const pkg = this.packages.find(p => p.name === depName);
            if (pkg) {
                nodes.set(depName, {
                    id: depName,
                    name: pkg.name,
                    version: pkg.version,
                    size: pkg.size,
                    dependencies: pkg.dependencies
                });
            } else {
                nodes.set(depName, {
                    id: depName,
                    name: depName,
                    version: 'external',
                    size: 0,
                    dependencies: []
                });
            }
        });
        
        // Create forward dependency links
        allDeps.forEach(depName => {
            const linkKey = `${rootPackageName}->${depName}`;
            const isDirect = directLinks.has(linkKey);
            allLinks.push({ 
                source: rootPackageName, 
                target: depName,
                type: isDirect ? 'direct' : 'transitive'
            });
        });
        
        // Create reverse dependency links
        allReverseDeps.forEach(depName => {
            const linkKey = `${depName}->${rootPackageName}`;
            const isDirect = reverseDirectLinks.has(linkKey);
            allLinks.push({ 
                source: depName, 
                target: rootPackageName,
                type: isDirect ? 'reverse' : 'reverse-transitive'
            });
        });
        
        return {
            nodes: Array.from(nodes.values()),
            links: allLinks
        };
    }

    private renderGraph(graph: { nodes: D3Node[], links: DependencyLink[] }) {
        const container = this.svg.select('g');
        container.selectAll('*').remove();

        const svgNode = this.svg.node();
        if (!svgNode) return;
        const width = svgNode.getBoundingClientRect().width;
        const height = 600;

        // Create force simulation
        this.simulation = d3.forceSimulation<D3Node, DependencyLink>(graph.nodes)
            .force('link', d3.forceLink<D3Node, DependencyLink>(graph.links)
                .id(d => d.id)
                .distance(100))
            .force('charge', d3.forceManyBody<D3Node>().strength(-300))
            .force('center', d3.forceCenter<D3Node>(width / 2, height / 2))
            .force('collision', d3.forceCollide<D3Node>().radius(25));

        // Add arrow marker definition
        const defs = this.svg.append('defs');
        defs.selectAll('marker')
            .data(['arrow'])
            .enter().append('marker')
            .attr('id', 'arrow')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 25)
            .attr('refY', 0)
            .attr('markerWidth', 8)
            .attr('markerHeight', 8)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', '#999');

        // Create links with arrows
        const link = container.append('g')
            .selectAll('line')
            .data(graph.links)
            .enter().append('line')
            .attr('class', d => {
                const type = (d as any).type || 'direct';
                return `link ${type}`;
            })
            .attr('marker-end', 'url(#arrow)');

        // Create nodes
        const node = container.append('g')
            .selectAll('g')
            .data(graph.nodes)
            .enter().append('g')
            .attr('class', 'node')
            .call(d3.drag<SVGGElement, D3Node>()
                .on('start', this.dragStarted.bind(this))
                .on('drag', this.dragged.bind(this))
                .on('end', this.dragEnded.bind(this)));

        // Add circles
        node.append('circle')
            .attr('r', 20)
            .attr('fill', (d, i) => d3.schemeCategory10[i % 10])
            .on('click', (event, d) => {
                event.stopPropagation();
                // Re-center visualization on clicked node
                const showTransitive = (document.getElementById('show-transitive') as HTMLInputElement)?.checked ?? true;
                this.visualizePackage(d.name, 2, showTransitive);
                
                // Update search box with clicked package name
                const searchInput = document.getElementById('search') as HTMLInputElement;
                if (searchInput) searchInput.value = d.name;
                
                // Also show package details
                const pkg = this.packages.find(p => p.name === d.name);
                if (pkg) this.onPackageSelect(pkg);
            });

        // Add labels
        node.append('text')
            .text(d => d.name)
            .attr('x', 0)
            .attr('y', -10)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px');

        // Add tooltip
        const tooltip = d3.select('body').append('div')
            .attr('class', 'tooltip');

        node.on('mouseover', (event, d) => {
            tooltip.transition().duration(200).style('opacity', .9);
            tooltip.html(`<strong>${d.name}</strong><br/>Version: ${d.version}<br/>Size: ${(d.size / 1024).toFixed(2)} KB`)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', () => {
            tooltip.transition().duration(500).style('opacity', 0);
        });

        // Update positions on tick
        this.simulation.on('tick', () => {
            link
                .attr('x1', d => (d.source as any).x)
                .attr('y1', d => (d.source as any).y)
                .attr('x2', d => (d.target as any).x)
                .attr('y2', d => (d.target as any).y);

            node.attr('transform', d => `translate(${d.x || 0},${d.y || 0})`);
        });
    }

    private dragStarted(event: d3.D3DragEvent<SVGGElement, D3Node, D3Node>, d: D3Node) {
        if (!event.active) this.simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    private dragged(event: d3.D3DragEvent<SVGGElement, D3Node, D3Node>, d: D3Node) {
        d.fx = event.x;
        d.fy = event.y;
    }

    private dragEnded(event: d3.D3DragEvent<SVGGElement, D3Node, D3Node>, d: D3Node) {
        if (!event.active) this.simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    search(query: string): Package[] {
        return this.packages.filter(pkg => 
            pkg.name.toLowerCase().includes(query.toLowerCase()) ||
            pkg.description?.toLowerCase().includes(query.toLowerCase())
        );
    }
}