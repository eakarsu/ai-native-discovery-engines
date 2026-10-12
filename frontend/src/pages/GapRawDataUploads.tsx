import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"gap-nonai-raw-data-uploads","title":"Raw Data File Attachments","description":"Prepare a professional advisory report for raw data file attachments using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function GapRawDataUploads({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
