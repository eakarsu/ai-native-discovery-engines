import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"cf-self-driving-lab","title":"Self-Driving Lab Loop","description":"Prepare a professional advisory report for self-driving lab loop using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function CfSelfDrivingLab({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
