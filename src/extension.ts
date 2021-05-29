"use strict";
import * as vscode from 'vscode';
import { LanguageClient } from 'vscode-languageclient/node';

let languageClient:LanguageClient
export function activate(context: vscode.ExtensionContext) {
    try {
        const serverOptions = {
            /**
             * MEMO:
             * oreore.js が今回作成する言語処理系なのですが、第一引数が --language-server になっているときは 
             * Language Server として動作するようにしたい、という算段です。
             */
            command: "node",
            args: [
                context.extensionPath + "/dist/server.js",
                "--language-server"
            ]
        };
        const clientOptions = {
            documentSelector: [
                {
                    scheme: "file",
                    language: "orere",
                }
            ],
        };
        languageClient = new LanguageClient("lspclient-orere", serverOptions, clientOptions);
        context.subscriptions.push(languageClient.start());
    } catch (e) {
        vscode.window.showErrorMessage("lspclient-orere couldn't be started.");
    }
}

export function deactivate() {
    if (languageClient) return languageClient.stop();
}
