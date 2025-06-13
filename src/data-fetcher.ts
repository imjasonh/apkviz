export class DataFetcher {
    async fetchAPKIndex(): Promise<string> {
        try {
            // Try to fetch from pre-downloaded file first
            // Handle different deployment scenarios
            let basePath = '';
            const pathname = window.location.pathname;
            
            if (pathname.includes('/apkviz/pr-')) {
                // PR preview deployment
                const match = pathname.match(/\/apkviz\/pr-\d+/);
                basePath = match ? match[0] : '';
            } else if (pathname.includes('/apkviz/')) {
                // Main deployment
                basePath = '/apkviz';
            }
            
            const response = await fetch(`${basePath}/APKINDEX`);
            if (!response.ok) {
                throw new Error(`Failed to fetch APKINDEX: ${response.statusText}`);
            }
            
            return await response.text();
        } catch (error) {
            console.error('Error fetching APKINDEX:', error);
            throw error;
        }
    }
}