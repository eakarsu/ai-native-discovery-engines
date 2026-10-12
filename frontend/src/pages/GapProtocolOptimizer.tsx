import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"gap-ai-protocol-optimizer","title":"Protocol Optimizer","description":"Prepare a professional advisory report for protocol optimizer using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function GapProtocolOptimizer({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
