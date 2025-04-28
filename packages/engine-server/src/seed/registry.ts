import { SeedRegistryDict, SEED_REGISTRY } from "@sxltd/common-all";
import { readYAML } from "@sxltd/common-server";

type SeedCommandOpts = {
  id: string;
};

export class SeedRegistry {
  public registry: SeedRegistryDict;

  static create(opts?: { registryFile?: string }) {
    let registry = SEED_REGISTRY;
    if (opts?.registryFile) {
      registry = readYAML(opts.registryFile) as SeedRegistryDict;
    }
    return new SeedRegistry(registry);
  }

  constructor(registry: SeedRegistryDict) {
    this.registry = registry;
  }

  info({ id }: SeedCommandOpts) {
    return this.registry[id];
  }
}
