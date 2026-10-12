import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"gap-ai-citation-impact-predictor","title":"Citation Impact Predictor","description":"Prepare a professional advisory report for citation impact predictor using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function GapCitationImpactPredictor({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
