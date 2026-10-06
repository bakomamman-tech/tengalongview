import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { callJsonTool } from "./mcpClient.js";
import { readImportedSourceNote } from "./filesystemMcpClient.js";

export interface AgentEvent {
  step: string;
  tool?: string;
  status: "ok" | "warning" | "blocked";
  detail: unknown;
}

export interface AgentRun {
  learnerId: string;
  subject: string;
  plan: string[];
  events: AgentEvent[];
  draft?: any;
  requiresHumanDecision: boolean;
}

const AgentState = Annotation.Root({
  learnerId: Annotation<string>(),
  subject: Annotation<string>(),
  plan: Annotation<string[]>(),
  events: Annotation<AgentEvent[]>({
    reducer: (left, right) => left.concat(right),
    default: () => [],
  }),
  importedSource: Annotation<any>(),
  history: Annotation<any>(),
  pattern: Annotation<any>(),
  draft: Annotation<any>(),
  requiresHumanDecision: Annotation<boolean>(),
});

const planNode = async (state: typeof AgentState.State) => ({
  plan: [
    "Read any imported school source note through the borrowed Filesystem MCP server",
    "Retrieve the learner's historical evidence",
    "Analyse the requested subject across terms and years",
    "Check whether the evidence supports a defensible longitudinal claim",
    "Draft a sourced profile update",
    "Pause for a named teacher to approve, modify, or reject",
  ],
  events: [{ step: "plan", status: "ok" as const, detail: `Plan created for ${state.learnerId} / ${state.subject}.` }],
});

const importedSourceNode = async (state: typeof AgentState.State) => {
  try {
    const importedSource = await readImportedSourceNote(state.learnerId);
    return {
      importedSource,
      events: [{
        step: "import_source",
        tool: "filesystem.read_text_file",
        status: "ok" as const,
        detail: { source: importedSource.path, note: importedSource.text },
      }],
    };
  } catch (error) {
    return {
      events: [{
        step: "import_source",
        tool: "filesystem.read_text_file",
        status: "warning" as const,
        detail: `No imported source note was available: ${error instanceof Error ? error.message : String(error)}`,
      }],
    };
  }
};

const retrieveNode = async (state: typeof AgentState.State) => {
  const history = await callJsonTool("get_learner_history", { learnerId: state.learnerId });
  return {
    history,
    events: [{
      step: "retrieve",
      tool: "get_learner_history",
      status: "ok" as const,
      detail: { learner: history.learner, evidenceCount: history.evidence?.length ?? 0 },
    }],
  };
};

const analyseNode = async (state: typeof AgentState.State) => {
  const pattern = await callJsonTool("analyse_longitudinal_pattern", {
    learnerId: state.learnerId,
    subject: state.subject,
  });

  return {
    pattern,
    events: [{
      step: "analyse",
      tool: "analyse_longitudinal_pattern",
      status: pattern.kind === "insufficient_evidence" ? "warning" as const : "ok" as const,
      detail: pattern,
    }],
  };
};

const draftNode = async (state: typeof AgentState.State) => {
  const draft = await callJsonTool("draft_profile_update", {
    learnerId: state.learnerId,
    subject: state.subject,
  });

  return {
    draft,
    events: [
      { step: "draft", tool: "draft_profile_update", status: "ok" as const, detail: draft },
      {
        step: "human_gate",
        status: "blocked" as const,
        detail: "Waiting for named teacher decision. No profile change has been committed.",
      },
    ],
  };
};

const insufficientNode = async () => ({
  events: [{
    step: "draft",
    status: "blocked" as const,
    detail: "Insufficient evidence: no strength/struggle claim will be drafted.",
  }],
});

const graph = new StateGraph(AgentState)
  .addNode("plan_step", planNode)
  .addNode("import_source", importedSourceNode)
  .addNode("retrieve", retrieveNode)
  .addNode("analyse", analyseNode)
  .addNode("draft_step", draftNode)
  .addNode("insufficient", insufficientNode)
  .addEdge(START, "plan_step")
  .addEdge("plan_step", "import_source")
  .addEdge("import_source", "retrieve")
  .addEdge("retrieve", "analyse")
  .addConditionalEdges(
    "analyse",
    (state) => state.pattern?.kind === "insufficient_evidence" ? "insufficient" : "draft_step",
    ["insufficient", "draft_step"],
  )
  .addEdge("insufficient", END)
  .addEdge("draft_step", END)
  .compile();

export async function runProfileUpdate(learnerId: string, subject: string): Promise<AgentRun> {
  const state = await graph.invoke({ learnerId, subject, requiresHumanDecision: true });

  return {
    learnerId: state.learnerId,
    subject: state.subject,
    plan: state.plan ?? [],
    events: state.events ?? [],
    draft: state.draft,
    requiresHumanDecision: true,
  };
}
