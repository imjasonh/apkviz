export class DataFetcher {
    async fetchAPKIndex(): Promise<string> {
        try {
            // Try to fetch from pre-downloaded file first
            const response = await fetch('/APKINDEX');
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