import _ from "lodash";

// Extracted to make testing easy
export function rewriteFilename(filename: string) {
  // Convert backslash to forward slash; Sentry should be able to handle the rest of the formatting:
  filename = filename.split("\\").join("/");

  // Replace windows C: with nothing
  filename = filename.replace(/^[A-Za-z]:/, "");

  // Remove everything including the dendron directory, this is usually stuff like '/Users/someone/...'
  // We have to do two regexes because doing dendron(\.[A-Za-z]*-[0-9.]*)? does not work properly
  const prodRegex = /^\/.*dendron\.[A-Za-z_]*-[0-9.]*\//;
  const devRegex = /^\/.*dendron\//;
  const prefix = "app:///";

  const newFilename = filename.replace(prodRegex, prefix);
  if (newFilename !== filename) {
    return newFilename;
  } else {
    return filename.replace(devRegex, prefix);
  }
}

export function isBadErrorThatShouldBeSampled(
  error: string | Error | { message: string } | null | undefined
) {
  return (
    error &&
    typeof error !== "string" &&
    error.message &&
    error.message.includes("ENOENT: no such file or directory")
  );
}
