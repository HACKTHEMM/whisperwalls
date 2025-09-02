// Search service for map locations using OpenStreetMap Nominatim API
export interface SearchResult {
  id: string
  name: string
  display_name: string
  lat: number
  lon: number
  type: string
  importance: number
}

export interface SearchSuggestion {
  id: string
  name: string
  display_name: string
  type: string
}

class SearchService {
  private baseUrl = 'https://nominatim.openstreetmap.org'
  private searchTimeout: NodeJS.Timeout | null = null

  // Search for locations with debouncing
  async searchLocations(query: string): Promise<SearchResult[]> {
    if (!query.trim()) return []

    // Clear previous timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout)
    }

    return new Promise((resolve) => {
      this.searchTimeout = setTimeout(async () => {
        try {
          const response = await fetch(
            `${this.baseUrl}/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&extratags=1&namedetails=1`
          )
          
          if (!response.ok) {
            console.error('Search API error:', response.status)
            resolve([])
            return
          }

          const data = await response.json()
          const results: SearchResult[] = data.map((item: any, index: number) => ({
            id: `${item.place_id || index}`,
            name: item.name || item.display_name.split(',')[0],
            display_name: item.display_name,
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            type: item.type || 'unknown',
            importance: item.importance || 0
          }))

          resolve(results)
        } catch (error) {
          console.error('Search error:', error)
          resolve([])
        }
      }, 300) // 300ms debounce
    })
  }

  // Get suggestions as user types
  async getSuggestions(query: string): Promise<SearchSuggestion[]> {
    if (!query.trim()) return []

    try {
      const response = await fetch(
        `${this.baseUrl}/search?format=json&q=${encodeURIComponent(query)}&limit=3&addressdetails=0&extratags=0&namedetails=0`
      )
      
      if (!response.ok) {
        return []
      }

      const data = await response.json()
      return data.map((item: any, index: number) => ({
        id: `${item.place_id || index}`,
        name: item.name || item.display_name.split(',')[0],
        display_name: item.display_name,
        type: item.type || 'unknown'
      }))
    } catch (error) {
      console.error('Suggestions error:', error)
      return []
    }
  }

  // Reverse geocoding to get address from coordinates
  async reverseGeocode(lat: number, lon: number): Promise<string> {
    try {
      const response = await fetch(
        `${this.baseUrl}/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=0`
      )
      
      if (!response.ok) {
        return 'Unknown location'
      }

      const data = await response.json()
      return data.display_name || 'Unknown location'
    } catch (error) {
      console.error('Reverse geocoding error:', error)
      return 'Unknown location'
    }
  }
}

export const searchService = new SearchService()
