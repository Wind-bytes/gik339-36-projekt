const axios = require("axios");

const UNSPLASH_ENDPOINT = "https://api.unsplash.com/search/photos";
const ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

/**
 * Fetch image from Unsplash with rate limit tracking
 * @param {string} query - e.g. "Toyota Corolla 2020"
 * @returns {Promise<string|null>}
 */
async function getUnsplashImage(query) {
  const parts = query.trim().split(' ');
  const brand = parts[0];
  const model = parts[1];
  
  // Fallback search strategies
  const searchQueries = [
    query,                    // "Toyota Corolla 2020"
    `${brand} ${model}`,      // "Toyota Corolla"
    `${brand} car`,           // "Toyota car"
    brand,                    // "Toyota"
    "car"                     // Generic fallback
  ].filter(q => q);

  console.log(`🔍 Searching Unsplash for: "${query}"`);

  for (let i = 0; i < searchQueries.length; i++) {
    const searchQuery = searchQueries[i];
    
    try {
      console.log(`   ${i + 1}/${searchQueries.length} Trying: "${searchQuery}"`);
      
      const response = await axios.get(UNSPLASH_ENDPOINT, {
        params: {
          query: searchQuery,
          per_page: 1,
          orientation: "landscape"
        },
        headers: {
          Authorization: `Client-ID ${ACCESS_KEY}`
        },
        timeout: 5000
      });

      // Log rate limit info from headers
      const rateLimit = response.headers['x-ratelimit-limit'];
      const remaining = response.headers['x-ratelimit-remaining'];
      console.log(`      ⚡ Rate limit: ${remaining}/${rateLimit} requests remaining`);

      const total = response.data?.total || 0;
      const result = response.data?.results?.[0];
      
      console.log(`      📊 Found ${total} total results`);
      
      if (result && result.urls.small) {
        console.log(`      ✅ Success! Using "${searchQuery}"`);
        console.log(`      📷 Photo by: ${result.user.name}`);
        return result.urls.small;
      }
      
      // If this query returned 0 results, try next fallback
      if (total === 0) {
        console.log(`      ⚠️  0 results, trying next fallback...`);
        continue;
      }
      
    } catch (err) {
      // Check if it's a rate limit error
      if (err.response?.status === 403) {
        console.error(`      🚫 RATE LIMIT EXCEEDED! Wait before making more requests.`);
        return null;
      }
      
      if (err.response?.status === 401) {
        console.error(`      🔑 AUTHENTICATION ERROR! Check your API key.`);
        return null;
      }
      
      console.error(`      ❌ Error: ${err.message}`);
    }
  }

  console.log(`   ⚠️  No images found for any variation of "${query}"`);
  return null;
}

module.exports = { getUnsplashImage };