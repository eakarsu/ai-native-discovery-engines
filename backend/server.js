const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/hypotheses', require('./routes/hypotheses'));
app.use('/api/experiments', require('./routes/experiments'));
app.use('/api/results', require('./routes/results'));
app.use('/api/researchers', require('./routes/researchers'));
app.use('/api/publications', require('./routes/publications'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/activity', require('./routes/activity'));
app.use('/api/exports', require('./routes/exports'));
app.use('/api/search', require('./routes/search'));
app.use('/api/admin', require('./routes/sample_data'));
app.use('/api/dashboard', require('./routes/dashboard'));

app.use('/api/gap-ai-citation-impact-predictor', require('./routes/gap-ai-citation-impact-predictor'));
app.use('/api/gap-ai-team-composition-optimizer', require('./routes/gap-ai-team-composition-optimizer'));
app.use('/api/gap-ai-result-significance-test', require('./routes/gap-ai-result-significance-test'));
app.use('/api/gap-ai-protocol-optimizer', require('./routes/gap-ai-protocol-optimizer'));
app.use('/api/gap-ai-auto-iterate-loop', require('./routes/gap-ai-auto-iterate-loop'));
app.use('/api/gap-nonai-lab-equipment', require('./routes/gap-nonai-lab-equipment'));
app.use('/api/gap-nonai-raw-data-uploads', require('./routes/gap-nonai-raw-data-uploads'));
app.use('/api/gap-nonai-hypothesis-comments', require('./routes/gap-nonai-hypothesis-comments'));
app.use('/api/gap-nonai-doi-connector', require('./routes/gap-nonai-doi-connector'));
app.use('/api/gap-nonai-protocol-versioning', require('./routes/gap-nonai-protocol-versioning'));
app.use('/api/gap-nonai-reproducibility-package', require('./routes/gap-nonai-reproducibility-package'));
app.use('/api/cf-lab-robotics', require('./routes/cf-lab-robotics'));
app.use('/api/cf-auto-authorship', require('./routes/cf-auto-authorship'));
app.use('/api/cf-self-driving-lab', require('./routes/cf-self-driving-lab'));
app.use('/api/cf-eln-export', require('./routes/cf-eln-export'));
app.use('/api/cf-cross-lab-federation', require('./routes/cf-cross-lab-federation'));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`DiscoverAI backend running on port ${PORT}`));
