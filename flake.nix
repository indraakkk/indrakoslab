{
  description = "indrakoslab — TanStack Start on Cloudflare Workers dev shell";

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

          shellHook = ''
            echo "indrakoslab devshell → node $(node -v) · bun $(bun -v)"
            echo "  bun install && bun run dev"
          '';
        };
      }
    );
}
