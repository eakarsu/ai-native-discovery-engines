import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"cf-cross-lab-federation","title":"Cross-Lab Federation","description":"Prepare a professional advisory report for cross-lab federation using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function CfCrossLabFederation({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
