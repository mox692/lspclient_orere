import * as fs from "fs";
import { logger } from "./server"
import * as encoding from 'text-encoding';
import { Diagnostic } from "vscode";

const diagnostics = [
    {
        range:
        {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 5 }
        },
        message: "diagnostic message 1",
    },
]

const requestTable:any = {}
let publishDiagnosticsCapable = false;

requestTable["initialize"] = (msg:any) => {
    if (msg.params && msg.params.capabilities) {
        if (msg.params.capabilities.textDocument && msg.params.capabilities.textDocument.publishDiagnostics) {
            publishDiagnosticsCapable = true;
        }
    }
    const capabilities = {
        textDocumentSync: 1
    }
    sendMessage({ jsonrpc: "2.0", id: msg.id, result: { capabilities } });
}

const notificationTable:any = {};
notificationTable["initialized"] = (msg:any) => {
    logMessage("initialized!");
}
notificationTable["textDocument/didOpen"] = (msg:any) => {
    const uri = msg.params.textDocument.uri
    const text = msg.params.textDocument.text
    compile(uri, text)
}
notificationTable["textDocument/didChange"] = (msg:any) => {
    if(msg.params.contentChanges.length !== 0) {
        const uri = msg.params.textDocument.uri
        const text = msg.params.textDocument.text
        compile(uri, text)
        sendPublishDiagnostics(uri, diagnostics)
    }
}

notificationTable["textDocument/didSave"] = (msg:any) => {
    logger("saved!!")
}

const compile = (uri:string, src:string) => {
    logMessage(`Got access!! uri: ${uri}, src: ${src}`)
}
function sendPublishDiagnostics(uri:string, diagnostics:any) {
    logger("send1!!!!!!!")
    if (publishDiagnosticsCapable) {
        logger("send2!!!!!!!")
        sendMessage({ jsonrpc: "2.0", method: "textDocument/publishDiagnostics", params: { uri, diagnostics } });
    }
}

/**
 * msgから該当するmsgハンドラを呼ぶ
 * 
 */
export const dispatch = (msg:any) => {

    if ("id" in msg && "method" in msg) { // when get request,
        if (msg.method in requestTable) {
            requestTable[msg.method](msg);
        } else {
            sendMethodNotFoundResponse(msg.id, msg.method)
        }
    } else if ("id" in msg) { // when get response,
        // Ignore.
        // This language server doesn't send any request.
        // If this language server receives a response, that is invalid.
    } else if ("method" in msg) { // notification
        if (msg.method in notificationTable) {
            notificationTable[msg.method](msg);
        }
    } else { // error
        sendInvalidRequestResponse();
    }
}


/**
 * request, responseが最終的にcallするlow levelな関数
 * @param msg
 **/
const sendMessage = (msg:any) => {
    const s = new encoding.TextEncoder().encode(JSON.stringify(msg));
    process.stdout.write(`Content-Length: ${s.length}\r\n\r\n`);
    process.stdout.write(s);
}

/**
 * log message
 * @param msg
 **/
export const logMessage = (message:string) => {
    sendMessage({ jsonrpc: "2.0", method: "window/logMessage", params: { type: 3, message } });
}

/**
 * 特にerror codeが必要になる
 * @param msg
 * 
 **/
const sendErrorResponse = (id:string | null, code:number, message:string) => {
    sendMessage({ jsonrpc: "2.0", id, error: { code, message }});
}


export const sendParseErrorResponse = () => {
    sendErrorResponse(null, -32700, "received an invalid JSON");
}

export const sendInvalidRequestResponse = () => {
    sendErrorResponse(null, -32600, "received an invalid request");
}

export const sendMethodNotFoundResponse = (id:string, method:string) => {
    sendErrorResponse(id, -32601, method + " is not supported");
}