import {
  ConfigUtils,
  NoteIndexProps,
  NoteLookupUtils,
  NoteProps,
  SearchMode,
} from "@sxltd/common-all";
import { LoadingStatus } from "@sxltd/common-frontend";
import { AutoComplete, Alert, Row, Col, Typography } from "antd";
import React, { useCallback, useEffect, useState } from "react";
import { useCombinedDispatch } from "../features";
import { browserEngineSlice } from "../features/engine";
import { useFetchFuse } from "../utils/useFuse";
import type Fuse from "fuse.js";
import { DendronCommonProps, verifyNoteData } from "../utils/types";
import DendronSpinner from "./DendronSpinner";
import { useDendronLookup, useNoteActive, useNoteBodies } from "../utils/hooks";
import FileTextOutlined from "@ant-design/icons/lib/icons/FileTextOutlined";
import _ from "lodash";
import { useEngineAppSelector } from "../features/engine/hooks";

/** For notes where nothing in the note body matches, only show this many characters for the note body snippet. */
const MAX_NOTE_SNIPPET_LENGTH = 30;
/** For each matching part in the note body, show this many characters before and after the matching part in each snippet. */
const NOTE_SNIPPET_BEFORE_AFTER = 100;
/** Place this in place of omitted text in between snippet parts. */
const OMITTED_PART_TEXT = " ... ";
/** How long to wait for before triggering fuse search, in ms. Required for performance reasons since fuse search is expensive. */
const SEARCH_DELAY = 300;

/** Cap search results count at some reasonable number */
const MAX_SEARCH_RESULTS = 30;

export function DendronSearch(props: DendronCommonProps) {
  return <DebouncedDendronSearchComponent {...props} />;
}

type SearchFunction = (
  query: string,
  setResults: (results: SearchResults) => void
) => void;

function DebouncedDendronSearchComponent(props: DendronCommonProps) {
  // Splitting this part from DendronSearchComponent so that the debounced
  // function doesn't get reset every time value changes.
  const results = useFetchFuse(props.notes);
  const { fuse } = results;
  // debounce returns stale results until the timeout runs out, which means
  // search would always show stale results. Having the debounced function set
  // state allows the component the update when the function finally runs and
  // gets fresh results.
  const debouncedSearch: SearchFunction | undefined = fuse
    ? _.debounce<SearchFunction>((query, setResults) => {
        if (_.isUndefined(query)) {
          return;
        }
        const searchQuery = query.startsWith("?") ? query.substring(1) : query;
        const fuseResults = fuse
          .search(searchQuery)
          .slice(0, MAX_SEARCH_RESULTS);

        setResults(fuseResults);
      }, SEARCH_DELAY)
    : undefined;
  return (
    <DendronSearchComponent {...props} {...results} search={debouncedSearch} />
  );
}

type SearchResults = Fuse.FuseResult<NoteProps>[] | undefined;

type SearchProps = Omit<ReturnType<typeof useFetchFuse>, "fuse"> & {
  search: SearchFunction | undefined;
};

enum PlaceholderText {
  SEARCH = "For lookup please use the '/' prefix. e.g. /root",
  LOOKUP = "For full text search please use the '?' prefix. e.g. ? Onboarding",
}

