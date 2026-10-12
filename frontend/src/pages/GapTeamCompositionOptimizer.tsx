import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"gap-ai-team-composition-optimizer","title":"Team Composition Optimizer","description":"Prepare a professional advisory report for team composition optimizer using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function GapTeamCompositionOptimizer({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
