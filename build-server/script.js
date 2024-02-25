const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const mime = require("mime-types");

const s3Client = new S3Client({
    region: "us-east-1",
    credentials: {
        accessKeyId: "",
        secretAccessKey: "",
    },
});

const PROJECT_ID = process.env.PROJECT_ID;

async function init() {
    console.log("Executing script.js");
    const outDir = path.join(__dirname, "output");

    const p = exec(`cd ${outDir} && npm install && npm run build`);

    p.stdout.on("data", (data) => {
        console.log(data.toString());
    });

    p.stdout.on("error", (err) => {
        console.log(err);
    });

    p.on("close", async () => {
        console.log("Build Complete");

        const dist = path.join(__dirname, "output", "dist");
        const files = fs.readdirSync(dist, { recursive: true });

        for (const file of files) {
            if (fs.lstatSync(file).isDirectory()) {
                continue;
            }

            const command = new PutObjectCommand({
                Bucket: "XXXXXXXXX",
                Key: `__outputs/${PROJECT_ID}/${file}`,
                Body: fs.createReadStream(file),
                ContentType: mime.lookup(file),
            });

            await s3Client.send(command);

            const filePath = path.join(dist, file);
            fs.copyFileSync(filePath, path.join(__dirname, "dist", file));
        }
    });
}
