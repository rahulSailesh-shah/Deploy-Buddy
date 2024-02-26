const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const mime = require("mime-types");
const Redis = require("ioredis");

const s3Client = new S3Client({
    region: "us-east-1",
    credentials: {
        accessKeyId: "AKIAXYMBNLJHWXEAESN6",
        secretAccessKey: "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",
    },
});

const publisher = new Redis(
    "rediss://default:AVNS_DPRGWqwTnK7zsvqlKeH@redis-34e9652d-shah-1a80.a.aivencloud.com:10181"
);

const PROJECT_ID = process.env.PROJECT_ID;

const publishLog = (log) => {
    publisher.publish(`logs: ${PROJECT_ID}`, JSON.stringify(log));
    console.log("[.] Build complete");
    process.exit(0);
};

async function init() {
    console.log("[.] Executing script.js");
    publishLog("Building...");
    const outDir = path.join(__dirname, "output");

    const p = exec(`cd ${outDir} && npm install && npm run build`);

    p.stdout.on("data", (data) => {
        console.log("[.]", data.toString());
        publishLog(data.toString());
    });

    p.stdout.on("error", (err) => {
        console.log("[x]", err);
        publishLog(`ERROR: ${err}`);
    });

    p.on("close", async () => {
        console.log("[.] Build Complete");
        publishLog("Build Complete...");

        const dist = path.join(__dirname, "output", "dist");
        const files = fs.readdirSync(dist, { recursive: true });

        for (const file of files) {
            const filePath = path.join(dist, file);
            if (fs.lstatSync(filePath).isDirectory()) {
                continue;
            }

            console.log("[.] Uploading", filePath);
            publishLog("Uploading ", file);

            const command = new PutObjectCommand({
                Bucket: "deployment-bucket-outputs",
                Key: `__outputs/${PROJECT_ID}/${file}`,
                Body: fs.createReadStream(filePath),
                ContentType: mime.lookup(filePath),
            });

            await s3Client.send(command);
            console.log("[.] Uploaded", file);
            publishLog("Uploaded ", file);
        }

        publishLog("Done...");
    });
}

init();