function DendronSearchComponent(props: DendronCommonProps & SearchProps) {
  const { noteIndex, dendronRouter, search, error, notes } = props;

  const engine = useEngineAppSelector((state) => state.engine);
  const defaultSearchMode = engine.config
    ? ConfigUtils.getSearchMode(engine.config)
    : SearchMode.LOOKUP;

  const [searchResults, setSearchResults] =
    React.useState<SearchResults>(undefined);
  const [lookupResults, setLookupResults] = React.useState<NoteIndexProps[]>(
    []
  );
  const [searchMode, setSearchMode] =
    React.useState<SearchMode>(defaultSearchMode);

  const dispatch = useCombinedDispatch();
  const { noteBodies, requestNotes } = useNoteBodies();
  const lookup = useDendronLookup(props.notes);
  const { noteActive } = useNoteActive(dendronRouter.getActiveNoteId());
  const initValue = noteActive?.fname || "";
  const [searchQueryValue, setSearchQueryValue] = React.useState(initValue);

  const [placeholderText, setPlaceholderText] = useState<PlaceholderText>(
    PlaceholderText.LOOKUP
  );

  useEffect(() => {
    if (searchMode === SearchMode.SEARCH)
      setPlaceholderText(PlaceholderText.SEARCH);
    else setPlaceholderText(PlaceholderText.LOOKUP);
  }, [searchMode]);

  useEffect(() => {
    setSearchMode(defaultSearchMode);
  }, [defaultSearchMode]);

  useEffect(() => {
    if (search) {
      search(searchQueryValue, setSearchResults);
    }
  }, [searchQueryValue, search]);

  useEffect(() => {
    requestNotes(searchResults?.map(({ item: note }) => note.id) || []);
  }, [requestNotes, searchResults]);

  useEffect(() => {
    if (searchQueryValue?.startsWith("?")) {
      setSearchMode(SearchMode.SEARCH);
    } else if (searchQueryValue?.startsWith("/")) {
      setSearchMode(SearchMode.LOOKUP);
    } else {
      setSearchMode(defaultSearchMode);
    }
  }, [searchQueryValue]);

  const onLookup = useCallback(
    async (qs: string) => {
      if (_.isUndefined(qs) || !notes || !verifyNoteData({ notes })) {
        return;
      }
      const lookupQuery = qs.startsWith("/") ? qs.substring(1) : qs;
      const out =
        qs === ""
          ? await NoteLookupUtils.fetchRootResults(notes)
          : lookup?.queryNote({ qs: lookupQuery, originalQS: lookupQuery });

      setLookupResults(_.isUndefined(out) ? [] : out);
    },
    [lookup, notes, setLookupResults]
  );

  // This is needed to make sure the lookup results are updated when notes are fetched
  useEffect(() => {
    if (searchMode === SearchMode.LOOKUP) {
      onLookup(searchQueryValue);
    }
  }, [notes]); // intentionally not including searchQueryValue, so that it triggers only when notes are fetched

  const onClickLookup = useCallback(() => {
    const qs = NoteLookupUtils.getQsForCurrentLevel(initValue);
    onLookup(qs);
  }, [initValue, onLookup]);

  const onChangeLookup = useCallback(
    (val: string) => {
      setSearchQueryValue(val);
      onLookup(val);
    },
    [onLookup, setSearchQueryValue]
  );

  const onChangeSearch = useCallback(
    (val: string) => {
      setSearchQueryValue(val);
    },
    [setSearchQueryValue]
  );

  const onSelect = useCallback(
    // @ts-ignore
    (_selection, option) => {
      if (!noteIndex) {
        return;
      }

      const id = option.key?.toString()!;
      dendronRouter.changeActiveNote(id, { noteIndex });
      dispatch(
        browserEngineSlice.actions.setLoadingStatus(LoadingStatus.PENDING)
      );
      setSearchQueryValue("");
    },
    [dendronRouter, dispatch, noteIndex]
  );

  if (error) {
    return (
      <Alert
        type="error"
        closable={false}
        message="Error loading data for the search."
      />
    );
  }

  let autocompleteChildren;
  if (!verifyNoteData({ notes })) {
    autocompleteChildren = (
      <AutoComplete.Option value="Loading...">
        <DendronSpinner />
      </AutoComplete.Option>
    );
  } else if (searchMode === SearchMode.SEARCH) {
    autocompleteChildren = searchResults?.map(({ item: note, matches }) => {
      return (
        <AutoComplete.Option key={note.id} value={note.fname}>
          <Row justify="center" align="middle">
            <Col xs={0} md={1}>
              <div style={{ position: "relative", top: -12, left: 0 }}>
                <FileTextOutlined style={{ color: "#43B02A" }} />
              </div>
            </Col>
            <Col
              xs={24}
              sm={24}
              md={11}
              lg={11}
              style={{ borderRight: "1px solid #d4dadf" }}
            >
              <Row>
                <Typography.Text>
                  <TitleHighlight
                    hit={{ item: note, matches }}
                    attribute="title"
                    title={note.title}
                  />
                </Typography.Text>
              </Row>
              <Row>
                <Typography.Text type="secondary" ellipsis>
                  {note.fname}
                </Typography.Text>
              </Row>
            </Col>
            <Col
              className="gutter-row"
              xs={24}
              sm={24}
              md={11}
              lg={11}
              offset={1}
            >
              <Row>
                <MatchBody
                  matches={matches}
                  id={note.id}
                  noteBodies={noteBodies}
                />
              </Row>
            </Col>
          </Row>
        </AutoComplete.Option>
      );
    });
  } else {
    autocompleteChildren = lookupResults.map((noteIndex: NoteIndexProps) => {
      return (
        <AutoComplete.Option key={noteIndex.id} value={noteIndex.fname}>
          <div>{noteIndex.fname}</div>
        </AutoComplete.Option>
      );
    });
  }
  return (
    <AutoComplete
      size="large"
      allowClear
      style={{ width: "100%" }}
      value={searchQueryValue}
      getPopupContainer={(trigger) => trigger.parentElement}
      // @ts-ignore
      onClick={searchMode === SearchMode.SEARCH ? () => null : onClickLookup}
      onChange={
        searchMode === SearchMode.SEARCH ? onChangeSearch : onChangeLookup
      }
      // @ts-ignore
      onSelect={onSelect}
      placeholder={placeholderText}
    >
      {autocompleteChildren}
    </AutoComplete>
  );
}

