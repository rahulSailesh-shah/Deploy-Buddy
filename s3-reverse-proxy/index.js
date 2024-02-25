const express = require("express");
const httpProxy = require("http-proxy");

const app = express();
const port = 8000;
const BASE_PATH = `https://deployment-bucket-outputs.s3.amazonaws.com/__outputs`;

const proxy = httpProxy.createProxyServer();

app.use((req, res) => {
    const hostname = req.hostname;
    const subdomain = hostname.split(".")[0];
    const resolvesTo = `${BASE_PATH}/${subdomain}`;
    return proxy.web(req, res, { target: resolvesTo, changeOrigin: true });
});

proxy.on("proxyReq", (proxyReq, req, res) => {
    const url = req.url;
    if (url === "/") proxyReq.path += "index.html";
});

app.listen(port, () => {
    console.log(`Reverse Proxy running on port ${port}`);
});
