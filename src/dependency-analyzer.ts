import { Package } from './types';

export class DependencyAnalyzer {
    private packages: Package[] = [];
    private dependencyMap: Map<string, Set<string>> = new Map();
    private reverseDependencyMap: Map<string, Set<string>> = new Map();

    constructor(packages: Package[]) {
        this.packages = packages;
        this.buildDependencyMaps();
    }

    private buildDependencyMaps() {
        for (const pkg of this.packages) {
            const deps = new Set<string>();
            for (const dep of pkg.dependencies) {
                const depName = this.extractPackageName(dep);
                if (depName && !depName.startsWith('so:')) {
                    deps.add(depName);
                    
                    if (!this.reverseDependencyMap.has(depName)) {
                        this.reverseDependencyMap.set(depName, new Set());
                    }
                    this.reverseDependencyMap.get(depName)!.add(pkg.name);
                }
            }
            this.dependencyMap.set(pkg.name, deps);
        }
    }

    private extractPackageName(dep: string): string {
        const match = dep.match(/^([^<>=\s]+)/);
        return match ? match[1] : dep;
    }

    // Calculate total size impact including all dependencies
    calculateTotalSizeImpact(packageName: string): {
        directSize: number;
        totalSize: number;
        dependencyCount: number;
        packages: string[];
    } {
        const visited = new Set<string>();
        let totalSize = 0;
        
        const traverse = (pkgName: string) => {
            if (visited.has(pkgName)) return;
            visited.add(pkgName);
            
            const pkg = this.packages.find(p => p.name === pkgName);
            if (pkg) {
                totalSize += pkg.installedSize;
                const deps = this.dependencyMap.get(pkgName) || new Set();
                deps.forEach(dep => traverse(dep));
            }
        };
        
        traverse(packageName);
        
        const pkg = this.packages.find(p => p.name === packageName);
        return {
            directSize: pkg?.installedSize || 0,
            totalSize,
            dependencyCount: visited.size - 1,
            packages: Array.from(visited)
        };
    }

    // Find the most critical packages (most depended upon)
    findCriticalPackages(limit: number = 10): Array<{
        name: string;
        dependentCount: number;
        percentage: number;
    }> {
        const critical = Array.from(this.reverseDependencyMap.entries())
            .map(([name, dependents]) => ({
                name,
                dependentCount: dependents.size,
                percentage: (dependents.size / this.packages.length) * 100
            }))
            .sort((a, b) => b.dependentCount - a.dependentCount)
            .slice(0, limit);
        
        return critical;
    }

    // Detect circular dependencies
    detectCircularDependencies(): Array<string[]> {
        const cycles: string[][] = [];
        const visited = new Set<string>();
        const recursionStack = new Set<string>();
        const path: string[] = [];

        const dfs = (node: string) => {
            visited.add(node);
            recursionStack.add(node);
            path.push(node);

            const deps = this.dependencyMap.get(node) || new Set();
            for (const dep of deps) {
                if (!visited.has(dep)) {
                    dfs(dep);
                } else if (recursionStack.has(dep)) {
                    // Found a cycle
                    const cycleStart = path.indexOf(dep);
                    if (cycleStart !== -1) {
                        cycles.push(path.slice(cycleStart).concat(dep));
                    }
                }
            }

            path.pop();
            recursionStack.delete(node);
        };

        for (const pkg of this.packages) {
            if (!visited.has(pkg.name)) {
                dfs(pkg.name);
            }
        }

        return cycles;
    }

    // Calculate dependency depth
    calculateDependencyDepth(packageName: string): number {
        const visited = new Set<string>();
        
        const getDepth = (pkgName: string, currentDepth: number): number => {
            if (visited.has(pkgName)) return currentDepth;
            visited.add(pkgName);
            
            const deps = this.dependencyMap.get(pkgName) || new Set();
            if (deps.size === 0) return currentDepth;
            
            let maxDepth = currentDepth;
            for (const dep of deps) {
                maxDepth = Math.max(maxDepth, getDepth(dep, currentDepth + 1));
            }
            return maxDepth;
        };
        
        return getDepth(packageName, 0);
    }

    // Find packages with no dependents (leaf packages)
    findLeafPackages(): string[] {
        return this.packages
            .filter(pkg => {
                const dependents = this.reverseDependencyMap.get(pkg.name);
                return !dependents || dependents.size === 0;
            })
            .map(pkg => pkg.name);
    }

    // Calculate bus factor (single point of failure)
    calculateBusFactor(packageName: string): {
        isCommon: boolean;
        dependentCount: number;
        criticalityScore: number;
        topDependents: string[];
    } {
        const dependents = this.reverseDependencyMap.get(packageName) || new Set();
        const dependentCount = dependents.size;
        
        // Calculate criticality based on both direct and transitive impact
        let transitiveImpact = 0;
        dependents.forEach(dep => {
            const subDependents = this.reverseDependencyMap.get(dep) || new Set();
            transitiveImpact += subDependents.size;
        });
        
        const criticalityScore = dependentCount + (transitiveImpact * 0.5);
        
        // Get top dependents sorted by their own importance
        const topDependents = Array.from(dependents)
            .map(dep => ({
                name: dep,
                importance: (this.reverseDependencyMap.get(dep) || new Set()).size
            }))
            .sort((a, b) => b.importance - a.importance)
            .slice(0, 5)
            .map(d => d.name);
        
        return {
            isCommon: dependentCount > 10,
            dependentCount,
            criticalityScore: Math.round(criticalityScore),
            topDependents
        };
    }

    // Find the shortest path between two packages
    findShortestPath(from: string, to: string): string[] | null {
        const queue: string[][] = [[from]];
        const visited = new Set<string>();
        
        while (queue.length > 0) {
            const path = queue.shift()!;
            const current = path[path.length - 1];
            
            if (current === to) return path;
            
            if (!visited.has(current)) {
                visited.add(current);
                const deps = this.dependencyMap.get(current) || new Set();
                
                for (const dep of deps) {
                    if (!visited.has(dep)) {
                        queue.push([...path, dep]);
                    }
                }
            }
        }
        
        return null;
    }
}