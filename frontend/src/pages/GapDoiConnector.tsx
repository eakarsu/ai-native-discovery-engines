import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"gap-nonai-doi-connector","title":"DOI / External Publication API","description":"Prepare a professional advisory report for doi / external publication api using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function GapDoiConnector({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
