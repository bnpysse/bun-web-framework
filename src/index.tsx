import '@total-typescript/ts-reset';
import {readdirSync, statSync, existsSync} from 'fs';
import {join as joinPath} from 'path';
import {renderToString} from "react-dom/server";
export const getAllFiles = (directoryPath: string, arrayOfFiles: string[] = []) => {
    // if (!existsSync(directoryPath)) {
    //     console.error(`Directory does not exist: ${directoryPath}`);
    //     return arrayOfFiles;
    // }
    for (const filePath of readdirSync(directoryPath)) {
        if (statSync(joinPath(directoryPath, filePath)).isDirectory())
            arrayOfFiles = getAllFiles(joinPath(directoryPath, filePath));
        else arrayOfFiles.push(joinPath(directoryPath, filePath));
    }
    return arrayOfFiles;
};


const path = joinPath(import.meta.dir, 'pages');

const pages = await Promise.allSettled(
    getAllFiles(path).map(filePath => import(filePath)))
    .then(results => {
        // @ts-ignore
        const _results = results.map(result => result.status === 'fulfilled' ? [result.value.path, result.value.default] as const : null).filter(Boolean);
        // @ts-ignore
        return Object.fromEntries(_results) as Record<string, React.FC>;
    });

console.log(pages);

const server = Bun.serve({
    port: process.env.PORT ?? 3000,
    fetch(request, server) {
        const Page = pages[new URL(request.url).pathname];
        if (!Page) return new Response('404');
        return new Response(renderToString(<Page />), {
            headers: {
                'Content-Type': 'text/html',
            },
        });
    }
});

console.log(`Server listening http://localhost:${server.port}`);

