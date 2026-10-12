import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"gap-ai-auto-iterate-loop","title":"Auto-Iterate Hypothesis Loop","description":"Prepare a professional advisory report for auto-iterate hypothesis loop using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function GapAutoIterateLoop({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
