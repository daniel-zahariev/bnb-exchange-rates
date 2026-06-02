import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["./src/bnb.ts"],
	platform: "neutral",
	inputOptions: {
		resolve: {
			mainFields: ["module", "main"],
		},
	},
	dts: true,
	sourcemap: false,
	exports: true,
	format: {
		esm: {
			target: ["es2015"],
		},
		cjs: {
			target: ["node20"],
		},
	},
	attw: { level: "error" },
	publint: {
		level: "error",
	},
});
