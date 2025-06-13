export class DataFetcher {
    async fetchAPKIndex(): Promise<string> {
        try {
            // Try to fetch from pre-downloaded file first
            // In production (GitHub Pages), we need to use the base path
            const basePath = window.location.pathname.includes('/apkviz/') ? '/apkviz' : '';
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