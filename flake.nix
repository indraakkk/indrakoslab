{
  description = "indr — TanStack Start on Cloudflare Workers dev shell";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs { inherit system; };
      in
      {
        devShells.default = pkgs.mkShell {
          # Node 22 is required: @cloudflare/vite-plugin uses
          # node:module.registerHooks (added in 22.15), which the repo's
          # macOS system Node 20 and bun's runtime both lack. bun is the
          # package manager / task runner (see package.json scripts).
          packages = [
            pkgs.nodejs_22
            pkgs.bun
            pkgs.git
          ];

          # The repo-pinned CLIs (wrangler, vite, …) go on PATH via the
          # shellHook, so `wrangler ...` works bare in the shell — the exact
          # version `bun run deploy` uses (node_modules), no version skew.
          # We deliberately avoid nixpkgs' `wrangler`: its `workerd` dependency
          # has no aarch64-darwin binary cache and fails to build from source,
          # which would break `nix develop` on Apple Silicon.
          shellHook = ''
            export PATH="$PWD/node_modules/.bin:$PATH"
            echo "indr devshell → node $(node -v) · bun $(bun -v)"
            echo "  wrangler → repo-pinned in node_modules/.bin (run 'bun install' first)"
            echo "  bun install && bun run dev   ·   bun run deploy"
          '';
        };
      }
    );
}