/** Removes repeating newlines from the text. */
function cleanWhitespace(text: string) {
  return _.trim(text, "\n").replaceAll(/\n\n/g, "");
}

/** For a fuse.js match on a note, renders snippets from the note **body** with the matched parts highlighted.  */
function MatchBody(props: {
  matches: readonly Fuse.FuseResultMatch[] | undefined;
  id: string;
  noteBodies: { [noteId: string]: string };
}) {
  const body = props.noteBodies[props.id];
  // May happen when note bodies are still loading
  if (_.isUndefined(body))
    return <span style={{ fontWeight: "lighter" }}>{OMITTED_PART_TEXT}</span>;
  // Map happen if the note only matches with title
  if (_.isUndefined(props.matches))
    return <>{body.slice(undefined, MAX_NOTE_SNIPPET_LENGTH)}</>;
  const bodyMatches = props.matches
    // Extract the ranges of body matches
    .filter((match) => match.key === "body")
    .flatMap((match) => match.indices)
    // Sort from longest range to the shortest
    .sort(([lStart, lEnd], [rStart, rEnd]) => rEnd - rStart - (lEnd - lStart));
  if (bodyMatches.length === 0)
    return <>{body.slice(undefined, MAX_NOTE_SNIPPET_LENGTH)}</>;

  const renderedBody: (String | JSX.Element)[] = [];
  // For simplicity, we highlight the longest range only. Otherwise output looks too complicated.
  const [startIndex, endIndex] = bodyMatches[0];

  const beforeStart = _.max([0, startIndex - NOTE_SNIPPET_BEFORE_AFTER])!;

  // Add a ... part at the start, if we are not at the start of the note
  renderedBody.push(<OmittedText after={0} before={beforeStart} body={body} />);
  // Add the part before the match as regular text
  renderedBody.push(cleanWhitespace(body.slice(beforeStart, startIndex)));

  // Add the matched part as bold
  renderedBody.push(
    <span
      key={`${props.id}-${startIndex}-${endIndex}`}
      style={{ fontWeight: "bold" }}
    >
      {cleanWhitespace(body.slice(startIndex, endIndex + 1))}
    </span>
  );

  // Add the part after the match as regular text
  const afterEnd = endIndex + 1 + NOTE_SNIPPET_BEFORE_AFTER;
  renderedBody.push(cleanWhitespace(body.slice(endIndex + 1, afterEnd)));

  // Add a ... part at the end, if we're not at the end of the note
  renderedBody.push(
    <OmittedText after={afterEnd} before={body.length} body={body} />
  );

  return (
    <div
      style={{
        wordWrap: "break-word",
        whiteSpace: "pre-wrap",
        fontSize: "0.8rem",
        marginLeft: "8px",
      }}
    >
      {renderedBody}
    </div>
  );
}

/** Shows a "..." part that replaces the part of text after `after` and before `before`. */
function OmittedText(props: { after: number; before: number; body: string }) {
  const { after, before, body } = props;
  if (before <= after) return null; // sanity check
  if (OMITTED_PART_TEXT.length >= before - after) {
    // If the gap is smaller than the "..." text, just show the text in that gap instead
    return <>{cleanWhitespace(body.slice(before, after))}</>;
  } else {
    // If the gap is bigger, then show the "..." text
    return <span style={{ fontWeight: "lighter" }}>{OMITTED_PART_TEXT}</span>;
  }
}

/** For a fuse.js match on a note, renders the note **title** with the matched parts highlighted.  */
// Recursively builds JSX output adding `<mark>` tags around matches
const highlight: (
  i: number,
  indices?: Fuse.FuseResultMatch["indices"],
  value?: string
) => JSX.Element | null = (
  i: number,
  indices?: Fuse.FuseResultMatch["indices"],
  value?: string
) => {
  const pair = indices?.[indices.length - i];

  return !pair ? (
    <>{value}</>
  ) : (
    <>
      {highlight(i + 1, indices, value?.substring(0, pair[0]))}
      <span style={{ fontWeight: "bolder" }}>
        {value?.substring(pair[0], pair[1] + 1)}
      </span>
      {value?.substring(pair[1] + 1)}
    </>
  );
};

const TitleHighlight = ({
  hit,
  attribute,
  title,
}: {
  hit: {
    item: NoteProps;
    matches: readonly Fuse.FuseResultMatch[] | undefined;
  };
  attribute: string;
  title: string;
}): JSX.Element | null => {
  const matches =
    typeof hit.item === "string"
      ? hit.matches?.[0]
      : hit.matches?.find((m) => m.key === attribute);

  if (_.isUndefined(matches)) {
    return <>{title}</>;
  }

  return highlight(1, matches?.indices || [], matches?.value);
};
