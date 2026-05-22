const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    summary: { monitored_queries: 42, drifting_queries: 7, stale_corpora: 3, average_relevance_delta: -0.18 },
    drifts: [
      { query: 'battery recycling incentives', corpus: 'policy-index', delta: -0.31, cause: 'new statute language not indexed', action: 'refresh crawl' },
      { query: 'fusion supplier risk', corpus: 'vendor-filings', delta: -0.24, cause: 'ranking rule overweighted old disclosures', action: 'rebalance recency' },
      { query: 'clinical trial endpoints', corpus: 'publications', delta: -0.13, cause: 'answer sessions cite narrow source set', action: 'expand hybrid retrieval' },
    ],
    ranking_rules: [
      { name: 'recency boost', status: 'tune', impact: '+12% freshness' },
      { name: 'citation diversity', status: 'active', impact: '-9% duplicate sources' },
    ],
  });
});

router.post('/rebalance', (req, res) => {
  const { query = 'unknown query', targetFreshness = 0.7 } = req.body || {};
  res.json({
    query,
    targetFreshness,
    recommendation: 'Increase recency weight and trigger corpus refresh before the next answer session.',
    simulation: { relevance_recovery: 0.22, citation_diversity_gain: 0.11 },
  });
});

module.exports = router;
