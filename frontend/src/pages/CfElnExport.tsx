import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"cf-eln-export","title":"ELN Format Export","description":"Prepare a professional advisory report for eln format export using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function CfElnExport({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
