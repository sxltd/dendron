import {
  engineSlice,
  ideSlice,
  WorkspaceProps,
} from "@sxltd/common-frontend";

export type { WorkspaceProps };

export type DendronComponent = React.FunctionComponent<DendronProps>;

export type DendronProps = {
  engine: engineSlice.EngineState;
  ide: ideSlice.IDEState;
  workspace: WorkspaceProps;
  isSidePanel?: boolean;
};
