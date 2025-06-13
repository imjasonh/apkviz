import { Package } from './types';

export class APKIndexParser {
    parse(content: string): Package[] {
        const packages: Package[] = [];
        const entries = content.split('\n\n');

        for (const entry of entries) {
            if (!entry.trim()) continue;

            const pkg: Partial<Package> = {
                dependencies: [],
                provides: []
            };

            const lines = entry.split('\n');
            for (const line of lines) {
                const [key, ...valueParts] = line.split(':');
                const value = valueParts.join(':').trim();

                switch (key) {
                    case 'P':
                        pkg.name = value;
                        break;
                    case 'V':
                        pkg.version = value;
                        break;
                    case 'A':
                        pkg.architecture = value;
                        break;
                    case 'S':
                        pkg.size = parseInt(value);
                        break;
                    case 'I':
                        pkg.installedSize = parseInt(value);
                        break;
                    case 'D':
                        pkg.dependencies = value ? value.split(' ').filter(d => d) : [];
                        break;
                    case 'p':
                        pkg.provides = value ? value.split(' ').filter(p => p) : [];
                        break;
                    case 'o':
                        pkg.origin = value;
                        break;
                    case 'm':
                        pkg.maintainer = value;
                        break;
                    case 't':
                        pkg.timestamp = parseInt(value);
                        break;
                    case 'c':
                        pkg.commit = value;
                        break;
                    case 'T':
                        pkg.description = value;
                        break;
                    case 'U':
                        pkg.url = value;
                        break;
                    case 'L':
                        pkg.license = value;
                        break;
                }
            }

            if (pkg.name && pkg.version) {
                packages.push(pkg as Package);
            }
        }

        return packages;
    }

    extractPackageName(dependency: string): string {
        // Remove version constraints and operators
        return dependency.replace(/[<>=~!].*/g, '').trim();
    }
}