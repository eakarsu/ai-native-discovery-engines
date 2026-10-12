import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"gap-nonai-lab-equipment","title":"Lab Equipment Registry","description":"Prepare a professional advisory report for lab equipment registry using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function GapLabEquipment({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
