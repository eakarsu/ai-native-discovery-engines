import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"cf-auto-authorship","title":"Auto-Claimed Authorship Drafts","description":"Prepare a professional advisory report for auto-claimed authorship drafts using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function CfAutoAuthorship({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
