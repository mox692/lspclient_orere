import { dispatch, sendParseErrorResponse } from './message'
const fs = require("fs");
const log = fs.openSync("/Users/kimuramotoyuki/lspclient-orere/logfile", "w"); // ファイル名は適宜変えてください

const languageServer = () => {
    let buffer = Buffer.from(new Uint8Array(0));
    
    process.stdin.on("readable", () => {
        let chunk:any;
        while (chunk = process.stdin.read()) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        // log出力
        fs.writeSync(log, buffer);

        const bufferString = buffer.toString();
        if (!bufferString.includes("\r\n\r\n")) {
            console.log(`Got invalid request from language client. Msg doesn't have \r\n\r\n.`)
            return
        }

        const headerString = bufferString.split("\r\n\r\n", 1)[0];

        let contentLength = -1;
        let headerLength = headerString.length + 4;
        for (const line of headerString.split("\r\n")) {
            const [key, value] = line.split(": ");
            if (key === "Content-Length") {
                contentLength = parseInt(value, 10);
            }
        }

        if (contentLength === -1) {
            console.log(`Got invalid request from language client. Msg doesn't have Content-Length header.`)
            return
        }
        if (buffer.length < headerLength + contentLength) {
            console.log(`Got invalid request from language client. Unknown Error.`)
            return
        }

        try {
            const msg = JSON.parse(buffer.toString().slice(headerLength, headerLength + contentLength));
            dispatch(msg);
        } catch (err) {
            if (err instanceof SyntaxError) {
                sendParseErrorResponse();
                return;
            } else {
                throw err
            }
        } finally {
            buffer = buffer.slice(headerLength + contentLength);
        }
    });
}

export const logger = (logMsg:string) => {
    fs.writeSync(log, "\n***********************\n")
    fs.writeSync(log, JSON.stringify(logMsg))
    fs.writeSync(log, "\n***********************\n")
}

/**
 * start running server...
 */
if (process.argv.length !== 3) {
    console.log(`usage: ${process.argv[1]} [--language-server|FILE]`);
} else if (process.argv[2] == "--language-server") {
    languageServer();
} else {
    // TODO: interpret(process.argv[2]);
}