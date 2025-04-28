import _ from "lodash";

export type ConfigMapping = {
  clientVersion: string;
  softMapping?: boolean; // config version is mapped to minimum client version, but it's backward's compatible for now.
};

export const CONFIG_TO_MINIMUM_COMPAT_MAPPING: {
  [key: number]: ConfigMapping;
} = {
  5: { clientVersion: "0.1.0", softMapping: true }, // config consolidation (publishing namespace): commented this out because adding this compat mapping would prevent users from keeping the v4 config and still use the cli for publishing. re-enable once we remove backward compatibility.
};

export class CompatUtils {
  static isSoftMapping(opts: { configVersion: number }) {
    const softMapping =
      CONFIG_TO_MINIMUM_COMPAT_MAPPING[opts.configVersion].softMapping;
    return !_.isUndefined(softMapping) && softMapping;
  }
}
