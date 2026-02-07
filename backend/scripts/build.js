const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

// List of handlers to build
// In a full implementation, we could scan the handlers directory
const handlers = [
    'src/handlers/auth/preSignup.ts',
    'src/handlers/auth/postConfirmation.ts',
    'src/handlers/tasks/list.ts',
    'src/handlers/tasks/create.ts',
    'src/handlers/tasks/update.ts',
    'src/handlers/tasks/delete.ts',
    'src/handlers/tasks/get.ts',
    'src/handlers/tasks/assign.ts',
    'src/handlers/users/list.ts',
    'src/handlers/users/get.ts',
    'src/handlers/users/me.ts',
    'src/handlers/users/updateRole.ts',
    'src/handlers/health.ts',
    'src/handlers/notifications/streamProcessor.ts',
    'src/handlers/notifications/emailFormatter.ts'
];


async function build() {
    console.log('🚀 Starting build...');

    try {
        await Promise.all(handlers.map(async (entryPoint) => {
            // Determine output path: dist/handlers/auth/preSignup/index.js
            // This structure allows zipping the 'preSignup' directory
            const relativePath = path.relative('src/handlers', entryPoint);
            const dirName = path.dirname(relativePath);
            const fileName = path.basename(relativePath, '.ts');

            // Output to dist/handlers/<group>/<function>/index.js
            // e.g., dist/auth/preSignup/index.js
            // But to match current terraform expectations which might look for specific paths,
            // let's stick to a clean structure: dist/functions/<name>/index.js

            // Correction: tailored to the user's request for "individual functions", 
            // the best pattern is dist/<name>/index.js or dist/handlers/<name>/index.js

            const outdir = path.join('dist', dirName, fileName);

            console.log(`📦 Bundling ${entryPoint} -> ${outdir}/index.js`);

            await esbuild.build({
                entryPoints: [entryPoint],
                bundle: true,
                minify: true,
                sourcemap: true,
                platform: 'node',
                target: 'node20',
                outfile: path.join(outdir, 'index.js'),
                // Exclude aws-sdk as it's available in Lambda runtime
                external: ['@aws-sdk/*'],
            });
        }));

        console.log('✅ Build complete!');
    } catch (error) {
        console.error('❌ Build failed:', error);
        process.exit(1);
    }
}

build();
