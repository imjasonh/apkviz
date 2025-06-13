export interface Package {
    name: string;
    version: string;
    architecture: string;
    size: number;
    installedSize: number;
    dependencies: string[];
    provides: string[];
    origin: string;
    maintainer: string;
    timestamp: number;
    commit: string;
    description: string;
    url: string;
    license: string;
}

export interface DependencyNode {
    id: string;
    name: string;
    version: string;
    size: number;
    dependencies: string[];
}

export interface DependencyLink {
    source: string;
    target: string;
    type?: 'direct' | 'transitive' | 'reverse' | 'reverse-transitive';
}

export interface DependencyGraph {
    nodes: DependencyNode[];
    links: DependencyLink[];
}