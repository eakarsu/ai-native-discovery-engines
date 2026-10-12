import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"gap-nonai-hypothesis-comments","title":"Hypothesis Comments / Threads","description":"Prepare a professional advisory report for hypothesis comments / threads using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function GapHypothesisComments({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
