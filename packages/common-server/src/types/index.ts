import { NoteProps } from "@sxltd/common-all";
import execa from "execa";
import axios from "axios";
import _ from "lodash";

export { CommentObject, CommentJSONValue } from "comment-json";

export type DHookFunction = (opts: {
  note: NoteProps;
  execa: typeof execa;
  axios: typeof axios;
  _: typeof _;
}) => Promise<NoteProps>;
