const express = require("express");
const { generateSlug } = require("random-word-slugs");
const { ECSClient, RunTaskCommand } = require("@aws-sdk/client-ecs");
const Redis = require("ioredis");
const { Server } = require("socket.io");

const app = express();
const PORT = 3000;

const ecsClient = new ECSClient({
    region: "us-east-1",
    credentials: {
        accessKeyId: "AKIAXYMBNLJHWXEAESN6",
        secretAccessKey: "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",
    },
});

const config = {
    CLUSTER: "arn:aws:ecs:us-east-1:533384223311:cluster/builder-server",
    TASK: "arn:aws:ecs:us-east-1:533384223311:task-definition/builder-task",
};

const subscriber = new Redis(
    "rediss://default:AVNS_DPRGWqwTnK7zsvqlKeH@redis-34e9652d-shah-1a80.a.aivencloud.com:10181"
);

const io = new Server({ cors: "*" });

io.on("connection", (socket) => {
    socket.on("subscribe", (channel) => {
        socket.join(channel);
        socket.emit("message", `Joined: ${channel}`);
    });
});

io.listen(3001, () => console.log("Socket Server running on 3001"));

app.use(express.json());

app.post("/project", async (req, res) => {
    const { gitURL } = req.body;
    const slug = generateSlug();

    const command = new RunTaskCommand({
        cluster: config.CLUSTER,
        taskDefinition: config.TASK,
        launchType: "FARGATE",
        count: 1,
        networkConfiguration: {
            awsvpcConfiguration: {
                subnets: [
                    "subnet-00fe8fcd08ba2d7da",
                    "subnet-0e6c48fb78ba0a427",
                    "subnet-0eeadc546d688ba05",
                    "subnet-049eeb7720de1e4b8",
                    "subnet-025fe0ce0d53c0216",
                    "subnet-02b015d47dac618f0",
                ],
                securityGroups: ["sg-00e51b47988e986f3"],
                assignPublicIp: "ENABLED",
            },
        },
        overrides: {
            containerOverrides: [
                {
                    name: "build-image",
                    environment: [
                        {
                            name: "GIT_REPOSITORY_URL",
                            value: gitURL,
                        },
                        {
                            name: "PROJECT_ID",
                            value: slug,
                        },
                    ],
                },
            ],
        },
    });

    await ecsClient.send(command);

    return res.status(200).json({
        data: {
            slug,
            url: `http://${slug}.localhost:8000`,
        },
    });
});

const initRedisSubscribe = async () => {
    console.log("Subscribed to logs...");
    subscriber.psubscribe("logs:*");
    subscriber.on("pmessage", (pattern, channel, message) => {
        console.log("CHANNEL", channel);
        console.log(message);
        io.to(channel).emit("message", message);
    });
};

initRedisSubscribe();

app.listen(PORT, () => {
    console.log(`API-Server is running on port ${PORT}`);
});
