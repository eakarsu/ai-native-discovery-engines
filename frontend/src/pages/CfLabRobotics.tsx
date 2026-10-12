import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"cf-lab-robotics","title":"Lab Robotics Integration","description":"Prepare a professional advisory report for lab robotics integration using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function CfLabRobotics({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
