import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"gap-ai-result-significance-test","title":"Result Significance Test Assistant","description":"Prepare a professional advisory report for result significance test assistant using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function GapResultSignificanceTest({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
