import type {
	Diagnostic,
	LanguageServerPlugin,
	Service,
} from "@volar/language-server/node";
import {
	createConnection,
	startLanguageServer,
} from "@volar/language-server/node";
import * as CssService from "volar-service-css";
import * as EmmetService from "volar-service-emmet";
import * as HtmlService from "volar-service-html";

import { Html1File, language } from "./language";

const plugin: LanguageServerPlugin = (): ReturnType<LanguageServerPlugin> => ({
	extraFileExtensions: [
		{ extension: "html1", isMixedContent: true, scriptKind: 7 },
	],
	resolveConfig(config) {
		// languages
		config.languages ??= {};
		config.languages.html1 ??= language;

		// services
		config.services ??= {};
		config.services.html ??= HtmlService.create();
		config.services.css ??= CssService.create();
		config.services.emmet ??= EmmetService.create();
		config.services.html1 ??= (context): ReturnType<Service> => ({
			provideDiagnostics(document) {
				const [file] = context!.documents.getVirtualFileByUri(document.uri);
				if (!(file instanceof Html1File)) {
					return;
				}

				const styleNodes = file.htmlDocument.roots.filter(
					(root) => root.tag === "style",
				);
				if (styleNodes.length <= 1) {
					return;
				}

				const errors: Diagnostic[] = [];
				for (let index = 1; index < styleNodes.length; index++) {
					errors.push({
						severity: 2,
						range: {
							start: file.document.positionAt(styleNodes[index].start),
							end: file.document.positionAt(styleNodes[index].end),
						},
						source: "html1",
						message: "Only one style tag is allowed.",
					});
				}

				return errors;
			},
		});

		return config;
	},
});

startLanguageServer(createConnection(), plugin);
