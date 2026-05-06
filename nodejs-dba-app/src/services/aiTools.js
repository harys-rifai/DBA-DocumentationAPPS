const websearch = async ({ query, count = 5, type = 'auto' }) => {
  try {
    const response = await fetch('https://api.opencode.ai/v1/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DBA-App/1.0'
      },
      body: JSON.stringify({
        query,
        num_results: count,
        search_type: type,
        context_max_characters: 10000
      })
    });
    
    if (!response.ok) {
      console.warn(`Search API returned ${response.status}, using fallback`);
      return getFallbackSearch(query);
    }
    
    const data = await response.json();
    return data.results || getFallbackSearch(query);
  } catch (err) {
    console.warn('Search API error, using fallback:', err.message);
    return getFallbackSearch(query);
  }
};

const webfetch = async ({ url, format = 'markdown' }) => {
  try {
    const response = await fetch('https://api.opencode.ai/v1/fetch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, format })
    });
    
    if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
    return await response.json();
  } catch (err) {
    console.warn('Fetch API error:', err.message);
    return null;
  }
};

const getFallbackSearch = (query) => {
  const fallbacks = {
    'mysql': [
      { title: 'MySQL 8.0 Reference Manual', snippet: 'Official MySQL documentation for installation, configuration, and administration.', url: 'https://dev.mysql.com/doc/refman/8.0/en/' }
    ],
    'postgresql': [
      { title: 'PostgreSQL 16 Documentation', snippet: 'Official PostgreSQL documentation covering all aspects of database management.', url: 'https://www.postgresql.org/docs/' }
    ],
    'redis': [
      { title: 'Redis Documentation', snippet: 'Official Redis documentation for commands, configuration, and clustering.', url: 'https://redis.io/docs/' }
    ],
  };
  
  const key = Object.keys(fallbacks).find(k => query.toLowerCase().includes(k));
  return key ? fallbacks[key] : [
    { title: 'Database Documentation', snippet: 'Please refer to official documentation for more details.', url: '#' }
  ];
};

module.exports = { websearch, webfetch };
