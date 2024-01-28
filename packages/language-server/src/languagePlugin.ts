import type {
	CodeMapping,
	LanguagePlugin,
	VirtualCode,
} from "@volar/language-core";
import { forEachEmbeddedCode } from "@volar/language-core";
import type * as ts from "typescript";
import * as html from "vscode-html-languageservice";

export const html1LanguagePlugin: LanguagePlugin<Html1GeneratedCode> = {
	createVirtualCode(_id, langaugeId, snapshot) {
		if (langaugeId === "html1") {
			return new Html1GeneratedCode(snapshot);
		}
	},
	updateVirtualCode(_id, html1File, snapshot) {
		html1File.update(snapshot);

		return html1File;
	},
	typescript: {
		extraFileExtensions: [
			{ extension: "html1", isMixedContent: true, scriptKind: 7 },
		],
		getScript(rootVirtualCode) {
			for (const code of forEachEmbeddedCode(rootVirtualCode)) {
				if (code.id.startsWith("script_")) {
					return {
						code,
						extension: ".ts",
						scriptKind: 1,
					};
				}
			}
		},
	},
};

const htmlLs = html.getLanguageService();

export class Html1GeneratedCode implements VirtualCode {
	public id = "main";
	public languageId = "html1";
	public mappings!: CodeMapping[];
	public embeddedCodes!: VirtualCode[];
	public document!: html.TextDocument;
	public htmlDocument!: html.HTMLDocument;

	constructor(public snapshot: ts.IScriptSnapshot) {
		this.onSnapshotUpdated();
	}

	public update(newSnapshot: ts.IScriptSnapshot) {
		this.snapshot = newSnapshot;
		this.onSnapshotUpdated();
	}

	private onSnapshotUpdated() {
		this.mappings = [
			{
				sourceOffsets: [0],
				generatedOffsets: [0],
				lengths: [this.snapshot.getLength()],
				data: {
					completion: true,
					format: true,
					navigation: true,
					semantic: true,
					structure: true,
					verification: true,
				},
			},
		];
		this.document = html.TextDocument.create(
			"",
			"html",
			0,
			this.snapshot.getText(0, this.snapshot.getLength()),
		);
		this.htmlDocument = htmlLs.parseHTMLDocument(this.document);
		this.embeddedCodes = [];
		this.addStyleTag();
	}

	private addStyleTag() {
		let styles = 0;
		let scripts = 0;
		for (const root of this.htmlDocument.roots) {
			if (
				root.tag === "style" &&
				root.startTagEnd !== undefined &&
				root.endTagStart !== undefined
			) {
				const styleText = this.snapshot.getText(
					root.startTagEnd,
					root.endTagStart,
				);
				this.embeddedCodes.push({
					id: `style_${styles++}`,
					languageId: "css",
					snapshot: {
						getText: (start, end) => styleText.slice(start, end),
						getLength: () => styleText.length,
						getChangeRange: () => undefined,
					},
					mappings: [
						{
							sourceOffsets: [root.startTagEnd],
							generatedOffsets: [0],
							lengths: [styleText.length],
							data: {
								completion: true,
								format: true,
								navigation: true,
								semantic: true,
								structure: true,
								verification: true,
							},
						},
					],
					embeddedCodes: [],
				});
			}
			if (
				root.tag === "script" &&
				root.startTagEnd !== undefined &&
				root.endTagStart !== undefined
			) {
				const text = this.snapshot.getText(root.startTagEnd, root.endTagStart);
				this.embeddedCodes.push({
					id: `script_${scripts++}`,
					languageId: "typescript",
					snapshot: {
						getText: (start, end) => text.slice(start, end),
						getLength: () => text.length,
						getChangeRange: () => undefined,
					},
					mappings: [
						{
							sourceOffsets: [root.startTagEnd],
							generatedOffsets: [0],
							lengths: [text.length],
							data: {
								completion: true,
								format: true,
								navigation: true,
								semantic: true,
								structure: true,
								verification: true,
							},
						},
					],
					embeddedCodes: [],
				});
			}
		}
	}
}
