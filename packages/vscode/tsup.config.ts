import { defineConfig } from "tsup";

export default defineConfig({
	entry: {
		client: "src/index.ts",
		server:
			"./node_modules/@html1/language-server/bin/html1-language-server.js",
	},
	format: ["cjs"],
	tsconfig: "../../tsconfig.json",
	splitting: true,
	clean: true,
	dts: false,
	external: ["vscode"],
});
