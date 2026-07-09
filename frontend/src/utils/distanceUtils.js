// ── Haversine Distance (km) ──
export const haversineKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

/**
 * Fetches routing distances from OSRM for a list of destinations.
 * Limits to 25 items per chunk to respect URL length and simple limits.
 * 
 * @param {Object} userLocation - { lat, lng }
 * @param {Array} items - Array of items which must have `id`, `latitude`, and `longitude`
 * @returns {Promise<Map>} - Returns a Map of item ID -> distance in km
 */
export const fetchOSRMRouteDistances = async (userLocation, items) => {
    const distanceMap = new Map();
    if (!userLocation || !items || items.length === 0) return distanceMap;

    const validItems = items.filter(item => item.latitude && item.longitude);
    if (validItems.length === 0) return distanceMap;

    // Chunk size of 25 destinations
    const chunkSize = 25;
    const chunks = [];
    for (let i = 0; i < validItems.length; i += chunkSize) {
        chunks.push(validItems.slice(i, i + chunkSize));
    }

    const source = `${userLocation.lng},${userLocation.lat}`;

    for (const chunk of chunks) {
        try {
            const destinations = chunk.map(i => `${i.longitude},${i.latitude}`).join(';');
            const url = `https://router.project-osrm.org/table/v1/driving/${source};${destinations}?sources=0&annotations=distance`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.code === 'Ok' && data.distances && data.distances[0]) {
                const routeDistances = data.distances[0]; // distances from source (index 0) to all points
                // OSRM returns distances in meters. routeDistances[0] is source to source (0m).
                // destinations start at index 1 in the routeDistances array
                chunk.forEach((item, index) => {
                    const distInMeters = routeDistances[index + 1];
                    if (distInMeters !== undefined && distInMeters !== null) {
                        distanceMap.set(item.id, distInMeters / 1000); // convert to km
                    }
                });
            }
        } catch (e) {
            console.warn("OSRM routing API chunk failed, falling back to straight-line distance", e);
        }
    }

    return distanceMap;
};
